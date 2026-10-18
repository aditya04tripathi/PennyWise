import {
	describeRecurrence,
	nextOccurrence,
	occurrencesBetween,
} from '@/domain/recurrence';

describe('nextOccurrence', () => {
	it('advances daily schedules', () => {
		expect(
			nextOccurrence(
				{ frequency: 'daily', day: null, month: null },
				'2026-10-01',
				'2026-10-05',
			),
		).toBe('2026-10-06');
	});

	it('starts on the anchor when asked before it', () => {
		expect(
			nextOccurrence(
				{ frequency: 'daily', day: null, month: null },
				'2026-10-10',
				'2026-10-01',
			),
		).toBe('2026-10-10');
	});

	it('finds the next ISO weekday', () => {
		expect(
			nextOccurrence(
				{ frequency: 'weekly', day: 1, month: null },
				'2026-10-01',
				'2026-10-14',
			),
		).toBe('2026-10-19');
		expect(
			nextOccurrence(
				{ frequency: 'weekly', day: 7, month: null },
				'2026-10-01',
				'2026-10-18',
			),
		).toBe('2026-10-25');
	});

	it('clamps month-end days without drifting', () => {
		const rent = { frequency: 'monthly' as const, day: 31, month: null };
		expect(
			occurrencesBetween(rent, '2026-01-31', '2026-01-31', '2026-05-31'),
		).toEqual(['2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
	});

	it('handles leap days for yearly schedules', () => {
		const vet = { frequency: 'yearly' as const, day: 29, month: 2 };
		expect(
			occurrencesBetween(vet, '2024-02-29', '2024-02-29', '2028-12-31'),
		).toEqual(['2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
	});

	it('falls back to the anchor day when the legacy record has no day', () => {
		expect(
			nextOccurrence(
				{ frequency: 'monthly', day: null, month: null },
				'2026-01-15',
				'2026-03-20',
			),
		).toBe('2026-04-15');
	});

	it('is idempotent when replayed from the same cursor', () => {
		const rule = { frequency: 'monthly' as const, day: 1, month: null };
		expect(
			occurrencesBetween(rule, '2026-01-01', '2026-01-01', '2026-04-01'),
		).toEqual(
			occurrencesBetween(rule, '2026-01-01', '2026-01-01', '2026-04-01'),
		);
	});

	it('describes schedules in plain language', () => {
		expect(
			describeRecurrence({ frequency: 'weekly', day: 1, month: null }),
		).toBe('Every Monday');
		expect(
			describeRecurrence({ frequency: 'yearly', day: 29, month: 2 }),
		).toBe('Every year on Feb 29');
	});
});
