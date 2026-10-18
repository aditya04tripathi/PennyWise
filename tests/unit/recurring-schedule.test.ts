import {
	MAX_DUE_PER_SOURCE,
	scheduleFor,
} from '@/domain/calculations/recurring-schedule';
import type { Transaction } from '@/domain/entities';

function source(overrides: Partial<Transaction> = {}): Transaction {
	return {
		id: 'rent',
		type: 'expense',
		amountMinor: 120_000,
		categoryId: '5',
		cardId: null,
		accountId: 'main',
		occurredAt: '2026-01-31T09:00:00.000',
		note: 'Rent',
		receiptFile: null,
		recurrence: { frequency: 'monthly', day: null, month: null },
		recurrenceSourceId: null,
		occurrenceDate: null,
		createdAt: '2026-01-31T09:00:00.000',
		updatedAt: '2026-01-31T09:00:00.000',
		...overrides,
	};
}

describe('scheduleFor', () => {
	it('lists unposted occurrences after the anchor, clamped to month end', () => {
		const schedule = scheduleFor(source(), [], '2026-04-15', '2026-05-31');
		expect(schedule.dueDates).toEqual(['2026-02-28', '2026-03-31']);
		expect(schedule.nextDate).toBe('2026-04-30');
	});

	it('treats occurrences before the latest posted one as handled', () => {
		const schedule = scheduleFor(
			source(),
			['2026-03-31'],
			'2026-04-30',
			'2026-05-31',
		);
		expect(schedule.dueDates).toEqual(['2026-04-30']);
		expect(schedule.nextDate).toBe('2026-05-31');
	});

	it('caps the backlog of long-unposted daily schedules to the most recent dates', () => {
		const schedule = scheduleFor(
			source({
				occurredAt: '2023-01-01T08:00:00.000',
				recurrence: { frequency: 'daily', day: null, month: null },
			}),
			[],
			'2026-01-10',
			'2026-01-20',
		);
		expect(schedule.dueDates).toHaveLength(MAX_DUE_PER_SOURCE);
		expect(schedule.dueDates.at(-1)).toBe('2026-01-10');
		expect(schedule.nextDate).toBe('2026-01-11');
	});

	it('returns nothing for one-off transactions', () => {
		expect(
			scheduleFor(
				source({ recurrence: null }),
				[],
				'2026-04-15',
				'2026-05-31',
			),
		).toEqual(expect.objectContaining({ dueDates: [], nextDate: null }));
	});
});
