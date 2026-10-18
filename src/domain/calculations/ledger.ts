import { toLocalDateTime, monthKeyOf, type LocalDateTime } from '../dates';
import type { Transaction, TransactionType } from '../entities';
import { addMinor, divideMinorRounded, type MinorUnits } from '../money/money';

export type LedgerEntry = Pick<
	Transaction,
	'type' | 'amountMinor' | 'occurredAt' | 'categoryId'
>;

export interface LedgerSummary {
	balanceMinor: MinorUnits;
	allTimeIncomeMinor: MinorUnits;
	allTimeExpenseMinor: MinorUnits;
	monthIncomeMinor: MinorUnits;
	monthExpenseMinor: MinorUnits;
	monthNetMinor: MinorUnits;
	averageDailySpendingMinor: MinorUnits;
	scheduledCount: number;
}

export function isPosted(
	entry: Pick<LedgerEntry, 'occurredAt'>,
	now: LocalDateTime,
): boolean {
	return entry.occurredAt <= now;
}

export function signedAmount(
	type: TransactionType,
	amountMinor: MinorUnits,
): MinorUnits {
	return type === 'income' ? amountMinor : -amountMinor;
}

export function summarizeLedger(
	entries: readonly LedgerEntry[],
	nowDate: Date,
): LedgerSummary {
	const now = toLocalDateTime(nowDate);
	const currentMonth = monthKeyOf(now);
	let allTimeIncome = 0;
	let allTimeExpense = 0;
	let monthIncome = 0;
	let monthExpense = 0;
	let scheduledCount = 0;

	for (const entry of entries) {
		if (!isPosted(entry, now)) {
			scheduledCount += 1;
			continue;
		}
		const inCurrentMonth = monthKeyOf(entry.occurredAt) === currentMonth;
		if (entry.type === 'income') {
			allTimeIncome = addMinor(allTimeIncome, entry.amountMinor);
			if (inCurrentMonth)
				monthIncome = addMinor(monthIncome, entry.amountMinor);
		} else {
			allTimeExpense = addMinor(allTimeExpense, entry.amountMinor);
			if (inCurrentMonth)
				monthExpense = addMinor(monthExpense, entry.amountMinor);
		}
	}

	return {
		balanceMinor: addMinor(allTimeIncome, -allTimeExpense),
		allTimeIncomeMinor: allTimeIncome,
		allTimeExpenseMinor: allTimeExpense,
		monthIncomeMinor: monthIncome,
		monthExpenseMinor: monthExpense,
		monthNetMinor: addMinor(monthIncome, -monthExpense),
		averageDailySpendingMinor: divideMinorRounded(
			monthExpense,
			nowDate.getDate(),
		),
		scheduledCount,
	};
}

export interface CategoryTotal {
	categoryId: string;
	totalMinor: MinorUnits;
}

export function expenseTotalsByCategory(
	entries: readonly LedgerEntry[],
	monthKey: string,
	nowDate: Date,
): CategoryTotal[] {
	const now = toLocalDateTime(nowDate);
	const totals = new Map<string, MinorUnits>();
	for (const entry of entries) {
		if (entry.type !== 'expense' || !isPosted(entry, now)) continue;
		if (monthKeyOf(entry.occurredAt) !== monthKey) continue;
		totals.set(
			entry.categoryId,
			addMinor(totals.get(entry.categoryId) ?? 0, entry.amountMinor),
		);
	}
	return [...totals.entries()]
		.map(([categoryId, totalMinor]) => ({ categoryId, totalMinor }))
		.sort((left, right) => right.totalMinor - left.totalMinor);
}
