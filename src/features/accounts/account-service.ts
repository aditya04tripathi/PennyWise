import {
	accountActivityTotals,
	countAccountUsage,
	deleteTransfer,
	deleteUnusedAccount,
	insertTransfer,
	listAccounts,
	upsertAccount,
} from '@/data/repositories/account-repository';
import type { SqlExecutor } from '@/data/database/sql-database';
import { accountBalance } from '@/domain/calculations/insights';
import { toLocalDateTime } from '@/domain/dates';
import {
	MAIN_ACCOUNT_ID,
	type Account,
	type AccountKind,
	type Transfer,
} from '@/domain/entities';
import type { MinorUnits } from '@/domain/money/money';
import { secureRandomId } from '@/lib/crypto/random';

import { requireDatabase, useSession } from '../session/session-store';

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
	cash: 'Cash',
	checking: 'Current',
	savings: 'Savings',
	credit: 'Credit',
	other: 'Other',
};

export interface AccountWithBalance {
	account: Account;
	balanceMinor: MinorUnits;
}

export async function loadAccountBalances(
	db: SqlExecutor,
	asOf: Date,
): Promise<AccountWithBalance[]> {
	const [accounts, totals] = await Promise.all([
		listAccounts(db),
		accountActivityTotals(db, toLocalDateTime(asOf)),
	]);
	const totalsById = new Map(totals.map((entry) => [entry.accountId, entry]));
	return accounts.map((account) => {
		const activity = totalsById.get(account.id);
		return {
			account,
			balanceMinor: accountBalance({
				openingBalanceMinor: account.openingBalanceMinor,
				incomeMinor: activity?.incomeMinor ?? 0,
				expenseMinor: activity?.expenseMinor ?? 0,
				transfersInMinor: activity?.transfersInMinor ?? 0,
				transfersOutMinor: activity?.transfersOutMinor ?? 0,
			}),
		};
	});
}

export interface AccountInput {
	name: string;
	kind: AccountKind;
	color: string;
	openingBalanceMinor: MinorUnits;
}

export function validateAccountName(name: string): string | null {
	const trimmed = name.trim();
	if (!trimmed) return 'Enter a name';
	if (trimmed.length > 40) return 'Keep the name under 40 characters';
	return null;
}

export async function saveAccount(
	input: AccountInput,
	existing: Account | null,
): Promise<Account> {
	const error = validateAccountName(input.name);
	if (error) throw new Error(error);
	const database = requireDatabase();
	const sortOrder = existing
		? existing.sortOrder
		: (await listAccounts(database, true)).length;
	const account: Account = {
		id: existing?.id ?? secureRandomId(),
		name: input.name.trim(),
		kind: input.kind,
		color: input.color,
		openingBalanceMinor: input.openingBalanceMinor,
		sortOrder,
		archivedAt: existing?.archivedAt ?? null,
	};
	await upsertAccount(database, account);
	useSession.getState().notifyDataChanged();
	return account;
}

export async function accountUsage(accountId: string): Promise<number> {
	return countAccountUsage(requireDatabase(), accountId);
}

export async function archiveAccount(account: Account): Promise<void> {
	if (account.id === MAIN_ACCOUNT_ID)
		throw new Error('The main account cannot be archived.');
	await upsertAccount(requireDatabase(), {
		...account,
		archivedAt: toLocalDateTime(new Date()),
	});
	useSession.getState().notifyDataChanged();
}

export async function removeAccount(accountId: string): Promise<void> {
	if (accountId === MAIN_ACCOUNT_ID)
		throw new Error('The main account cannot be removed.');
	await deleteUnusedAccount(requireDatabase(), accountId);
	useSession.getState().notifyDataChanged();
}

export interface TransferInput {
	fromAccountId: string;
	toAccountId: string;
	amountMinor: MinorUnits;
	occurredAt: string;
	note: string;
}

export function validateTransfer(input: TransferInput): string | null {
	if (input.fromAccountId === input.toAccountId)
		return 'Choose two different accounts';
	if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0)
		return 'Enter an amount greater than zero';
	return null;
}

export async function saveTransfer(input: TransferInput): Promise<Transfer> {
	const error = validateTransfer(input);
	if (error) throw new Error(error);
	const transfer: Transfer = {
		id: secureRandomId(),
		...input,
		note: input.note.trim(),
		createdAt: toLocalDateTime(new Date()),
	};
	await insertTransfer(requireDatabase(), transfer);
	useSession.getState().notifyDataChanged();
	return transfer;
}

export async function removeTransfer(id: string): Promise<void> {
	await deleteTransfer(requireDatabase(), id);
	useSession.getState().notifyDataChanged();
}
