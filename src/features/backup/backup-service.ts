import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
	BACKUP_FILE_EXTENSION,
	contentFingerprint,
	isSealedBackup,
	openBackup,
	sealBackup,
	type BackupPayload,
} from '@/data/exporters/backup-format';
import {
	collectBackupPayload,
	replaceWithBackup,
	summarizePayload,
	type RestoreSummary,
} from '@/data/exporters/backup-snapshot';
import { encodeCsv } from '@/data/importers/legacy/csv';
import {
	replaceWithLegacySnapshot,
	type LegacyImportResult,
} from '@/data/importers/legacy/apply-legacy-import';
import {
	decryptLegacyBackup,
	isLegacyEncryptedBackup,
} from '@/data/importers/legacy/decrypt';
import {
	parseLegacyBackup,
	type LegacySnapshot,
} from '@/data/importers/legacy/parse-legacy-backup';
import { listAccounts } from '@/data/repositories/account-repository';
import { listCategories } from '@/data/repositories/category-repository';
import { loadSettings } from '@/data/repositories/settings-repository';
import {
	queryTransactions,
	type TransactionQuery,
} from '@/data/repositories/transaction-repository';
import { toLocalDateTime } from '@/domain/dates';
import { currencyExponent } from '@/domain/money/currency';
import { minorToDecimalString } from '@/domain/money/money';
import { utf8Decode } from '@/lib/crypto/bytes';
import { secureRandomBytes, secureRandomId } from '@/lib/crypto/random';

import {
	readReceiptBase64,
	writeReceiptBase64,
} from '../receipts/receipt-files';
import { withAutoLockSuspended } from '../security/use-app-lock';
import { requireDatabase, useSession } from '../session/session-store';

export type PickedFile = { name: string; bytes: Uint8Array };

export type DetectedBackup =
	| { kind: 'pennywise-2'; file: PickedFile; text: string }
	| { kind: 'legacy-encrypted'; file: PickedFile }
	| { kind: 'legacy-plain'; file: PickedFile; text: string }
	| { kind: 'unrecognised'; file: PickedFile };

const MAX_BACKUP_BYTES = 200 * 1024 * 1024;

export async function pickBackupFile(): Promise<PickedFile | null> {
	const result = await withAutoLockSuspended(() =>
		DocumentPicker.getDocumentAsync({
			type: '*/*',
			copyToCacheDirectory: true,
			multiple: false,
		}),
	);
	if (result.canceled || !result.assets?.[0]) return null;
	const asset = result.assets[0];
	if (asset.size && asset.size > MAX_BACKUP_BYTES)
		throw new Error('This file is too large to be a PennyWise backup.');
	const file = new File(asset.uri);
	try {
		return { name: asset.name, bytes: await file.bytes() };
	} finally {
		if (file.exists) file.delete();
	}
}

export function detectBackup(file: PickedFile): DetectedBackup {
	if (isLegacyEncryptedBackup(file.bytes))
		return { kind: 'legacy-encrypted', file };
	let text: string;
	try {
		text = utf8Decode(file.bytes);
	} catch {
		return { kind: 'unrecognised', file };
	}
	if (isSealedBackup(text)) return { kind: 'pennywise-2', file, text };
	if (/^\uFEFF?type,data\r?\n/.test(text))
		return { kind: 'legacy-plain', file, text };
	return { kind: 'unrecognised', file };
}

export interface LegacyImportPreview {
	snapshot: LegacySnapshot;
	fingerprint: string;
}

export async function prepareLegacyImport(
	backup: DetectedBackup,
	password: string | null,
): Promise<LegacyImportPreview> {
	let text: string;
	if (backup.kind === 'legacy-encrypted') {
		if (!password)
			throw new Error('This backup is encrypted. Enter its password.');
		text = await decryptLegacyBackup(backup.file.bytes, password);
	} else if (backup.kind === 'legacy-plain') {
		text = backup.text;
	} else {
		throw new Error('This is not a PennyWise 1 backup.');
	}
	return {
		snapshot: parseLegacyBackup(text, toLocalDateTime(new Date())),
		fingerprint: contentFingerprint(backup.file.bytes),
	};
}

