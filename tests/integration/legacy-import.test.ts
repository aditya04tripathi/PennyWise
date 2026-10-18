import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { migrateDatabase } from '@/data/database/migrations';
import type { SqlDatabase } from '@/data/database/sql-database';
import {
	DuplicateImportError,
	ImportVerificationError,
	replaceWithLegacySnapshot,
} from '@/data/importers/legacy/apply-legacy-import';
import {
	decryptLegacyBackup,
	isLegacyEncryptedBackup,
	LegacyBackupDecryptionError,
} from '@/data/importers/legacy/decrypt';
import {
	LegacyBackupFormatError,
	parseLegacyBackup,
} from '@/data/importers/legacy/parse-legacy-backup';
import { listCards } from '@/data/repositories/card-repository';
import { listCategories } from '@/data/repositories/category-repository';
import { loadSettings } from '@/data/repositories/settings-repository';
import {
	findTransaction,
	listLedgerEntries,
} from '@/data/repositories/transaction-repository';
import { summarizeLedger } from '@/domain/calculations/ledger';
import { createInMemoryDatabase } from '@tests/fixtures/node-sqlite-database';

const fixtureDir = join(__dirname, '..', 'fixtures', 'legacy');
const plainCsv = readFileSync(join(fixtureDir, 'legacy-backup.csv'), 'utf8');
const encrypted = new Uint8Array(
	readFileSync(join(fixtureDir, 'legacy-backup.csv.enc')),
);
const importedAt = '2026-10-19T09:00:00.000';
const now = new Date(2026, 9, 19, 9);

describe('legacy backup decryption (fixture produced by Dart cryptography 2.9.0)', () => {
	it('detects and decrypts the Flutter AES-GCM format', async () => {
		expect(isLegacyEncryptedBackup(encrypted)).toBe(true);
		await expect(
			decryptLegacyBackup(encrypted, 'correct horse'),
		).resolves.toBe(plainCsv);
	});

	it('rejects a wrong password', async () => {
		await expect(
			decryptLegacyBackup(encrypted, 'wrong'),
		).rejects.toBeInstanceOf(LegacyBackupDecryptionError);
	});

	it('rejects tampered ciphertext', async () => {
		const tampered = encrypted.slice();
		tampered[40] ^= 1;
		await expect(
			decryptLegacyBackup(tampered, 'correct horse'),
		).rejects.toBeInstanceOf(LegacyBackupDecryptionError);
	});

	it('rejects truncated files', async () => {
		await expect(
			decryptLegacyBackup(encrypted.slice(0, 20), 'correct horse'),
		).rejects.toMatchObject({ reason: 'truncated' });
	});
});

describe('parseLegacyBackup', () => {
	const snapshot = parseLegacyBackup(plainCsv, importedAt);

	it('maps the profile without carrying over the plaintext PIN', () => {
		expect(snapshot.settings).toMatchObject({
			name: 'Aditya',
			currencyCode: 'USD',
			onboardingCompleted: true,
			monthlyBudgetMinor: 150000,
			budgetAlertPercent: 80,
			budgetAlertsEnabled: true,
		});
		expect(JSON.stringify(snapshot)).not.toContain('"1234"');
		expect(
			snapshot.issues.some((issue) =>
				issue.message.includes('old PIN was not imported'),
			),
		).toBe(true);
	});

	it('preserves category ids, colours and maps icons', () => {
		const food = snapshot.categories.find(
			(category) => category.id === '1',
		);
		expect(food).toMatchObject({
			name: 'Food',
			icon: 'food',
			color: '#F59E0B',
			legacyIconCode: 0xe527,
		});
		expect(
			snapshot.categories.find(
				(category) => category.id === '1760000000000',
			),
		).toMatchObject({ icon: 'pets', budgetLimitMinor: 12050 });
	});

	it('keeps card metadata only', () => {
		expect(snapshot.cards).toEqual([
			{
				id: 'card-1',
				bankName: 'Monzo',
				holderName: 'Aditya Tripathi',
				lastFour: '4242',
				network: 'visa',
				color: '#448AFF',
			},
		]);
	});

	it('handles legacy edge cases explicitly', () => {
		const byId = new Map(snapshot.transactions.map((tx) => [tx.id, tx]));
		expect(byId.get('t2')?.amountMinor).toBe(10);
		expect(byId.get('t3')?.note).toBe('Mints, "fresh"');
		expect(byId.get('t5')).toMatchObject({
			amountMinor: 9999,
			note: 'Café ☕ – 日本',
			cardId: 'card-1',
			occurredAt: '2026-09-04T18:45:12.345',
		});
		expect(byId.get('t6')?.categoryId).toBe('999');
		expect(
			snapshot.categories.find((category) => category.id === '999')?.name,
		).toBe('Recovered category');
		expect(byId.get('t7')?.cardId).toBeNull();
		expect(byId.get('t7-2')?.amountMinor).toBe(4100);
		expect(byId.has('t8')).toBe(false);
		expect(byId.get('t4')?.recurrence).toEqual({
			frequency: 'monthly',
			day: 31,
			month: null,
		});
		expect(byId.get('t10')?.recurrence).toEqual({
			frequency: 'yearly',
			day: 29,
			month: 2,
		});
		expect(snapshot.sourceCounts).toEqual({
			users: 1,
			categories: 6,
			cards: 1,
			transactions: 11,
			unknownRows: 0,
		});
		expect(snapshot.transactions).toHaveLength(10);
		expect(
			snapshot.issues.filter((issue) => issue.severity === 'rejected'),
		).toHaveLength(1);
		expect(
			snapshot.issues.some((issue) =>
				issue.message.includes('receipt photo is not included'),
			),
		).toBe(true);
	});

	it('rejects files that are not PennyWise backups', () => {
		expect(() =>
			parseLegacyBackup('Date,Type,Category,Amount,Note\r\n', importedAt),
		).toThrow(LegacyBackupFormatError);
	});
});

