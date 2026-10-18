import {
	parseLocalDateTime,
	toLocalDate,
	type LocalDate,
	type LocalDateTime,
} from '@/domain/dates';

const dayFormatter = new Intl.DateTimeFormat(undefined, {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
});
const fullDayFormatter = new Intl.DateTimeFormat(undefined, {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat(undefined, {
	hour: 'numeric',
	minute: '2-digit',
});
const monthFormatter = new Intl.DateTimeFormat(undefined, {
	month: 'long',
	year: 'numeric',
});
const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
});

export function localDateToDate(value: LocalDate): Date {
	return parseLocalDateTime(`${value}T00:00:00.000`);
}

export function formatDayHeading(value: LocalDate, today = new Date()): string {
	const todayKey = toLocalDate(today);
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);
	if (value === todayKey) return 'Today';
	if (value === toLocalDate(yesterday)) return 'Yesterday';
	if (value === toLocalDate(tomorrow)) return 'Tomorrow';
	return dayFormatter.format(localDateToDate(value));
}

export function formatFullDay(value: LocalDate): string {
	return fullDayFormatter.format(localDateToDate(value));
}

export function formatTime(value: LocalDateTime): string {
	return timeFormatter.format(parseLocalDateTime(value));
}

export function formatMonth(date: Date): string {
	return monthFormatter.format(date);
}

export function formatShortDate(value: LocalDate): string {
	return shortDateFormatter.format(localDateToDate(value));
}
