import type { Account, AccountKind, Transfer } from '@/domain/entities';

import type { SqlExecutor } from '../database/sql-database';

interface AccountRow {
	id: string;
	name: string;
	kind: AccountKind;
	color: string;
	opening_balance_minor: number;
	sort_order: number;
	archived_at: string | null;
}

interface TransferRow {
	id: string;
	from_account_id: string;
	to_account_id: string;
	amount_minor: number;
	occurred_at: string;
	note: string;
	created_at: string;
}

function toAccount(row: AccountRow): Account {
	return {
		id: row.id,
		name: row.name,
		kind: row.kind,
		color: row.color,
		openingBalanceMinor: row.opening_balance_minor,
		sortOrder: row.sort_order,
		archivedAt: row.archived_at,
	};
}

function toTransfer(row: TransferRow): Transfer {
	return {
		id: row.id,
		fromAccountId: row.from_account_id,
		toAccountId: row.to_account_id,
		amountMinor: row.amount_minor,
		occurredAt: row.occurred_at,
		note: row.note,
		createdAt: row.created_at,
	};
}

export async function listAccounts(
	db: SqlExecutor,
	includeArchived = false,
): Promise<Account[]> {
	const rows = await db.all<AccountRow>(
		`SELECT * FROM accounts ${includeArchived ? '' : 'WHERE archived_at IS NULL'} ORDER BY sort_order, name COLLATE NOCASE`,
	);
	return rows.map(toAccount);
}

export async function upsertAccount(
	db: SqlExecutor,
	account: Account,
): Promise<void> {
	await db.run(
		`INSERT INTO accounts (id, name, kind, color, opening_balance_minor, sort_order, archived_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, kind = excluded.kind, color = excluded.color,
       opening_balance_minor = excluded.opening_balance_minor, sort_order = excluded.sort_order,
       archived_at = excluded.archived_at`,
		[
			account.id,
			account.name,
			account.kind,
			account.color,
			account.openingBalanceMinor,
			account.sortOrder,
			account.archivedAt,
		],
	);
}

export async function countAccountUsage(
	db: SqlExecutor,
	accountId: string,
): Promise<number> {
	const row = await db.get<{ total: number }>(
		`SELECT (SELECT COUNT(*) FROM transactions WHERE account_id = ?)
          + (SELECT COUNT(*) FROM transfers WHERE from_account_id = ? OR to_account_id = ?) AS total`,
		[accountId, accountId, accountId],
	);
	return row?.total ?? 0;
}

export async function deleteUnusedAccount(
	db: SqlExecutor,
	accountId: string,
): Promise<void> {
	await db.run('DELETE FROM accounts WHERE id = ?', [accountId]);
}

export interface AccountActivityTotals {
	accountId: string;
	incomeMinor: number;
	expenseMinor: number;
	transfersInMinor: number;
	transfersOutMinor: number;
}

export async function accountActivityTotals(
	db: SqlExecutor,
	asOf: string,
): Promise<AccountActivityTotals[]> {
	const rows = await db.all<{
		id: string;
		income: number | null;
		expense: number | null;
		transfers_in: number | null;
		transfers_out: number | null;
	}>(
		`SELECT a.id,
       (SELECT SUM(amount_minor) FROM transactions WHERE account_id = a.id AND type = 'income' AND occurred_at <= ?) AS income,
       (SELECT SUM(amount_minor) FROM transactions WHERE account_id = a.id AND type = 'expense' AND occurred_at <= ?) AS expense,
       (SELECT SUM(amount_minor) FROM transfers WHERE to_account_id = a.id AND occurred_at <= ?) AS transfers_in,
       (SELECT SUM(amount_minor) FROM transfers WHERE from_account_id = a.id AND occurred_at <= ?) AS transfers_out
     FROM accounts a`,
		[asOf, asOf, asOf, asOf],
	);
	return rows.map((row) => ({
		accountId: row.id,
		incomeMinor: row.income ?? 0,
		expenseMinor: row.expense ?? 0,
		transfersInMinor: row.transfers_in ?? 0,
		transfersOutMinor: row.transfers_out ?? 0,
	}));
}

export async function insertTransfer(
	db: SqlExecutor,
	transfer: Transfer,
): Promise<void> {
	await db.run(
		`INSERT INTO transfers (id, from_account_id, to_account_id, amount_minor, occurred_at, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			transfer.id,
			transfer.fromAccountId,
			transfer.toAccountId,
			transfer.amountMinor,
			transfer.occurredAt,
			transfer.note,
			transfer.createdAt,
		],
	);
}

export async function deleteTransfer(
	db: SqlExecutor,
	id: string,
): Promise<void> {
	await db.run('DELETE FROM transfers WHERE id = ?', [id]);
}

export async function listTransfers(
	db: SqlExecutor,
	accountId: string | null = null,
	limit = Number.MAX_SAFE_INTEGER,
): Promise<Transfer[]> {
	const rows = accountId
		? await db.all<TransferRow>(
				'SELECT * FROM transfers WHERE from_account_id = ? OR to_account_id = ? ORDER BY occurred_at DESC LIMIT ?',
				[accountId, accountId, limit],
			)
		: await db.all<TransferRow>(
				'SELECT * FROM transfers ORDER BY occurred_at DESC LIMIT ?',
				[limit],
			);
	return rows.map(toTransfer);
}
