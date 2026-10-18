import {
	accountBalance,
	calculateSafeToSpend,
	daysRemainingInMonth,
	detectSubscriptions,
} from '@/domain/calculations/insights';
import type { Transaction } from '@/domain/entities';

function expense(
	id: string,
	occurredAt: string,
	amountMinor: number,
	note: string,
	overrides: Partial<Transaction> = {},
): Transaction {
	return {
		id,
		type: 'expense',
		amountMinor,
		categoryId: 'subscriptions',
		cardId: null,
		accountId: 'main',
		occurredAt,
		note,
		receiptFile: null,
		recurrence: null,
		recurrenceSourceId: null,
		occurrenceDate: null,
		createdAt: occurredAt,
		updatedAt: occurredAt,
		...overrides,
	};
}

describe('safe to spend', () => {
	const today = new Date(2026, 9, 22);

	it('counts today in the remaining days', () => {
		expect(daysRemainingInMonth(today)).toBe(10);
		expect(daysRemainingInMonth(new Date(2026, 1, 28))).toBe(1);
	});

	it('uses the budget and subtracts upcoming recurring expenses', () => {
		expect(
			calculateSafeToSpend({
				budgetMinor: 100_000,
				monthIncomeMinor: 500_000,
				monthExpenseMinor: 40_000,
				upcomingExpenseMinor: 10_000,
				today,
			}),
		).toEqual({
			basis: 'budget',
			remainingMinor: 50_000,
			dailyMinor: 5_000,
			daysRemaining: 10,
		});
	});

	it('falls back to income when there is no budget and never rounds up', () => {
		expect(
			calculateSafeToSpend({
				budgetMinor: null,
				monthIncomeMinor: 10_009,
				monthExpenseMinor: 0,
				upcomingExpenseMinor: 0,
				today,
			}),
		).toMatchObject({ basis: 'income', dailyMinor: 1_000 });
	});

	it('reports zero per day once overspent and nothing without a basis', () => {
		expect(
			calculateSafeToSpend({
				budgetMinor: 1_000,
				monthIncomeMinor: 0,
				monthExpenseMinor: 2_000,
				upcomingExpenseMinor: 0,
				today,
			}),
		).toMatchObject({ remainingMinor: -1_000, dailyMinor: 0 });
		expect(
			calculateSafeToSpend({
				budgetMinor: null,
				monthIncomeMinor: 0,
				monthExpenseMinor: 0,
				upcomingExpenseMinor: 0,
				today,
			}),
		).toBeNull();
	});
});

describe('subscription detection', () => {
	const monthly = [
		expense('a', '2026-07-03T09:00:00.000', 999, 'Netflix'),
		expense('b', '2026-08-02T09:00:00.000', 999, ' netflix '),
		expense('c', '2026-09-03T09:00:00.000', 1049, 'NETFLIX'),
	];

	it('detects a monthly charge with a stable amount', () => {
		const [candidate] = detectSubscriptions(monthly, new Set());
		expect(candidate).toMatchObject({
			key: 'netflix',
			frequency: 'monthly',
			occurrences: 3,
			typicalAmountMinor: 1016,
			lastDate: '2026-09-03',
		});
	});

	it('detects weekly charges', () => {
		const weekly = [1, 8, 15, 22].map((day, index) =>
			expense(
				`w${index}`,
				`2026-09-${String(day).padStart(2, '0')}T08:00:00.000`,
				500,
				'Gym',
			),
		);
		expect(detectSubscriptions(weekly, new Set())[0]?.frequency).toBe(
			'weekly',
		);
	});

	it('ignores irregular, variable, too-few, recurring and excluded groups', () => {
		const irregular = [
			expense('i1', '2026-07-01T00:00:00.000', 500, 'Cafe'),
			expense('i2', '2026-07-04T00:00:00.000', 500, 'Cafe'),
			expense('i3', '2026-08-20T00:00:00.000', 500, 'Cafe'),
		];
		const variable = [
			expense('v1', '2026-07-01T00:00:00.000', 500, 'Power'),
			expense('v2', '2026-08-01T00:00:00.000', 900, 'Power'),
			expense('v3', '2026-09-01T00:00:00.000', 500, 'Power'),
		];
		const recurring = monthly.map((entry) => ({
			...entry,
			id: `r${entry.id}`,
			note: 'Rent',
			recurrenceSourceId: 'source',
		}));
		expect(
			detectSubscriptions(
				[
					...irregular,
					...variable,
					...recurring,
					...monthly.slice(0, 2),
				],
				new Set(),
			),
		).toEqual([]);
		expect(detectSubscriptions(monthly, new Set(['netflix']))).toEqual([]);
	});
});

describe('account balance', () => {
	it('combines opening balance, activity and transfers', () => {
		expect(
			accountBalance({
				openingBalanceMinor: 10_000,
				incomeMinor: 5_000,
				expenseMinor: 3_000,
				transfersInMinor: 2_000,
				transfersOutMinor: 4_000,
			}),
		).toBe(10_000);
	});
});