describe('replaceWithLegacySnapshot', () => {
	let database: SqlDatabase;

	beforeEach(async () => {
		database = createInMemoryDatabase();
		await migrateDatabase(database);
	});

	afterEach(() => database.close());

	it('imports atomically and reconciles counts and totals', async () => {
		const snapshot = parseLegacyBackup(plainCsv, importedAt);
		const result = await replaceWithLegacySnapshot(database, snapshot, {
			batchId: 'b1',
			contentSha256: 'abc',
			nowDate: now,
		});

		expect(result.checks.every((check) => check.passed)).toBe(true);
		expect(
			result.checks.find((check) => check.label === 'Total income')
				?.expected,
		).toBe(370000);
		expect(
			result.checks.find((check) => check.label === 'Total expenses')
				?.expected,
		).toBe(145879);
		expect(result.exactBalanceMinor).toBe(174121);
		expect(result.legacyDisplayedBalanceMinor).toBe(
			result.exactBalanceMinor,
		);

		expect(await loadSettings(database)).toMatchObject({
			name: 'Aditya',
			monthlyBudgetMinor: 150000,
		});
		expect(await listCategories(database)).toHaveLength(7);
		expect(await listCards(database)).toHaveLength(1);
		expect(await findTransaction(database, 't5')).toMatchObject({
			amountMinor: 9999,
			cardId: 'card-1',
		});
		const ledger = summarizeLedger(await listLedgerEntries(database), now);
		expect(ledger.scheduledCount).toBe(1);
	});

	it('refuses to import the same backup twice unless confirmed', async () => {
		const snapshot = parseLegacyBackup(plainCsv, importedAt);
		await replaceWithLegacySnapshot(database, snapshot, {
			batchId: 'b1',
			contentSha256: 'same',
			nowDate: now,
		});
		await expect(
			replaceWithLegacySnapshot(database, snapshot, {
				batchId: 'b2',
				contentSha256: 'same',
				nowDate: now,
			}),
		).rejects.toBeInstanceOf(DuplicateImportError);
		await replaceWithLegacySnapshot(database, snapshot, {
			batchId: 'b3',
			contentSha256: 'same',
			nowDate: now,
			allowRepeat: true,
		});
		expect((await listLedgerEntries(database)).length).toBe(10);
	});

	it('rolls back completely when a record cannot be written', async () => {
		const good = parseLegacyBackup(plainCsv, importedAt);
		await replaceWithLegacySnapshot(database, good, {
			batchId: 'b1',
			contentSha256: 'first',
			nowDate: now,
		});

		const broken = parseLegacyBackup(plainCsv, importedAt);
		broken.transactions[3] = {
			...broken.transactions[3],
			categoryId: 'does-not-exist',
		};
		await expect(
			replaceWithLegacySnapshot(database, broken, {
				batchId: 'b2',
				contentSha256: 'second',
				nowDate: now,
			}),
		).rejects.toThrow();

		expect((await listLedgerEntries(database)).length).toBe(10);
		expect(await findTransaction(database, 't4')).toMatchObject({
			categoryId: '5',
		});
	});

	it('exposes verification failures as a typed error', () => {
		expect(new ImportVerificationError([]).message).toContain(
			'Nothing was changed',
		);
	});
});
