import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { migrateDatabase } from '@/data/database/migrations';
import {
	BackupFormatError,
	BackupPasswordError,
	isSealedBackup,
	openBackup,
	sealBackup,
	validateBackupPassword,
} from '@/data/exporters/backup-format';
import {
	collectBackupPayload,
	replaceWithBackup,
} from '@/data/exporters/backup-snapshot';
import { replaceWithLegacySnapshot } from '@/data/importers/legacy/apply-legacy-import';
import { parseLegacyBackup } from '@/data/importers/legacy/parse-legacy-backup';
import {
	findTransaction,
	insertTransaction,
	listLedgerEntries,
} from '@/data/repositories/transaction-repository';
import { createInMemoryDatabase } from '@tests/fixtures/node-sqlite-database';

const legacyCsv = readFileSync(
	join(__dirname, '..', 'fixtures', 'legacy', 'legacy-backup.csv'),
	'utf8',
);
const random = (length: number) => new Uint8Array(randomBytes(length));
const FAST_ITERATIONS = 100_000;

async function seededDatabase() {
	const database = createInMemoryDatabase();
	await migrateDatabase(database);
	await replaceWithLegacySnapshot(
		database,
		parseLegacyBackup(legacyCsv, '2026-10-19T09:00:00.000'),
		{
			batchId: 'seed',
			contentSha256: 'seed',
			nowDate: new Date(2026, 9, 19),
		},
	);
	await insertTransaction(database, {
		id: 'with-receipt',
		type: 'expense',
		amountMinor: 1234,
		categoryId: '1',
		cardId: null,
		accountId: 'main',
		occurredAt: '2026-10-18T10:00:00.000',
		note: 'Lunch',
		receiptFile: 'abc-123.jpg',
		recurrence: null,
		recurrenceSourceId: 't4',
		occurrenceDate: '2026-10-31',
		createdAt: '2026-10-18T10:00:00.000',
		updatedAt: '2026-10-18T10:00:00.000',
	});
	return database;
}

describe('encrypted backup round trip', () => {
	it('restores an identical ledger including receipts', async () => {
		const source = await seededDatabase();
		const { payload, missingReceipts } = await collectBackupPayload(
			source,
			'2026-10-19T10:00:00.000',
			async () => 'aGVsbG8=',
		);
		expect(missingReceipts).toEqual([]);
		expect(payload.receipts).toEqual([
			{ file: 'abc-123.jpg', base64: 'aGVsbG8=' },
		]);

		const sealed = await sealBackup(
			payload,
			'a long passphrase',
			random,
			FAST_ITERATIONS,
		);
		expect(isSealedBackup(sealed)).toBe(true);
		expect(sealed).not.toContain('Salary');
		expect(sealed).not.toContain('Monzo');

		const opened = await openBackup(sealed, 'a long passphrase');
		const target = createInMemoryDatabase();
		await migrateDatabase(target);
		const summary = await replaceWithBackup(target, opened);
		expect(summary).toMatchObject({
			transactions: 11,
			cards: 1,
			categories: 7,
		});
		const ordered = async (database: typeof source) =>
			(await listLedgerEntries(database)).sort((left, right) =>
				JSON.stringify(left).localeCompare(JSON.stringify(right)),
			);
		expect(await ordered(target)).toEqual(await ordered(source));
		expect(await findTransaction(target, 'with-receipt')).toMatchObject({
			receiptFile: 'abc-123.jpg',
			recurrenceSourceId: 't4',
		});
	});

	it('drops links to receipt files that are missing on disk and reports them', async () => {
		const source = await seededDatabase();
		const { payload, missingReceipts } = await collectBackupPayload(
			source,
			'2026-10-19T10:00:00.000',
			async () => null,
		);
		expect(missingReceipts).toEqual(['abc-123.jpg']);
		expect(
			payload.transactions.find((tx) => tx.id === 'with-receipt')
				?.receiptFile,
		).toBeNull();
	});

	it('rejects wrong passwords, tampering and foreign files', async () => {
		const source = await seededDatabase();
		const { payload } = await collectBackupPayload(
			source,
			'2026-10-19T10:00:00.000',
			async () => null,
		);
		const sealed = await sealBackup(
			payload,
			'a long passphrase',
			random,
			FAST_ITERATIONS,
		);
		await expect(
			openBackup(sealed, 'wrong passphrase'),
		).rejects.toBeInstanceOf(BackupPasswordError);

		const envelope = JSON.parse(sealed);
		await expect(
			openBackup(
				JSON.stringify({
					...envelope,
					kdf: { ...envelope.kdf, iterations: FAST_ITERATIONS + 1 },
				}),
				'a long passphrase',
			),
		).rejects.toBeInstanceOf(BackupPasswordError);
		await expect(
			openBackup('{"hello":"world"}', 'x'),
		).rejects.toBeInstanceOf(BackupFormatError);
	});

	it('rejects manifests whose counts do not match', async () => {
		const source = await seededDatabase();
		const { payload } = await collectBackupPayload(
			source,
			'2026-10-19T10:00:00.000',
			async () => null,
		);
		const sealed = await sealBackup(
			{ ...payload, counts: { ...payload.counts, transactions: 99 } },
			'a long passphrase',
			random,
			FAST_ITERATIONS,
		);
		await expect(openBackup(sealed, 'a long passphrase')).rejects.toThrow(
			'record counts do not match',
		);
	});

	it('leaves existing data untouched if restore fails', async () => {
		const target = await seededDatabase();
		const { payload } = await collectBackupPayload(
			target,
			'2026-10-19T10:00:00.000',
			async () => null,
		);
		const broken = {
			...payload,
			transactions: payload.transactions.map((tx, index) =>
				index === 2 ? { ...tx, categoryId: 'ghost' } : tx,
			),
		};
		await expect(replaceWithBackup(target, broken)).rejects.toThrow();
		expect((await listLedgerEntries(target)).length).toBe(11);
	});

	it('requires a reasonable password', () => {
		expect(validateBackupPassword('short')).not.toBeNull();
		expect(validateBackupPassword('long enough')).toBeNull();
	});
});
