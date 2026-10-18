import { localDateOf, type LocalDate } from '../dates';
import type { Transaction } from '../entities';
import { occurrencesBetween } from '../recurrence';

export interface RecurringSchedule {
	source: Transaction;
	dueDates: LocalDate[];
	nextDate: LocalDate | null;
}

export const MAX_DUE_PER_SOURCE = 60;
const MAX_ITERATIONS = 5000;

export function scheduleFor(
	source: Transaction,
	postedDates: readonly LocalDate[],
	today: LocalDate,
	horizon: LocalDate,
): RecurringSchedule {
	if (!source.recurrence) return { source, dueDates: [], nextDate: null };
	const anchor = localDateOf(source.occurredAt);
	const latestPosted = postedDates.reduce<LocalDate>(
		(latest, date) => (date > latest ? date : latest),
		anchor,
	);
	const candidates = occurrencesBetween(
		source.recurrence,
		anchor,
		latestPosted,
		horizon,
		MAX_ITERATIONS,
	);
	const dueDates = candidates
		.filter((date) => date <= today)
		.slice(-MAX_DUE_PER_SOURCE);
	const nextDate = candidates.find((date) => date > today) ?? null;
	return { source, dueDates, nextDate };
}
