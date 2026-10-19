import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { FreeBanner } from '@/components/ads/free-banner';
import { CategoryBreakdown } from '@/components/charts/category-breakdown';
import { NetTrend } from '@/components/charts/net-trend';
import { BudgetMeter } from '@/components/finance/budget-meter';
import {
	confirmAction,
	showMessage,
	userFacingError,
} from '@/components/feedback/confirm';
import {
	EmptyState,
	ErrorState,
	LoadingState,
} from '@/components/feedback/states';
import { IconButton } from '@/components/ui/icon-button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { listLedgerEntries } from '@/data/repositories/transaction-repository';
import { evaluateBudget } from '@/domain/calculations/budget';
import type { SubscriptionCandidate } from '@/domain/calculations/insights';
import {
	expenseTotalsByCategory,
	isPosted,
	type CategoryTotal,
} from '@/domain/calculations/ledger';
import { dailyNetTrend } from '@/domain/calculations/trends';
import { monthKeyOf, toLocalDateTime } from '@/domain/dates';
import type { Category } from '@/domain/entities';
import { addMinor } from '@/domain/money/money';
import {
	loadSubscriptionCandidates,
	makeSubscriptionRecurring,
} from '@/features/insights/insights-service';
import { useIsPro } from '@/features/pro/pro-store';
import {
	countDue,
	loadRecurringSchedules,
} from '@/features/recurring/recurring-service';
import {
	useCategories,
	useMoneyFormatter,
	useSettings,
} from '@/hooks/use-app-data';
import { useLedgerQuery } from '@/hooks/use-ledger-query';
import { formatMonth, formatShortDate } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

function shiftMonth(date: Date, offset: number): Date {
	return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export default function PlanningScreen() {
	const theme = useTheme();
	const settings = useSettings();
	const formatAmount = useMoneyFormatter();
	const isPro = useIsPro();
	const { byId: categories } = useCategories(true);
	const [monthOffset, setMonthOffset] = useState(0);

	const data = useLedgerQuery(
		async (db) => {
			const nowDate = new Date();
			const month = shiftMonth(nowDate, monthOffset);
			const monthKey = monthKeyOf(toLocalDateTime(month));
			const now = toLocalDateTime(nowDate);
			const [entries, schedules, subscriptions] = await Promise.all([
				listLedgerEntries(db),
				loadRecurringSchedules(db, nowDate),
				monthOffset === 0
					? loadSubscriptionCandidates(db, nowDate)
					: Promise.resolve([]),
			]);
			let income = 0;
			let expense = 0;
			for (const entry of entries) {
				if (
					!isPosted(entry, now) ||
					monthKeyOf(entry.occurredAt) !== monthKey
				)
					continue;
				if (entry.type === 'income')
					income = addMinor(income, entry.amountMinor);
				else expense = addMinor(expense, entry.amountMinor);
			}
			return {
				month,
				income,
				expense,
				breakdown: expenseTotalsByCategory(entries, monthKey, nowDate),
				trend: dailyNetTrend(entries, nowDate, 30),
				schedules: schedules.length,
				due: countDue(schedules),
				subscriptions,
			};
		},
		[monthOffset],
	);

	return (
		<Screen topInset tabBarInset title='Planning' footer={<FreeBanner />}>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}>
				<MonthButton
					icon='chevronLeft'
					label='Previous month'
					onPress={() => setMonthOffset((value) => value - 1)}
				/>
				<AppText variant='heading3' accessibilityLiveRegion='polite'>
					{formatMonth(shiftMonth(new Date(), monthOffset))}
				</AppText>
				<MonthButton
					icon='chevronRight'
					label='Next month'
					disabled={monthOffset >= 0}
					onPress={() => setMonthOffset((value) => value + 1)}
				/>
			</View>

			{data.status === 'loading' ? <LoadingState /> : null}
			{data.status === 'error' && !data.data ? (
				<ErrorState
					message='Planning data could not be loaded.'
					onRetry={data.reload}
				/>
			) : null}
			{data.data ? (
				<>
					<Surface style={{ gap: theme.spacing.md }}>
						<View
							style={{
								flexDirection: 'row',
								gap: theme.spacing.md,
							}}>
							<Stat
								label='Income'
								value={formatAmount(data.data.income)}
							/>
							<Stat
								label='Spending'
								value={formatAmount(data.data.expense)}
							/>
							<Stat
								label='Net'
								value={formatAmount(
									addMinor(
										data.data.income,
										-data.data.expense,
									),
									{ signDisplay: 'exceptZero' },
								)}
							/>
						</View>
						{monthOffset === 0 && settings.monthlyBudgetMinor ? (
							<BudgetMeter
								status={evaluateBudget(
									data.data.expense,
									settings.monthlyBudgetMinor,
									settings.budgetAlertPercent,
								)}
								formatAmount={formatAmount}
							/>
						) : null}
					</Surface>

					<CategoryLimits
						breakdown={data.data.breakdown}
						categories={categories}
						alertPercent={settings.budgetAlertPercent}
					/>

					{data.data.subscriptions.length > 0 && !isPro ? (
						<Surface padded={false}>
							<ListRow
								icon='spark'
								title={`${data.data.subscriptions.length} possible ${data.data.subscriptions.length === 1 ? 'subscription' : 'subscriptions'} found`}
								subtitle='See them with PennyWise Pro'
								onPress={() => router.push('/pro')}
							/>
						</Surface>
					) : null}
					{data.data.subscriptions.length > 0 && isPro ? (
						<Section title='Possible subscriptions'>
							<Surface padded={false}>
								{data.data.subscriptions.map(
									(candidate, index) => (
										<View key={candidate.key}>
											{index > 0 ? (
												<Divider inset={16} />
											) : null}
											<ListRow
												icon='spark'
												title={candidate.note}
												subtitle={`${FREQUENCY_LABELS[candidate.frequency]} · seen ${candidate.occurrences} times · last ${formatShortDate(candidate.lastDate)}`}
												value={formatAmount(
													candidate.typicalAmountMinor,
												)}
												accessibilityHint='Make this a recurring transaction'
												onPress={() =>
													confirmSubscription(
														candidate,
													)
												}
											/>
										</View>
									),
								)}
							</Surface>
							<AppText variant='caption' tone='textTertiary'>
								Spotted from repeated notes with similar
								amounts. Tap one to track it as recurring.
							</AppText>
						</Section>
					) : null}

					<Section title='Spending by category'>
						<Surface>
							{data.data.breakdown.length === 0 ? (
								<EmptyState
									icon='planning'
									title='No spending'
									message='Expenses recorded this month will be broken down by category here.'
								/>
							) : (
								<CategoryBreakdown
									totals={data.data.breakdown}
									categories={categories}
									formatAmount={formatAmount}
								/>
							)}
						</Surface>
					</Section>

					<Section title='Last 30 days'>
						<Surface>
							<NetTrend
								series={data.data.trend}
								formatAmount={formatAmount}
							/>
						</Surface>
					</Section>

					<Surface padded={false}>
						<ListRow
							icon='planning'
							title='Monthly budget'
							value={
								settings.monthlyBudgetMinor
									? formatAmount(settings.monthlyBudgetMinor)
									: 'Not set'
							}
							onPress={() => router.push('/settings/budget')}
						/>
						<Divider inset={60} />
						<ListRow
							icon='account'
							title='Accounts'
							onPress={() => router.push('/accounts')}
						/>
						<Divider inset={60} />
						<ListRow
							icon='goal'
							title='Savings goals'
							onPress={() => router.push('/goals')}
						/>
						<Divider inset={60} />
						<ListRow
							icon='recurring'
							title='Recurring'
							value={
								data.data.due > 0
									? `${data.data.due} due`
									: `${data.data.schedules}`
							}
							onPress={() => router.push('/recurring')}
						/>
						<Divider inset={60} />
						<ListRow
							icon='category'
							title='Categories'
							onPress={() => router.push('/categories')}
						/>
						<Divider inset={60} />
						<ListRow
							icon='card'
							title='Cards'
							onPress={() => router.push('/cards')}
						/>
					</Surface>
				</>
			) : null}
		</Screen>
	);
}

