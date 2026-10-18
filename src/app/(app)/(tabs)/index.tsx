import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BudgetMeter } from '@/components/finance/budget-meter';
import { TransactionRow } from '@/components/finance/transaction-row';
import {
	EmptyState,
	ErrorState,
	LoadingState,
} from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import {
	listLedgerEntries,
	queryTransactions,
} from '@/data/repositories/transaction-repository';
import { evaluateBudget } from '@/domain/calculations/budget';
import {
	calculateSafeToSpend,
	type SafeToSpend,
} from '@/domain/calculations/insights';
import { summarizeLedger } from '@/domain/calculations/ledger';
import { toLocalDateTime } from '@/domain/dates';
import { loadAccountBalances } from '@/features/accounts/account-service';
import { upcomingRecurringExpenseThisMonth } from '@/features/insights/insights-service';
import {
	countDue,
	loadRecurringSchedules,
} from '@/features/recurring/recurring-service';
import { useIsPro } from '@/features/pro/pro-store';
import { updateSettings } from '@/features/settings/settings-service';
import {
	useCategories,
	useMoneyFormatter,
	useSettings,
	type MoneyFormatter,
} from '@/hooks/use-app-data';
import { useLedgerQuery } from '@/hooks/use-ledger-query';
import { formatMonth } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

