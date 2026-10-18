import type { SqlExecutor } from '@/data/database/sql-database';
import {
	listPostedOccurrenceDates,
	listRecurringTransactions,
	listTransactionsBetween,
	updateTransaction,
} from '@/data/repositories/transaction-repository';
import {
	detectSubscriptions,
	normalizeSubscriptionKey,
	type SubscriptionCandidate,
} from '@/domain/calculations/insights';
import { scheduleFor } from '@/domain/calculations/recurring-schedule';
import {
	addDays,
	startOfMonth,
	startOfNextMonth,
	toLocalDate,
	toLocalDateTime,
} from '@/domain/dates';
import { sumMinor, type MinorUnits } from '@/domain/money/money';

import { requireDatabase, useSession } from '../session/session-store';

const SUBSCRIPTION_LOOKBACK_DAYS = 400;

export async function loadSubscriptionCandidates(
	db: SqlExecutor,
	nowDate: Date,
): Promise<SubscriptionCandidate[]> {
	const [recent, recurring] = await Promise.all([
		listTransactionsBetween(
			db,
			toLocalDateTime(addDays(nowDate, -SUBSCRIPTION_LOOKBACK_DAYS)),
			toLocalDateTime(addDays(nowDate, 1)),
		),
		listRecurringTransactions(db),
	]);
	const excluded = new Set(
		recurring.map((source) => normalizeSubscriptionKey(source.note)),
	);
	return detectSubscriptions(recent, excluded);
}

export async function upcomingRecurringExpenseThisMonth(
	db: SqlExecutor,
	nowDate: Date,
): Promise<MinorUnits> {
	const monthStart = toLocalDate(startOfMonth(nowDate));
	const monthEnd = toLocalDate(addDays(startOfNextMonth(nowDate), -1));
	const sources = await listRecurringTransactions(db);
	const amounts: MinorUnits[] = [];
	for (const source of sources) {
		if (source.type !== 'expense') continue;
		const schedule = scheduleFor(
			source,
			await listPostedOccurrenceDates(db, source.id),
			monthEnd,
			monthEnd,
		);
		for (const date of schedule.dueDates)
			if (date >= monthStart) amounts.push(source.amountMinor);
	}
	return sumMinor(amounts);
}

export async function makeSubscriptionRecurring(
	candidate: SubscriptionCandidate,
): Promise<void> {
	await updateTransaction(requireDatabase(), {
		...candidate.latest,
		recurrence: { frequency: candidate.frequency, day: null, month: null },
		updatedAt: toLocalDateTime(new Date()),
	});
	useSession.getState().notifyDataChanged();
}
