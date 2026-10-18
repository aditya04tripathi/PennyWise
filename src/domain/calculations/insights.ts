import { localDateOf, parseLocalDateTime, type LocalDate } from '../dates';
import type { RecurringFrequency, Transaction } from '../entities';
import {
	addMinor,
	divideMinorRounded,
	sumMinor,
	type MinorUnits,
} from '../money/money';

export type SafeToSpendBasis = 'budget' | 'income';

export interface SafeToSpendInput {
	budgetMinor: MinorUnits | null;
	monthIncomeMinor: MinorUnits;
	monthExpenseMinor: MinorUnits;
	upcomingExpenseMinor: MinorUnits;
	today: Date;
}

export interface SafeToSpend {
	basis: SafeToSpendBasis;
	remainingMinor: MinorUnits;
	dailyMinor: MinorUnits;
	daysRemaining: number;
}

export function daysRemainingInMonth(today: Date): number {
	const lastDay = new Date(
		today.getFullYear(),
		today.getMonth() + 1,
		0,
	).getDate();
	return lastDay - today.getDate() + 1;
}

export function calculateSafeToSpend(
	input: SafeToSpendInput,
): SafeToSpend | null {
	const basis: SafeToSpendBasis | null =
		input.budgetMinor !== null && input.budgetMinor > 0
			? 'budget'
			: input.monthIncomeMinor > 0
				? 'income'
				: null;
	if (!basis) return null;
	const ceiling =
		basis === 'budget'
			? (input.budgetMinor as MinorUnits)
			: input.monthIncomeMinor;
	const remainingMinor = addMinor(
		ceiling,
		-input.monthExpenseMinor,
		-input.upcomingExpenseMinor,
	);
	const daysRemaining = daysRemainingInMonth(input.today);
	const dailyMinor =
		remainingMinor > 0 ? Math.floor(remainingMinor / daysRemaining) : 0;
	return { basis, remainingMinor, dailyMinor, daysRemaining };
}

export interface SubscriptionCandidate {
	key: string;
	note: string;
	categoryId: string;
	frequency: Extract<RecurringFrequency, 'weekly' | 'monthly' | 'yearly'>;
	typicalAmountMinor: MinorUnits;
	occurrences: number;
	lastDate: LocalDate;
	latest: Transaction;
}

const MIN_OCCURRENCES = 3;
const MAX_AMOUNT_SPREAD = 1.1;
const CADENCES: readonly {
	frequency: SubscriptionCandidate['frequency'];
	minDays: number;
	maxDays: number;
}[] = [
	{ frequency: 'weekly', minDays: 6, maxDays: 8 },
	{ frequency: 'monthly', minDays: 27, maxDays: 33 },
	{ frequency: 'yearly', minDays: 355, maxDays: 375 },
];
const DAY_MS = 86_400_000;

export function normalizeSubscriptionKey(note: string): string {
	return note.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function daysBetween(earlier: Transaction, later: Transaction): number {
	const start = parseLocalDateTime(
		`${localDateOf(earlier.occurredAt)}T00:00:00.000`,
	);
	const end = parseLocalDateTime(
		`${localDateOf(later.occurredAt)}T00:00:00.000`,
	);
	return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

function cadenceOf(
	sorted: readonly Transaction[],
): SubscriptionCandidate['frequency'] | null {
	const intervals = sorted
		.slice(1)
		.map((entry, index) => daysBetween(sorted[index], entry));
	const match = CADENCES.find((cadence) =>
		intervals.every(
			(days) => days >= cadence.minDays && days <= cadence.maxDays,
		),
	);
	return match?.frequency ?? null;
}

function hasStableAmount(entries: readonly Transaction[]): boolean {
	const amounts = entries.map((entry) => entry.amountMinor);
	const smallest = Math.min(...amounts);
	const largest = Math.max(...amounts);
	return smallest > 0 && largest <= smallest * MAX_AMOUNT_SPREAD;
}

function groupByNote(
	expenses: readonly Transaction[],
	excludedKeys: ReadonlySet<string>,
): Map<string, Transaction[]> {
	const groups = new Map<string, Transaction[]>();
	for (const entry of expenses) {
		if (entry.type !== 'expense') continue;
		if (entry.recurrence || entry.recurrenceSourceId) continue;
		const key = normalizeSubscriptionKey(entry.note);
		if (!key || excludedKeys.has(key)) continue;
		groups.set(key, [...(groups.get(key) ?? []), entry]);
	}
	return groups;
}

export function detectSubscriptions(
	expenses: readonly Transaction[],
	excludedKeys: ReadonlySet<string>,
): SubscriptionCandidate[] {
	const candidates: SubscriptionCandidate[] = [];
	for (const [key, entries] of groupByNote(expenses, excludedKeys)) {
		if (entries.length < MIN_OCCURRENCES) continue;
		const sorted = [...entries].sort((a, b) =>
			a.occurredAt.localeCompare(b.occurredAt),
		);
		if (!hasStableAmount(sorted)) continue;
		const frequency = cadenceOf(sorted);
		if (!frequency) continue;
		const latest = sorted[sorted.length - 1];
		candidates.push({
			key,
			note: latest.note.trim(),
			categoryId: latest.categoryId,
			frequency,
			typicalAmountMinor: divideMinorRounded(
				sumMinor(sorted.map((entry) => entry.amountMinor)),
				sorted.length,
			),
			occurrences: sorted.length,
			lastDate: localDateOf(latest.occurredAt),
			latest,
		});
	}
	return candidates.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

export interface AccountBalanceParts {
	openingBalanceMinor: MinorUnits;
	incomeMinor: MinorUnits;
	expenseMinor: MinorUnits;
	transfersInMinor: MinorUnits;
	transfersOutMinor: MinorUnits;
}

export function accountBalance(parts: AccountBalanceParts): MinorUnits {
	return addMinor(
		parts.openingBalanceMinor,
		parts.incomeMinor,
		-parts.expenseMinor,
		parts.transfersInMinor,
		-parts.transfersOutMinor,
	);
}