function greeting(date: Date): string {
	const hour = date.getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

export default function HomeScreen() {
	const theme = useTheme();
	const settings = useSettings();
	const formatAmount = useMoneyFormatter();
	const isPro = useIsPro();
	const { byId: categories } = useCategories(true);
	const overview = useLedgerQuery(
		async (db) => {
			const nowDate = new Date();
			const [entries, recent, schedules, upcomingExpense, accounts] =
				await Promise.all([
					listLedgerEntries(db),
					queryTransactions(db, {
						limit: 6,
						offset: 0,
						toDate: toLocalDateTime(nowDate).slice(0, 10),
					}),
					loadRecurringSchedules(db, nowDate),
					upcomingRecurringExpenseThisMonth(db, nowDate),
					loadAccountBalances(db, nowDate),
				]);
			const summary = summarizeLedger(entries, nowDate);
			return {
				nowDate,
				summary,
				accounts,
				safeToSpend: calculateSafeToSpend({
					budgetMinor: settings.monthlyBudgetMinor,
					monthIncomeMinor: summary.monthIncomeMinor,
					monthExpenseMinor: summary.monthExpenseMinor,
					upcomingExpenseMinor: upcomingExpense,
					today: nowDate,
				}),
				recent,
				due: countDue(schedules),
				hasAny: entries.length > 0,
			};
		},
		[settings.monthlyBudgetMinor],
	);

	const addTransaction = () => router.push('/transaction/edit');
	const nowDate = overview.data?.nowDate ?? new Date();
	const now = toLocalDateTime(nowDate);

	return (
		<Screen
			topInset
			subtitle={`${greeting(nowDate)}${settings.name ? `, ${settings.name}` : ''}`}
			title='Overview'
			headerAction={
				<View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
					<Pressable
						accessibilityRole='button'
						accessibilityLabel={
							settings.hideAmounts
								? 'Show amounts'
								: 'Hide amounts'
						}
						onPress={() =>
							updateSettings({
								hideAmounts: !settings.hideAmounts,
							})
						}
						style={{
							width: 44,
							height: 44,
							borderRadius: 22,
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: theme.colors.surface,
						}}>
						<Icon
							name={settings.hideAmounts ? 'hidden' : 'visible'}
							size={18}
							color={theme.colors.textSecondary}
						/>
					</Pressable>
					<Pressable
						accessibilityRole='button'
						accessibilityLabel='Add transaction'
						onPress={addTransaction}
						style={{
							width: 44,
							height: 44,
							borderRadius: 22,
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: theme.colors.brandPrimary,
						}}>
						<Icon
							name='add'
							size={20}
							color={theme.colors.textOnBrand}
						/>
					</Pressable>
				</View>
			}>
			{overview.status === 'loading' ? <LoadingState /> : null}
			{overview.status === 'error' && !overview.data ? (
				<ErrorState
					message='Your overview could not be loaded.'
					onRetry={overview.reload}
				/>
			) : null}
			{overview.data ? (
				<>
					<Surface
						style={{
							gap: theme.spacing.md,
							padding: theme.spacing.lg,
						}}>
						<View style={{ gap: 2 }}>
							<AppText variant='label' tone='textSecondary'>
								Balance
							</AppText>
							<AppText
								variant='displayXL'
								numeric
								adjustsFontSizeToFit
								numberOfLines={1}
								accessibilityLabel={`Balance ${formatAmount(overview.data.summary.balanceMinor)}`}>
								{formatAmount(
									overview.data.summary.balanceMinor,
								)}
							</AppText>
							<AppText variant='bodySmall' tone='textTertiary'>
								All income minus all expenses to date
							</AppText>
						</View>
						<Divider />
						<View
							style={{
								flexDirection: 'row',
								gap: theme.spacing.md,
							}}>
							<Metric
								label={`${formatMonth(nowDate)} income`}
								value={formatAmount(
									overview.data.summary.monthIncomeMinor,
								)}
								tone='positive'
								icon='income'
							/>
							<Metric
								label={`${formatMonth(nowDate)} spending`}
								value={formatAmount(
									overview.data.summary.monthExpenseMinor,
								)}
								tone='negative'
								icon='expense'
							/>
						</View>
					</Surface>

					<Surface style={{ gap: theme.spacing.sm }}>
						<View
							style={{
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'baseline',
							}}>
							<AppText variant='heading3'>This month</AppText>
							<AppText
								variant='bodySmall'
								tone='textSecondary'
								numeric>
								{formatAmount(
									overview.data.summary
										.averageDailySpendingMinor,
								)}{' '}
								/ day
							</AppText>
						</View>
						{settings.monthlyBudgetMinor ? (
							<BudgetMeter
								status={evaluateBudget(
									overview.data.summary.monthExpenseMinor,
									settings.monthlyBudgetMinor,
									settings.budgetAlertPercent,
								)}
								formatAmount={formatAmount}
							/>
						) : (
							<Button
								label='Set a monthly budget'
								variant='ghost'
								compact
								icon='planning'
								onPress={() => router.push('/settings/budget')}
							/>
						)}
						{overview.data.safeToSpend && !isPro ? (
							<Button
								label='See your safe-to-spend with Pro'
								variant='ghost'
								compact
								icon='spark'
								onPress={() => router.push('/pro')}
							/>
						) : null}
						{overview.data.safeToSpend && isPro ? (
							<SafeToSpendLine
								safeToSpend={overview.data.safeToSpend}
								formatAmount={formatAmount}
							/>
						) : null}
					</Surface>

					{overview.data.accounts.length > 1 ? (
						<Section
							title='Accounts'
							action={
								<Button
									label='Manage'
									variant='ghost'
									compact
									onPress={() => router.push('/accounts')}
								/>
							}>
							<Surface padded={false}>
								{overview.data.accounts.map((entry, index) => (
									<View key={entry.account.id}>
										{index > 0 ? (
											<Divider inset={60} />
										) : null}
										<ListRow
											icon='account'
											iconColor={entry.account.color}
											title={entry.account.name}
											value={formatAmount(
												entry.balanceMinor,
											)}
										/>
									</View>
								))}
							</Surface>
						</Section>
					) : null}

					{overview.data.due > 0 ? (
						<Surface padded={false}>
							<ListRow
								icon='recurring'
								title={`${overview.data.due} recurring ${overview.data.due === 1 ? 'payment is' : 'payments are'} due`}
								subtitle='Review and record them'
								onPress={() => router.push('/recurring')}
							/>
						</Surface>
					) : null}

					<Section
						title='Recent'
						action={
							overview.data.hasAny ? (
								<Button
									label='See all'
									variant='ghost'
									compact
									onPress={() => router.navigate('/activity')}
								/>
							) : undefined
						}>
						<Surface padded={false}>
							{overview.data.recent.length === 0 ? (
								<EmptyState
									icon='activity'
									title='No transactions yet'
									message='Record your first income or expense to see your balance and spending here.'
									actionLabel='Add transaction'
									onAction={addTransaction}
								/>
							) : (
								overview.data.recent.map(
									(transaction, index) => (
										<View key={transaction.id}>
											{index > 0 ? (
												<Divider inset={64} />
											) : null}
											<TransactionRow
												transaction={transaction}
												category={categories.get(
													transaction.categoryId,
												)}
												formatAmount={formatAmount}
												now={now}
												onPress={(tx) =>
													router.push(
														`/transaction/${tx.id}`,
													)
												}
											/>
										</View>
									),
								)
							)}
						</Surface>
					</Section>
					{overview.data.summary.scheduledCount > 0 ? (
						<AppText
							variant='bodySmall'
							tone='textTertiary'
							align='center'>
							{overview.data.summary.scheduledCount} future-dated{' '}
							{overview.data.summary.scheduledCount === 1
								? 'transaction is'
								: 'transactions are'}{' '}
							not counted yet.
						</AppText>
					) : null}
				</>
			) : null}
		</Screen>
	);
}

function SafeToSpendLine({
	safeToSpend,
	formatAmount,
}: {
	safeToSpend: SafeToSpend;
	formatAmount: MoneyFormatter;
}) {
	const theme = useTheme();
	const basisLabel =
		safeToSpend.basis === 'budget' ? 'your budget' : "this month's income";
	const overspent = safeToSpend.remainingMinor <= 0;
	return (
		<View
			style={{ gap: 2, paddingTop: theme.spacing.xs }}
			accessible
			accessibilityLabel={
				overspent
					? `Nothing left to spend from ${basisLabel} this month`
					: `Safe to spend ${formatAmount(safeToSpend.dailyMinor)} per day for ${safeToSpend.daysRemaining} days`
			}>
			<AppText variant='label' tone='textSecondary'>
				Safe to spend
			</AppText>
			<AppText variant='heading2' numeric>
				{overspent
					? formatAmount(0)
					: `${formatAmount(safeToSpend.dailyMinor)} / day`}
			</AppText>
			<AppText variant='caption' tone='textTertiary'>
				{overspent
					? `You've used all of ${basisLabel} for this month, including upcoming recurring payments.`
					: `Based on ${basisLabel}, after spending so far and recurring payments still due, over the ${safeToSpend.daysRemaining} days left.`}
			</AppText>
		</View>
	);
}

function Metric({
	label,
	value,
	tone,
	icon,
}: {
	label: string;
	value: string;
	tone: 'positive' | 'negative';
	icon: 'income' | 'expense';
}) {
	const theme = useTheme();
	const color =
		tone === 'positive' ? theme.colors.positive : theme.colors.negative;
	return (
		<View
			style={{ flex: 1, gap: 4 }}
			accessible
			accessibilityLabel={`${label}, ${value}`}>
			<View
				style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
				<Icon name={icon} size={12} color={color} />
				<AppText
					variant='caption'
					tone='textSecondary'
					numberOfLines={1}>
					{label}
				</AppText>
			</View>
			<AppText
				variant='heading2'
				numeric
				numberOfLines={1}
				adjustsFontSizeToFit>
				{value}
			</AppText>
		</View>
	);
}
