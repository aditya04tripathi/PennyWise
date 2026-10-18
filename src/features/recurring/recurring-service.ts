import type { SqlExecutor } from '@/data/database/sql-database';
import {
	listPostedOccurrenceDates,
	listRecurringTransactions,
} from '@/data/repositories/transaction-repository';
import {
	scheduleFor,
	type RecurringSchedule,
} from '@/domain/calculations/recurring-schedule';
import { addDays, toLocalDate } from '@/domain/dates';

export async function loadRecurringSchedules(
	db: SqlExecutor,
	nowDate: Date,
	horizonDays = 45,
): Promise<RecurringSchedule[]> {
	const today = toLocalDate(nowDate);
	const horizon = toLocalDate(addDays(nowDate, horizonDays));
	const sources = await listRecurringTransactions(db);
	const schedules: RecurringSchedule[] = [];
	for (const source of sources) {
		schedules.push(
			scheduleFor(
				source,
				await listPostedOccurrenceDates(db, source.id),
				today,
				horizon,
			),
		);
	}
	return schedules.sort((a, b) =>
		(a.nextDate ?? '9999').localeCompare(b.nextDate ?? '9999'),
	);
}

export function countDue(schedules: readonly RecurringSchedule[]): number {
	return schedules.reduce(
		(total, schedule) => total + schedule.dueDates.length,
		0,
	);
}
