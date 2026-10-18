import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CategoryBadge } from '@/components/finance/category-badge';
import { showMessage, userFacingError } from '@/components/feedback/confirm';
import {
	EmptyState,
	ErrorState,
	LoadingState,
} from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import type { RecurringSchedule } from '@/domain/calculations/recurring-schedule';
import type { Category } from '@/domain/entities';
import { describeRecurrence } from '@/domain/recurrence';
import { loadRecurringSchedules } from '@/features/recurring/recurring-service';
import { postRecurringOccurrence } from '@/features/transactions/transaction-service';
import { useCategories, useMoneyFormatter } from '@/hooks/use-app-data';
import { useLedgerQuery } from '@/hooks/use-ledger-query';
import { formatShortDate } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

export default function RecurringScreen() {
	const theme = useTheme();
	const formatAmount = useMoneyFormatter();
	const { byId: categories } = useCategories(true);
	const schedules = useLedgerQuery(
		(db) => loadRecurringSchedules(db, new Date()),
		[],
	);
	const [posting, setPosting] = useState<string | null>(null);

	const post = async (schedule: RecurringSchedule, dates: string[]) => {
		setPosting(schedule.source.id);
		try {
			for (const date of dates)
				await postRecurringOccurrence(schedule.source, date);
		} catch (error) {
			showMessage('Not recorded', userFacingError(error));
		} finally {
			setPosting(null);
		}
	};

	const due =
		schedules.data?.filter((schedule) => schedule.dueDates.length > 0) ??
		[];

	return (
		<Screen>
			{schedules.status === 'loading' ? <LoadingState /> : null}
			{schedules.status === 'error' ? (
				<ErrorState
					message='Recurring items could not be loaded.'
					onRetry={schedules.reload}
				/>
			) : null}
			{schedules.data && schedules.data.length === 0 ? (
				<EmptyState
					icon='recurring'
					title='Nothing repeats yet'
					message='When you add a transaction, choose how often it repeats. Due payments appear here for you to confirm.'
					actionLabel='Add transaction'
					onAction={() => router.push('/transaction/edit')}
				/>
			) : null}
			{due.length > 0 ? (
				<Section title='Due now'>
					{due.map((schedule) => (
						<Surface
							key={schedule.source.id}
							style={{ gap: theme.spacing.sm }}>
							<ScheduleHeader
								schedule={schedule}
								categories={categories}
								amount={formatAmount(
									schedule.source.amountMinor,
								)}
							/>
							<AppText variant='bodySmall' tone='textSecondary'>
								Due{' '}
								{schedule.dueDates
									.map(formatShortDate)
									.join(', ')}
							</AppText>
							<View
								style={{
									flexDirection: 'row',
									gap: theme.spacing.xs,
									flexWrap: 'wrap',
								}}>
								<Button
									label={
										schedule.dueDates.length === 1
											? 'Record'
											: `Record all ${schedule.dueDates.length}`
									}
									compact
									loading={posting === schedule.source.id}
									onPress={() =>
										post(schedule, schedule.dueDates)
									}
								/>
								{schedule.dueDates.length > 1 ? (
									<Button
										label='Record latest only'
										variant='secondary'
										compact
										disabled={posting !== null}
										onPress={() =>
											post(
												schedule,
												schedule.dueDates.slice(-1),
											)
										}
									/>
								) : null}
							</View>
						</Surface>
					))}
				</Section>
			) : null}
			{schedules.data && schedules.data.length > 0 ? (
				<Section title='All schedules'>
					<Surface padded={false}>
						{schedules.data.map((schedule, index) => (
							<View key={schedule.source.id}>
								{index > 0 ? <Divider inset={16} /> : null}
								<View
									style={{
										padding: theme.spacing.md,
										gap: 4,
									}}>
									<ScheduleHeader
										schedule={schedule}
										categories={categories}
										amount={formatAmount(
											schedule.source.amountMinor,
										)}
									/>
									<AppText
										variant='bodySmall'
										tone='textSecondary'>
										{schedule.nextDate
											? `Next on ${formatShortDate(schedule.nextDate)}`
											: 'No upcoming date in the next 45 days'}
									</AppText>
									<Button
										label='Edit or stop'
										variant='ghost'
										compact
										onPress={() =>
											router.push(
												`/transaction/${schedule.source.id}`,
											)
										}
									/>
								</View>
							</View>
						))}
					</Surface>
					<AppText variant='bodySmall' tone='textTertiary'>
						Missed dates before the most recent recorded one are
						treated as skipped.
					</AppText>
				</Section>
			) : null}
		</Screen>
	);
}

function ScheduleHeader({
	schedule,
	categories,
	amount,
}: {
	schedule: RecurringSchedule;
	categories: ReadonlyMap<string, Category>;
	amount: string;
}) {
	const theme = useTheme();
	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				gap: theme.spacing.sm,
			}}>
			<CategoryBadge
				category={categories.get(schedule.source.categoryId)}
				size={32}
			/>
			<View style={{ flex: 1 }}>
				<AppText
					variant='body'
					style={{ fontWeight: '600' }}
					numberOfLines={1}>
					{schedule.source.note}
				</AppText>
				<AppText variant='bodySmall' tone='textSecondary'>
					{schedule.source.recurrence
						? describeRecurrence(schedule.source.recurrence)
						: ''}
				</AppText>
			</View>
			<AppText
				variant='body'
				numeric
				tone={
					schedule.source.type === 'income'
						? 'positive'
						: 'textPrimary'
				}
				style={{ fontWeight: '600' }}>
				{amount}
			</AppText>
		</View>
	);
}