export async function applyLegacyImport(
	preview: LegacyImportPreview,
	allowRepeat: boolean,
): Promise<LegacyImportResult> {
	const result = await replaceWithLegacySnapshot(
		requireDatabase(),
		preview.snapshot,
		{
			batchId: secureRandomId(),
			contentSha256: preview.fingerprint,
			nowDate: new Date(),
			allowRepeat,
		},
	);
	await reloadSessionSettings();
	return result;
}

export async function prepareRestore(
	backup: DetectedBackup,
	password: string,
): Promise<{ payload: BackupPayload; summary: RestoreSummary }> {
	if (backup.kind !== 'pennywise-2')
		throw new Error('This is not a PennyWise 2 backup.');
	const payload = await openBackup(backup.text, password);
	return { payload, summary: summarizePayload(payload) };
}

export async function applyRestore(
	payload: BackupPayload,
): Promise<RestoreSummary> {
	for (const receipt of payload.receipts)
		await writeReceiptBase64(receipt.file, receipt.base64);
	const summary = await replaceWithBackup(requireDatabase(), payload);
	await reloadSessionSettings();
	return summary;
}

async function reloadSessionSettings(): Promise<void> {
	const settings = await loadSettings(requireDatabase());
	useSession.getState().setSettings(settings);
	useSession.getState().notifyDataChanged();
}

function timestampForFileName(): string {
	return toLocalDateTime(new Date()).slice(0, 16).replace(/[-:T]/g, '');
}

async function shareTemporaryFile(
	name: string,
	content: string,
	mimeType: string,
	uti: string,
): Promise<void> {
	const file = new File(Paths.cache, name);
	try {
		if (file.exists) file.delete();
		file.create();
		file.write(content);
		await withAutoLockSuspended(() =>
			Sharing.shareAsync(file.uri, {
				mimeType,
				UTI: uti,
				dialogTitle: 'Save PennyWise file',
			}),
		);
	} finally {
		if (file.exists) file.delete();
	}
}

export interface BackupExportResult {
	transactions: number;
	receipts: number;
	missingReceipts: number;
}

export async function exportEncryptedBackup(
	password: string,
): Promise<BackupExportResult> {
	const database = requireDatabase();
	const { payload, missingReceipts } = await collectBackupPayload(
		database,
		toLocalDateTime(new Date()),
		readReceiptBase64,
	);
	const sealed = await sealBackup(payload, password, secureRandomBytes);
	await openBackup(sealed, password);
	await shareTemporaryFile(
		`pennywise-${timestampForFileName()}.${BACKUP_FILE_EXTENSION}`,
		sealed,
		'application/octet-stream',
		'public.data',
	);
	return {
		transactions: payload.transactions.length,
		receipts: payload.receipts.length,
		missingReceipts: missingReceipts.length,
	};
}

export async function exportTransactionsCsv(
	query: Omit<TransactionQuery, 'limit' | 'offset'>,
): Promise<number> {
	const database = requireDatabase();
	const [settings, categories, accounts, transactions] = await Promise.all([
		loadSettings(database),
		listCategories(database, true),
		listAccounts(database, true),
		queryTransactions(database, {
			...query,
			limit: Number.MAX_SAFE_INTEGER,
			offset: 0,
		}),
	]);
	const exponent = currencyExponent(settings.currencyCode);
	const names = new Map(
		categories.map((category) => [category.id, category.name]),
	);
	const accountNames = new Map(
		accounts.map((account) => [account.id, account.name]),
	);
	const rows = [
		['Date', 'Type', 'Category', 'Account', 'Amount', 'Currency', 'Note'],
		...transactions.map((tx) => [
			tx.occurredAt.slice(0, 10),
			tx.type.toUpperCase(),
			names.get(tx.categoryId) ?? 'Unknown',
			accountNames.get(tx.accountId) ?? 'Unknown',
			minorToDecimalString(tx.amountMinor, exponent),
			settings.currencyCode,
			tx.note,
		]),
	];
	await shareTemporaryFile(
		`pennywise-transactions-${timestampForFileName()}.csv`,
		`\uFEFF${encodeCsv(rows)}`,
		'text/csv',
		'public.comma-separated-values-text',
	);
	return transactions.length;
}
