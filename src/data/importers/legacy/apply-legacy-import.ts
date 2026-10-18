import { summarizeLedger } from '@/domain/calculations/ledger';
import { toLocalDateTime } from '@/domain/dates';
import { currencyExponent } from '@/domain/money/currency';
import { legacyDoubleToMinor, sumMinor } from '@/domain/money/money';

import { clearLedgerData } from '../../database/clear-ledger';
import type { SqlDatabase, SqlExecutor } from '../../database/sql-database';
import { upsertCard } from '../../repositories/card-repository';
import { upsertCategory } from '../../repositories/category-repository';
import { saveSettings } from '../../repositories/settings-repository';
import {
	insertTransaction,
	listLedgerEntries,
} from '../../repositories/transaction-repository';
import type { LegacySnapshot } from './parse-legacy-backup';

export interface ReconciliationCheck {
	label: string;
	expected: number;
	actual: number;
	passed: boolean;
}

export interface LegacyImportResult {
	batchId: string;
	checks: ReconciliationCheck[];
	legacyDisplayedBalanceMinor: number;
	exactBalanceMinor: number;
}

export class ImportVerificationError extends Error {
	constructor(readonly checks: ReconciliationCheck[]) {
		super('Imported data did not match the backup. Nothing was changed.');
		this.name = 'ImportVerificationError';
	}
}

export class DuplicateImportError extends Error {
	constructor(readonly importedAt: string) {
		super('This exact backup was already imported.');
		this.name = 'DuplicateImportError';
	}
}

async function countRows(
	db: SqlExecutor,
	table: 'transactions' | 'categories' | 'payment_cards',
): Promise<number> {
	const row = await db.get<{ total: number }>(
		`SELECT COUNT(*) AS total FROM ${table}`,
	);
	return row?.total ?? 0;
}

async function sumByType(
	db: SqlExecutor,
	type: 'income' | 'expense',
): Promise<number> {
	const row = await db.get<{ total: number | null }>(
		'SELECT SUM(amount_minor) AS total FROM transactions WHERE type = ?',
		[type],
	);
	return row?.total ?? 0;
}

export async function findPreviousImport(
	db: SqlExecutor,
	contentSha256: string,
): Promise<string | null> {
	const row = await db.get<{ imported_at: string }>(
		'SELECT imported_at FROM import_batches WHERE content_sha256 = ?',
		[contentSha256],
	);
	return row?.imported_at ?? null;
}

function legacyFloatBalance(snapshot: LegacySnapshot, now: string): number {
	let balance = 0;
	for (const raw of snapshot.rawAcceptedTransactions) {
		if (raw.occurredAt > now) continue;
		balance += raw.type === 'income' ? raw.amount : -raw.amount;
	}
	return legacyDoubleToMinor(
		balance,
		currencyExponent(snapshot.settings.currencyCode),
	).minor;
}

export async function replaceWithLegacySnapshot(
	database: SqlDatabase,
	snapshot: LegacySnapshot,
	meta: {
		batchId: string;
		contentSha256: string;
		nowDate: Date;
		allowRepeat?: boolean;
	},
): Promise<LegacyImportResult> {
	const previous = await findPreviousImport(database, meta.contentSha256);
	if (previous && !meta.allowRepeat) throw new DuplicateImportError(previous);

	const expected = {
		transactions: snapshot.transactions.length,
		categories: snapshot.categories.length,
		cards: snapshot.cards.length,
		income: sumMinor(
			snapshot.transactions
				.filter((tx) => tx.type === 'income')
				.map((tx) => tx.amountMinor),
		),
		expense: sumMinor(
			snapshot.transactions
				.filter((tx) => tx.type === 'expense')
				.map((tx) => tx.amountMinor),
		),
	};

	return database.transaction(async (db) => {
		await clearLedgerData(db);
		await saveSettings(db, snapshot.settings);
		for (const category of snapshot.categories)
			await upsertCategory(db, category);
		for (const card of snapshot.cards) await upsertCard(db, card);
		for (const transaction of snapshot.transactions)
			await insertTransaction(db, transaction);

		const check = (
			label: string,
			expectedValue: number,
			actual: number,
		): ReconciliationCheck => ({
			label,
			expected: expectedValue,
			actual,
			passed: expectedValue === actual,
		});
		const checks = [
			check(
				'Transactions',
				expected.transactions,
				await countRows(db, 'transactions'),
			),
			check(
				'Categories',
				expected.categories,
				await countRows(db, 'categories'),
			),
			check(
				'Cards',
				expected.cards,
				await countRows(db, 'payment_cards'),
			),
			check(
				'Total income',
				expected.income,
				await sumByType(db, 'income'),
			),
			check(
				'Total expenses',
				expected.expense,
				await sumByType(db, 'expense'),
			),
		];
		if (checks.some((item) => !item.passed))
			throw new ImportVerificationError(checks);

		const ledger = summarizeLedger(
			await listLedgerEntries(db),
			meta.nowDate,
		);
		const legacyDisplayedBalanceMinor = legacyFloatBalance(
			snapshot,
			toLocalDateTime(meta.nowDate),
		);
		const result: LegacyImportResult = {
			batchId: meta.batchId,
			checks,
			legacyDisplayedBalanceMinor,
			exactBalanceMinor: ledger.balanceMinor,
		};
		await db.run(
			'INSERT OR REPLACE INTO import_batches (id, source, strategy, content_sha256, imported_at, report_json) VALUES (?, ?, ?, ?, ?, ?)',
			[
				meta.batchId,
				'flutter-legacy-backup',
				'replace',
				meta.contentSha256,
				toLocalDateTime(meta.nowDate),
				JSON.stringify({
					sourceCounts: snapshot.sourceCounts,
					issues: snapshot.issues,
					checks,
				}),
			],
		);
		return result;
	});
}
