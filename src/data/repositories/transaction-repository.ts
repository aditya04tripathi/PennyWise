import type { LedgerEntry } from '@/domain/calculations/ledger';
import type {
	Recurrence,
	RecurringFrequency,
	Transaction,
	TransactionType,
} from '@/domain/entities';

import type { SqlExecutor, SqlValue } from '../database/sql-database';

interface TransactionRow {
	id: string;
	type: TransactionType;
	amount_minor: number;
	category_id: string;
	card_id: string | null;
	account_id: string;
	occurred_at: string;
	note: string;
	receipt_file: string | null;
	recurrence_frequency: RecurringFrequency | null;
	recurrence_day: number | null;
	recurrence_month: number | null;
	recurrence_source_id: string | null;
	occurrence_date: string | null;
	created_at: string;
	updated_at: string;
}

function toTransaction(row: TransactionRow): Transaction {
	const recurrence: Recurrence | null = row.recurrence_frequency
		? {
				frequency: row.recurrence_frequency,
				day: row.recurrence_day,
				month: row.recurrence_month,
			}
		: null;
	return {
		id: row.id,
		type: row.type,
		amountMinor: row.amount_minor,
		categoryId: row.category_id,
		cardId: row.card_id,
		accountId: row.account_id,
		occurredAt: row.occurred_at,
		note: row.note,
		receiptFile: row.receipt_file,
		recurrence,
		recurrenceSourceId: row.recurrence_source_id,
		occurrenceDate: row.occurrence_date,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function toParams(transaction: Transaction): SqlValue[] {
	return [
		transaction.id,
		transaction.type,
		transaction.amountMinor,
		transaction.categoryId,
		transaction.cardId,
		transaction.occurredAt,
		transaction.note,
		transaction.receiptFile,
		transaction.recurrence?.frequency ?? null,
		transaction.recurrence?.day ?? null,
		transaction.recurrence?.month ?? null,
		transaction.recurrenceSourceId,
		transaction.occurrenceDate,
		transaction.createdAt,
		transaction.updatedAt,
		transaction.accountId,
	];
}

const COLUMNS =
	'id, type, amount_minor, category_id, card_id, occurred_at, note, receipt_file, recurrence_frequency, ' +
	'recurrence_day, recurrence_month, recurrence_source_id, occurrence_date, created_at, updated_at, account_id';

export async function insertTransaction(
	db: SqlExecutor,
	transaction: Transaction,
): Promise<void> {
	await db.run(
		`INSERT INTO transactions (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		toParams(transaction),
	);
}

export async function updateTransaction(
	db: SqlExecutor,
	transaction: Transaction,
): Promise<void> {
	const result = await db.run(
		`UPDATE transactions SET type = ?, amount_minor = ?, category_id = ?, card_id = ?, occurred_at = ?, note = ?,
      receipt_file = ?, recurrence_frequency = ?, recurrence_day = ?, recurrence_month = ?, updated_at = ?, account_id = ?
     WHERE id = ?`,
		[
			transaction.type,
			transaction.amountMinor,
			transaction.categoryId,
			transaction.cardId,
			transaction.occurredAt,
			transaction.note,
			transaction.receiptFile,
			transaction.recurrence?.frequency ?? null,
			transaction.recurrence?.day ?? null,
			transaction.recurrence?.month ?? null,
			transaction.updatedAt,
			transaction.accountId,
			transaction.id,
		],
	);
	if (result.changes !== 1) throw new Error('Transaction no longer exists');
}

export async function deleteTransaction(
	db: SqlExecutor,
	id: string,
): Promise<void> {
	await db.run('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function findTransaction(
	db: SqlExecutor,
	id: string,
): Promise<Transaction | null> {
	const row = await db.get<TransactionRow>(
		`SELECT ${COLUMNS} FROM transactions WHERE id = ?`,
		[id],
	);
	return row ? toTransaction(row) : null;
}

export interface TransactionQuery {
	search?: string;
	type?: TransactionType | null;
	categoryId?: string | null;
	cardId?: string | null;
	accountId?: string | null;
	fromDate?: string | null;
	toDate?: string | null;
	minAmountMinor?: number | null;
	maxAmountMinor?: number | null;
	hasReceipt?: boolean | null;
	sort?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
	limit: number;
	offset: number;
}

const SORT_SQL: Record<NonNullable<TransactionQuery['sort']>, string> = {
	'date-desc': 'occurred_at DESC, id DESC',
	'date-asc': 'occurred_at ASC, id ASC',
	'amount-desc': 'amount_minor DESC, occurred_at DESC',
	'amount-asc': 'amount_minor ASC, occurred_at DESC',
};

function escapeLike(value: string): string {
	return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export async function queryTransactions(
	db: SqlExecutor,
	query: TransactionQuery,
): Promise<Transaction[]> {
	const conditions: string[] = [];
	const params: SqlValue[] = [];
	if (query.search?.trim()) {
		conditions.push(`note LIKE ? ESCAPE '\\'`);
		params.push(`%${escapeLike(query.search.trim())}%`);
	}
	if (query.type) {
		conditions.push('type = ?');
		params.push(query.type);
	}
	if (query.categoryId) {
		conditions.push('category_id = ?');
		params.push(query.categoryId);
	}
	if (query.cardId) {
		conditions.push('card_id = ?');
		params.push(query.cardId);
	}
	if (query.accountId) {
		conditions.push('account_id = ?');
		params.push(query.accountId);
	}
	if (query.fromDate) {
		conditions.push('occurred_at >= ?');
		params.push(query.fromDate);
	}
	if (query.toDate) {
		conditions.push('occurred_at < ?');
		params.push(`${query.toDate}T99`);
	}
	if (query.minAmountMinor != null) {
		conditions.push('amount_minor >= ?');
		params.push(query.minAmountMinor);
	}
	if (query.maxAmountMinor != null) {
		conditions.push('amount_minor <= ?');
		params.push(query.maxAmountMinor);
	}
	if (query.hasReceipt != null) {
		conditions.push(
			query.hasReceipt
				? 'receipt_file IS NOT NULL'
				: 'receipt_file IS NULL',
		);
	}
	const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
	const rows = await db.all<TransactionRow>(
		`SELECT ${COLUMNS} FROM transactions ${where} ORDER BY ${SORT_SQL[query.sort ?? 'date-desc']} LIMIT ? OFFSET ?`,
		[...params, query.limit, query.offset],
	);
	return rows.map(toTransaction);
}

export async function listLedgerEntries(
	db: SqlExecutor,
): Promise<LedgerEntry[]> {
	const rows = await db.all<{
		type: TransactionType;
		amount_minor: number;
		occurred_at: string;
		category_id: string;
	}>('SELECT type, amount_minor, occurred_at, category_id FROM transactions');
	return rows.map((row) => ({
		type: row.type,
		amountMinor: row.amount_minor,
		occurredAt: row.occurred_at,
		categoryId: row.category_id,
	}));
}

export async function listTransactionsBetween(
	db: SqlExecutor,
	fromInclusive: string,
	toExclusive: string,
): Promise<Transaction[]> {
	const rows = await db.all<TransactionRow>(
		`SELECT ${COLUMNS} FROM transactions WHERE occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC`,
		[fromInclusive, toExclusive],
	);
	return rows.map(toTransaction);
}

export async function listRecurringTransactions(
	db: SqlExecutor,
): Promise<Transaction[]> {
	const rows = await db.all<TransactionRow>(
		`SELECT ${COLUMNS} FROM transactions WHERE recurrence_frequency IS NOT NULL ORDER BY occurred_at DESC`,
	);
	return rows.map(toTransaction);
}

export async function listPostedOccurrenceDates(
	db: SqlExecutor,
	sourceId: string,
): Promise<string[]> {
	const rows = await db.all<{ occurrence_date: string }>(
		'SELECT occurrence_date FROM transactions WHERE recurrence_source_id = ? ORDER BY occurrence_date',
		[sourceId],
	);
	return rows.map((row) => row.occurrence_date);
}

export interface PeriodTotals {
	incomeMinor: number;
	expenseMinor: number;
	count: number;
}

export async function totalsBetween(
	db: SqlExecutor,
	fromInclusive: string,
	toInclusive: string,
): Promise<PeriodTotals> {
	const row = await db.get<{
		income: number | null;
		expense: number | null;
		total: number;
	}>(
		`SELECT
       SUM(CASE WHEN type = 'income' THEN amount_minor END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount_minor END) AS expense,
       COUNT(*) AS total
     FROM transactions WHERE occurred_at >= ? AND occurred_at <= ?`,
		[fromInclusive, toInclusive],
	);
	return {
		incomeMinor: row?.income ?? 0,
		expenseMinor: row?.expense ?? 0,
		count: row?.total ?? 0,
	};
}

export async function listReferencedReceiptFiles(
	db: SqlExecutor,
): Promise<string[]> {
	const rows = await db.all<{ receipt_file: string }>(
		'SELECT DISTINCT receipt_file FROM transactions WHERE receipt_file IS NOT NULL',
	);
	return rows.map((row) => row.receipt_file);
}

export async function categoryExpenseBetween(
	db: SqlExecutor,
	categoryId: string,
	fromInclusive: string,
	toInclusive: string,
): Promise<number> {
	const row = await db.get<{ total: number | null }>(
		`SELECT SUM(amount_minor) AS total FROM transactions
     WHERE type = 'expense' AND category_id = ? AND occurred_at >= ? AND occurred_at <= ?`,
		[categoryId, fromInclusive, toInclusive],
	);
	return row?.total ?? 0;
}
