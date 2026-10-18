import type { SqlExecutor } from '@/data/database/sql-database';
import { findCategory } from '@/data/repositories/category-repository';
import {
	recordBudgetAlert,
	recordCategoryBudgetAlert,
	sentBudgetAlerts,
	sentCategoryBudgetAlerts,
} from '@/data/repositories/settings-repository';
import {
	categoryExpenseBetween,
	deleteTransaction,
	findTransaction,
	insertTransaction,
	totalsBetween,
	updateTransaction,
} from '@/data/repositories/transaction-repository';
import { budgetAlertToSend } from '@/domain/calculations/budget';
import { monthKeyOf, toLocalDateTime } from '@/domain/dates';
import type { Transaction } from '@/domain/entities';
import { currencyExponent } from '@/domain/money/currency';
import {
	validateTransactionDraft,
	type TransactionDraftErrors,
	type TransactionDraftInput,
} from '@/domain/validation/transaction-draft';
import { secureRandomId } from '@/lib/crypto/random';

import { presentBudgetNotification } from '../notifications/local-notifications';
import { deleteReceiptIfUnreferenced } from '../receipts/receipt-files';
import { requireDatabase, useSession } from '../session/session-store';

export type SaveTransactionResult =
	| { ok: true; transaction: Transaction }
	| { ok: false; errors: TransactionDraftErrors };

async function monthExpenseTotal(
	db: SqlExecutor,
	monthKey: string,
	now: string,
): Promise<number> {
	const totals = await totalsBetween(db, `${monthKey}-01`, now);
	return totals.expenseMinor;
}

export async function saveTransactionDraft(
	input: TransactionDraftInput,
	editingId: string | null,
): Promise<SaveTransactionResult> {
	const settings = useSession.getState().settings;
	if (!settings) throw new Error('Settings are not loaded');
	const result = validateTransactionDraft(
		input,
		currencyExponent(settings.currencyCode),
	);
	if (!result.ok) return result;

	const database = requireDatabase();
	const now = toLocalDateTime(new Date());
	const monthKey = monthKeyOf(now);
	const draft = result.value;

	const { saved, previousReceipt, spentBefore, spentAfter } =
		await database.transaction(async (db) => {
			const before = await monthExpenseTotal(db, monthKey, now);
			const existing = editingId
				? await findTransaction(db, editingId)
				: null;
			if (editingId && !existing)
				throw new Error('This transaction was deleted elsewhere.');
			const transaction: Transaction = {
				id: existing?.id ?? secureRandomId(),
				type: draft.type,
				amountMinor: draft.amountMinor,
				categoryId: draft.categoryId,
				cardId: draft.cardId,
				accountId: draft.accountId,
				occurredAt: draft.occurredAt,
				note: draft.note,
				receiptFile: draft.receiptFile,
				recurrence: draft.recurrence,
				recurrenceSourceId: existing?.recurrenceSourceId ?? null,
				occurrenceDate: existing?.occurrenceDate ?? null,
				createdAt: existing?.createdAt ?? now,
				updatedAt: now,
			};
			if (existing) await updateTransaction(db, transaction);
			else await insertTransaction(db, transaction);
			return {
				saved: transaction,
				previousReceipt: existing?.receiptFile ?? null,
				spentBefore: before,
				spentAfter: await monthExpenseTotal(db, monthKey, now),
			};
		});

	if (previousReceipt && previousReceipt !== saved.receiptFile) {
		await deleteReceiptIfUnreferenced(database, previousReceipt);
	}
	useSession.getState().notifyDataChanged();
	if (settings.budgetAlertsEnabled) {
		await notifyBudgetCrossing(
			database,
			monthKey,
			spentBefore,
			spentAfter,
		).catch(() => undefined);
		if (saved.type === 'expense')
			await notifyCategoryBudgetCrossing(
				database,
				monthKey,
				saved.categoryId,
				now,
			).catch(() => undefined);
	}
	return { ok: true, transaction: saved };
}

async function notifyBudgetCrossing(
	db: SqlExecutor,
	monthKey: string,
	before: number,
	after: number,
): Promise<void> {
	const settings = useSession.getState().settings;
	if (!settings?.monthlyBudgetMinor) return;
	const level = budgetAlertToSend(
		before,
		after,
		settings.monthlyBudgetMinor,
		settings.budgetAlertPercent,
		await sentBudgetAlerts(db, monthKey),
	);
	if (!level) return;
	const usedPercent = Math.floor((after * 100) / settings.monthlyBudgetMinor);
	const delivered = await presentBudgetNotification(
		level === 'exceeded'
			? 'Monthly budget exceeded'
			: 'Budget threshold reached',
		`You've used ${usedPercent}% of this month's budget.`,
	);
	if (delivered)
		await recordBudgetAlert(
			db,
			monthKey,
			level,
			toLocalDateTime(new Date()),
		);
}

async function notifyCategoryBudgetCrossing(
	db: SqlExecutor,
	monthKey: string,
	categoryId: string,
	now: string,
): Promise<void> {
	const settings = useSession.getState().settings;
	const category = await findCategory(db, categoryId);
	if (!settings || !category?.budgetLimitMinor) return;
	const after = await categoryExpenseBetween(
		db,
		categoryId,
		`${monthKey}-01`,
		now,
	);
	const level = budgetAlertToSend(
		0,
		after,
		category.budgetLimitMinor,
		settings.budgetAlertPercent,
		await sentCategoryBudgetAlerts(db, monthKey, categoryId),
	);
	if (!level) return;
	const delivered = await presentBudgetNotification(
		level === 'exceeded'
			? `${category.name} budget exceeded`
			: `${category.name} budget threshold reached`,
		`You've used ${Math.floor((after * 100) / category.budgetLimitMinor)}% of this month's ${category.name} budget.`,
	);
	if (delivered)
		await recordCategoryBudgetAlert(
			db,
			monthKey,
			categoryId,
			level,
			toLocalDateTime(new Date()),
		);
}

export async function removeTransaction(
	transaction: Transaction,
): Promise<void> {
	const database = requireDatabase();
	await deleteTransaction(database, transaction.id);
	await deleteReceiptIfUnreferenced(database, transaction.receiptFile);
	useSession.getState().notifyDataChanged();
}

export async function postRecurringOccurrence(
	source: Transaction,
	occurrenceDate: string,
): Promise<Transaction> {
	const now = toLocalDateTime(new Date());
	const posted: Transaction = {
		...source,
		id: secureRandomId(),
		occurredAt: `${occurrenceDate}${source.occurredAt.slice(10)}`,
		receiptFile: null,
		recurrence: null,
		recurrenceSourceId: source.id,
		occurrenceDate,
		createdAt: now,
		updatedAt: now,
	};
	await insertTransaction(requireDatabase(), posted);
	useSession.getState().notifyDataChanged();
	return posted;
}
