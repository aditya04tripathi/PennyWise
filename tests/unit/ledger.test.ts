import {
	budgetAlertToSend,
	evaluateBudget,
} from '@/domain/calculations/budget';
import {
	expenseTotalsByCategory,
	summarizeLedger,
	type LedgerEntry,
} from '@/domain/calculations/ledger';
import { dailyNetTrend, summarizeDays } from '@/domain/calculations/trends';

const entry = (
	type: LedgerEntry['type'],
	amountMinor: number,
	occurredAt: string,
	categoryId = 'food',
): LedgerEntry => ({
	type,
	amountMinor,
	occurredAt,
	categoryId,
});

describe('summarizeLedger', () => {
	const now = new Date(2026, 9, 10, 12, 0, 0);
	const entries = [
		entry('income', 300000, '2026-09-01T09:00:00.000'),
		entry('expense', 125000, '2026-09-03T00:00:00.000'),
		entry('income', 50000, '2026-10-01T09:00:00.000'),
		entry('expense', 1000, '2026-10-02T10:00:00.000'),
		entry('expense', 2000, '2026-10-10T11:59:59.999'),
		entry('expense', 9999, '2026-10-10T12:00:00.001'),
		entry('income', 50000, '2099-01-01T00:00:00.000'),
	];

	it('matches legacy semantics: all-time balance excluding future-dated records', () => {
		const summary = summarizeLedger(entries, now);
		expect(summary.allTimeIncomeMinor).toBe(350000);
		expect(summary.allTimeExpenseMinor).toBe(128000);
		expect(summary.balanceMinor).toBe(222000);
		expect(summary.scheduledCount).toBe(2);
	});

	it('computes current-month figures and the legacy daily average', () => {
		const summary = summarizeLedger(entries, now);
		expect(summary.monthIncomeMinor).toBe(50000);
		expect(summary.monthExpenseMinor).toBe(3000);
		expect(summary.monthNetMinor).toBe(47000);
		expect(summary.averageDailySpendingMinor).toBe(300);
	});

	it('handles an empty ledger', () => {
		expect(summarizeLedger([], now)).toMatchObject({
			balanceMinor: 0,
			averageDailySpendingMinor: 0,
			scheduledCount: 0,
		});
	});

	it('groups expenses by category for a month, largest first', () => {
		const totals = expenseTotalsByCategory(
			[
				entry('expense', 500, '2026-10-01T00:00:00.000', 'a'),
				entry('expense', 900, '2026-10-02T00:00:00.000', 'b'),
				entry('expense', 600, '2026-10-03T00:00:00.000', 'a'),
				entry('income', 5000, '2026-10-03T00:00:00.000', 'a'),
			],
			'2026-10',
			now,
		);
		expect(totals).toEqual([
			{ categoryId: 'a', totalMinor: 1100 },
			{ categoryId: 'b', totalMinor: 900 },
		]);
	});
});

describe('trends', () => {
	it('produces a zero-filled daily net series', () => {
		const series = dailyNetTrend(
			[
				entry('income', 1000, '2026-10-09T10:00:00.000'),
				entry('expense', 300, '2026-10-09T11:00:00.000'),
				entry('expense', 100, '2026-10-01T00:00:00.000'),
			],
			new Date(2026, 9, 10, 12),
			3,
		);
		expect(series).toEqual([
			{ date: '2026-10-08', netMinor: 0 },
			{ date: '2026-10-09', netMinor: 700 },
			{ date: '2026-10-10', netMinor: 0 },
		]);
	});

	it('separates scheduled items from posted day totals', () => {
		const days = summarizeDays(
			[
				entry('expense', 100, '2026-10-10T08:00:00.000'),
				entry('income', 900, '2026-10-10T20:00:00.000'),
			],
			new Date(2026, 9, 10, 12),
		);
		expect(days.get('2026-10-10')).toMatchObject({
			expenseMinor: 100,
			incomeMinor: 0,
			hasScheduled: true,
			transactionCount: 2,
		});
	});
});

describe('budget', () => {
	it('evaluates states at boundaries', () => {
		expect(evaluateBudget(0, null, 80).state).toBe('unset');
		expect(evaluateBudget(79_99, 100_00, 80).state).toBe('within');
		expect(evaluateBudget(80_00, 100_00, 80).state).toBe('approaching');
		expect(evaluateBudget(100_00, 100_00, 80).state).toBe('approaching');
		expect(evaluateBudget(100_01, 100_00, 80)).toMatchObject({
			state: 'exceeded',
			remainingMinor: -1,
		});
	});

	it('alerts once per crossing', () => {
		expect(budgetAlertToSend(7000, 8500, 10000, 80, [])).toBe('threshold');
		expect(
			budgetAlertToSend(8500, 9000, 10000, 80, ['threshold']),
		).toBeNull();
		expect(budgetAlertToSend(9000, 10001, 10000, 80, ['threshold'])).toBe(
			'exceeded',
		);
		expect(budgetAlertToSend(7000, 12000, 10000, 80, [])).toBe('exceeded');
		expect(
			budgetAlertToSend(10001, 12000, 10000, 80, [
				'threshold',
				'exceeded',
			]),
		).toBeNull();
		expect(budgetAlertToSend(0, 12000, null, 80, [])).toBeNull();
	});
});
