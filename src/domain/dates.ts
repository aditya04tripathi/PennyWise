export type LocalDateTime = string;
export type LocalDate = string;

const LOCAL_DATE_TIME =
	/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?(Z|[+-]\d{2}:?\d{2})?$/;

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

export function toLocalDateTime(date: Date): LocalDateTime {
	return (
		`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
		`T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
	);
}

export function toLocalDate(date: Date): LocalDate {
	return toLocalDateTime(date).slice(0, 10);
}

export class InvalidDateError extends Error {
	constructor(readonly input: string) {
		super(`Invalid date: ${input}`);
		this.name = 'InvalidDateError';
	}
}

export function normalizeIsoToLocalDateTime(input: string): LocalDateTime {
	const match = LOCAL_DATE_TIME.exec(input.trim());
	if (!match) throw new InvalidDateError(input);
	const [
		,
		year,
		month,
		day,
		hour = '00',
		minute = '00',
		second = '00',
		fraction = '',
		zone,
	] = match;
	const millis = fraction.padEnd(3, '0').slice(0, 3);
	if (zone) {
		const parsed = new Date(
			`${year}-${month}-${day}T${hour}:${minute}:${second}.${millis}${zone}`,
		);
		if (Number.isNaN(parsed.getTime())) throw new InvalidDateError(input);
		return toLocalDateTime(parsed);
	}
	const candidate = new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
		Number(hour),
		Number(minute),
		Number(second),
	);
	if (
		candidate.getMonth() !== Number(month) - 1 ||
		candidate.getDate() !== Number(day)
	) {
		throw new InvalidDateError(input);
	}
	return `${year}-${month}-${day}T${hour}:${minute}:${second}.${millis}`;
}

export function parseLocalDateTime(value: LocalDateTime): Date {
	const match = LOCAL_DATE_TIME.exec(value);
	if (!match) throw new InvalidDateError(value);
	const [
		,
		year,
		month,
		day,
		hour = '0',
		minute = '0',
		second = '0',
		fraction = '',
	] = match;
	return new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
		Number(hour),
		Number(minute),
		Number(second),
		Number(fraction.padEnd(3, '0').slice(0, 3)),
	);
}

export function localDateOf(value: LocalDateTime): LocalDate {
	return value.slice(0, 10);
}

export function monthKeyOf(value: LocalDateTime | LocalDate): string {
	return value.slice(0, 7);
}

export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfNextMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function addDays(date: Date, days: number): Date {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate() + days,
		date.getHours(),
		date.getMinutes(),
	);
}

export function daysInMonth(year: number, monthIndex: number): number {
	return new Date(year, monthIndex + 1, 0).getDate();
}