const FREQUENCY_LABELS: Record<SubscriptionCandidate['frequency'], string> = {
	weekly: 'Weekly',
	monthly: 'Monthly',
	yearly: 'Yearly',
};

async function confirmSubscription(candidate: SubscriptionCandidate) {
	const confirmed = await confirmAction({
		title: `Track ${candidate.note} as recurring?`,
		message: `Your latest ${candidate.note} transaction becomes a ${FREQUENCY_LABELS[candidate.frequency].toLowerCase()} recurring item. Future charges are suggested on Recurring for you to confirm; nothing is posted automatically.`,
		confirmLabel: 'Make recurring',
	});
	if (!confirmed) return;
	try {
		await makeSubscriptionRecurring(candidate);
	} catch (error) {
		showMessage('Not changed', userFacingError(error));
	}
}

function CategoryLimits({
	breakdown,
	categories,
	alertPercent,
}: {
	breakdown: readonly CategoryTotal[];
	categories: ReadonlyMap<string, Category>;
	alertPercent: number;
}) {
	const theme = useTheme();
	const formatAmount = useMoneyFormatter();
	const spentById = new Map(
		breakdown.map((entry) => [entry.categoryId, entry.totalMinor]),
	);
	const limited = [...categories.values()].filter(
		(category) => category.budgetLimitMinor && !category.archivedAt,
	);
	if (limited.length === 0) return null;
	return (
		<Section title='Category limits'>
			<Surface style={{ gap: theme.spacing.md }}>
				{limited.map((category) => (
					<View key={category.id} style={{ gap: theme.spacing.xxs }}>
						<AppText variant='label'>{category.name}</AppText>
						<BudgetMeter
							label={`${category.name} limit`}
							status={evaluateBudget(
								spentById.get(category.id) ?? 0,
								category.budgetLimitMinor,
								alertPercent,
							)}
							formatAmount={formatAmount}
						/>
					</View>
				))}
			</Surface>
		</Section>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<View
			style={{ flex: 1, gap: 2 }}
			accessible
			accessibilityLabel={`${label}, ${value}`}>
			<AppText variant='caption' tone='textSecondary'>
				{label}
			</AppText>
			<AppText
				variant='heading3'
				numeric
				numberOfLines={1}
				adjustsFontSizeToFit>
				{value}
			</AppText>
		</View>
	);
}

function MonthButton({
	icon,
	label,
	onPress,
	disabled,
}: {
	icon: 'chevronLeft' | 'chevronRight';
	label: string;
	onPress: () => void;
	disabled?: boolean;
}) {
	const theme = useTheme();
	return (
		<IconButton
			label={label}
			icon={icon}
			disabled={disabled}
			iconSize={16}
			color={theme.colors.textPrimary}
			backgroundColor={theme.colors.surface}
			onPress={onPress}
		/>
	);
}
