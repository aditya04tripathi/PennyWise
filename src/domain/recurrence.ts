import { daysInMonth, toLocalDate, type LocalDate } from './dates';
import type { Recurrence } from './entities';

function fromLocalDate(value: LocalDate): Date {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(year, month - 1, day);
}

function clampedDate(year: number, monthIndex: number, day: number): Date {
	return new Date(
		year,
		monthIndex,
		Math.min(day, daysInMonth(year, monthIndex)),
	);
}

function isoWeekday(date: Date): number {
	return date.getDay() === 0 ? 7 : date.getDay();
}

export function anchorDayFor(
	recurrence: Recurrence,
	anchor: LocalDate,
): number {
	const anchorDate = fromLocalDate(anchor);
	if (recurrence.day !== null) return recurrence.day;
	return recurrence.frequency === 'weekly'
		? isoWeekday(anchorDate)
		: anchorDate.getDate();
}

export function nextOccurrence(
	recurrence: Recurrence,
	anchor: LocalDate,
	after: LocalDate,
): LocalDate {
	const start = fromLocalDate(after > anchor ? after : anchor);
	const strictlyAfter = after >= anchor;
	const day = anchorDayFor(recurrence, anchor);
	const candidateFrom = (base: Date) => {
		switch (recurrence.frequency) {
			case 'daily':
				return base;
			case 'weekly': {
				const offset = (day - isoWeekday(base) + 7) % 7;
				return new Date(
					base.getFullYear(),
					base.getMonth(),
					base.getDate() + offset,
				);
			}
			case 'monthly': {
				const thisMonth = clampedDate(
					base.getFullYear(),
					base.getMonth(),
					day,
				);
				return thisMonth >= base
					? thisMonth
					: clampedDate(base.getFullYear(), base.getMonth() + 1, day);
			}
			case 'yearly': {
				const monthIndex =
					(recurrence.month ?? fromLocalDate(anchor).getMonth() + 1) -
					1;
				const thisYear = clampedDate(
					base.getFullYear(),
					monthIndex,
					day,
				);
				return thisYear >= base
					? thisYear
					: clampedDate(base.getFullYear() + 1, monthIndex, day);
			}
		}
	};
	const searchFrom = strictlyAfter
		? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
		: start;
	return toLocalDate(candidateFrom(searchFrom));
}

export function occurrencesBetween(
	recurrence: Recurrence,
	anchor: LocalDate,
	fromExclusive: LocalDate,
	toInclusive: LocalDate,
	limit = 400,
): LocalDate[] {
	const results: LocalDate[] = [];
	let cursor = fromExclusive;
	while (results.length < limit) {
		const next = nextOccurrence(recurrence, anchor, cursor);
		if (next > toInclusive) break;
		results.push(next);
		cursor = next;
	}
	return results;
}

export function describeRecurrence(recurrence: Recurrence): string {
	const weekdays = [
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
		'Sunday',
	];
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	switch (recurrence.frequency) {
		case 'daily':
			return 'Every day';
		case 'weekly':
			return recurrence.day
				? `Every ${weekdays[recurrence.day - 1]}`
				: 'Every week';
		case 'monthly':
			return recurrence.day
				? `Monthly on day ${recurrence.day}`
				: 'Every month';
		case 'yearly':
			return recurrence.day && recurrence.month
				? `Every year on ${months[recurrence.month - 1]} ${recurrence.day}`
				: 'Every year';
	}
}
