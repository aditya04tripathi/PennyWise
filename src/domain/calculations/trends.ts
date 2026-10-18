import {
	addDays,
	localDateOf,
	toLocalDate,
	toLocalDateTime,
	type LocalDate,
} from '../dates';
import { addMinor, type MinorUnits } from '../money/money';
import { isPosted, signedAmount, type LedgerEntry } from './ledger';

export interface DailyNet {
	date: LocalDate;
	netMinor: MinorUnits;
}

export function dailyNetTrend(
	entries: readonly LedgerEntry[],
	nowDate: Date,
	days: number,
): DailyNet[] {
	const now = toLocalDateTime(nowDate);
	const series = new Map<LocalDate, MinorUnits>();
	for (let offset = days - 1; offset >= 0; offset -= 1) {
		series.set(toLocalDate(addDays(nowDate, -offset)), 0);
	}
	for (const entry of entries) {
		if (!isPosted(entry, now)) continue;
		const day = localDateOf(entry.occurredAt);
		const current = series.get(day);
		if (current === undefined) continue;
		series.set(
			day,
			addMinor(current, signedAmount(entry.type, entry.amountMinor)),
		);
	}
	return [...series.entries()].map(([date, netMinor]) => ({
		date,
		netMinor,
	}));
}

export interface DaySummary {
	date: LocalDate;
	incomeMinor: MinorUnits;
	expenseMinor: MinorUnits;
	netMinor: MinorUnits;
	transactionCount: number;
	hasScheduled: boolean;
}

export function summarizeDays(
	entries: readonly LedgerEntry[],
	nowDate: Date,
): Map<LocalDate, DaySummary> {
	const now = toLocalDateTime(nowDate);
	const summaries = new Map<LocalDate, DaySummary>();
	for (const entry of entries) {
		const date = localDateOf(entry.occurredAt);
		const summary = summaries.get(date) ?? {
			date,
			incomeMinor: 0,
			expenseMinor: 0,
			netMinor: 0,
			transactionCount: 0,
			hasScheduled: false,
		};
		summary.transactionCount += 1;
		if (!isPosted(entry, now)) {
			summary.hasScheduled = true;
		} else if (entry.type === 'income') {
			summary.incomeMinor = addMinor(
				summary.incomeMinor,
				entry.amountMinor,
			);
		} else {
			summary.expenseMinor = addMinor(
				summary.expenseMinor,
				entry.amountMinor,
			);
		}
		summary.netMinor = addMinor(summary.incomeMinor, -summary.expenseMinor);
		summaries.set(date, summary);
	}
	return summaries;
}
