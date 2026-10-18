import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { TransactionRow } from '@/components/finance/transaction-row';
import { EmptyState, ErrorState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Divider, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { listTransactionsBetween } from '@/data/repositories/transaction-repository';
import { summarizeDays } from '@/domain/calculations/trends';
import {
	daysInMonth,
	localDateOf,
	toLocalDate,
	toLocalDateTime,
	type LocalDate,
} from '@/domain/dates';
import { useCategories, useMoneyFormatter } from '@/hooks/use-app-data';
import { useLedgerQuery } from '@/hooks/use-ledger-query';
import { formatFullDay, formatMonth } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAY_NAMES = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday',
];

export default function CalendarScreen() {
	const theme = useTheme();
	const formatAmount = useMoneyFormatter();
	const { byId: categories } = useCategories(true);
	const today = toLocalDate(new Date());
	const [cursor, setCursor] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});
	const [selected, setSelected] = useState<LocalDate>(today);

	const month = useLedgerQuery(
		async (db) => {
			const start = toLocalDateTime(cursor);
			const end = toLocalDateTime(
				new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
			);
			return listTransactionsBetween(db, start, end);
		},
		[cursor.getTime()],
	);

	const summaries = useMemo(
		() => summarizeDays(month.data ?? [], new Date()),
		[month.data],
	);
	const dayTransactions = (month.data ?? []).filter(
		(tx) => localDateOf(tx.occurredAt) === selected,
	);
	const now = toLocalDateTime(new Date());
	const year = cursor.getFullYear();
	const monthIndex = cursor.getMonth();
	const leading = (cursor.getDay() + 6) % 7;
	const cells: (LocalDate | null)[] = [
		...Array.from({ length: leading }, () => null),
		...Array.from({ length: daysInMonth(year, monthIndex) }, (_, index) =>
			toLocalDate(new Date(year, monthIndex, index + 1)),
		),
	];
	while (cells.length % 7 !== 0) cells.push(null);

	const move = (offset: number) => {
		const next = new Date(year, monthIndex + offset, 1);
		setCursor(next);
		setSelected(toLocalDate(next));
	};

	return (
		<Screen topInset title='Calendar'>
			<Surface style={{ gap: theme.spacing.sm }}>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}>
					<Pressable
						accessibilityRole='button'
						accessibilityLabel='Previous month'
						onPress={() => move(-1)}
						hitSlop={10}
						style={{ padding: theme.spacing.xs }}>
						<Icon
							name='chevronLeft'
							size={16}
							color={theme.colors.textPrimary}
						/>
					</Pressable>
					<AppText
						variant='heading3'
						accessibilityLiveRegion='polite'>
						{formatMonth(cursor)}
					</AppText>
					<Pressable
						accessibilityRole='button'
						accessibilityLabel='Next month'
						onPress={() => move(1)}
						hitSlop={10}
						style={{ padding: theme.spacing.xs }}>
						<Icon
							name='chevronRight'
							size={16}
							color={theme.colors.textPrimary}
						/>
					</Pressable>
				</View>
				<View
					style={{ flexDirection: 'row' }}
					importantForAccessibility='no-hide-descendants'>
					{WEEKDAYS.map((day, index) => (
						<AppText
							key={index}
							variant='caption'
							tone='textTertiary'
							align='center'
							style={{ flex: 1 }}>
							{day}
						</AppText>
					))}
				</View>
				{month.status === 'error' ? (
					<ErrorState
						message='This month could not be loaded.'
						onRetry={month.reload}
					/>
				) : null}
				<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
					{cells.map((date, index) => {
						if (!date)
							return (
								<View
									key={`empty-${index}`}
									style={{
										width: `${100 / 7}%`,
										aspectRatio: 1,
									}}
								/>
							);
						const summary = summaries.get(date);
						const isSelected = date === selected;
						const isToday = date === today;
						const label = [
							formatFullDay(date),
							summary?.expenseMinor
								? `spent ${formatAmount(summary.expenseMinor)}`
								: null,
							summary?.incomeMinor
								? `earned ${formatAmount(summary.incomeMinor)}`
								: null,
							summary?.hasScheduled
								? 'has scheduled items'
								: null,
						]
							.filter(Boolean)
							.join(', ');
						return (
							<Pressable
								key={date}
								accessibilityRole='button'
								accessibilityState={{ selected: isSelected }}
								accessibilityLabel={label}
								accessibilityHint={WEEKDAY_NAMES[index % 7]}
								onPress={() => setSelected(date)}
								style={{
									width: `${100 / 7}%`,
									aspectRatio: 1,
									padding: 2,
								}}>
								<View
									style={{
										flex: 1,
										borderRadius: theme.radii.sm,
										alignItems: 'center',
										justifyContent: 'center',
										gap: 3,
										backgroundColor: isSelected
											? theme.colors.brandPrimary
											: 'transparent',
										borderWidth:
											isToday && !isSelected ? 1 : 0,
										borderColor: theme.colors.brandPrimary,
									}}>
									<AppText
										variant='body'
										numeric
										style={{
											color: isSelected
												? theme.colors.textOnBrand
												: theme.colors.textPrimary,
											fontWeight: isToday ? '700' : '400',
										}}>
										{Number(date.slice(8))}
									</AppText>
									<View
										style={{
											flexDirection: 'row',
											gap: 2,
											height: 4,
										}}>
										{summary?.expenseMinor ? (
											<Dot
												color={
													isSelected
														? theme.colors
																.textOnBrand
														: theme.colors.negative
												}
											/>
										) : null}
										{summary?.incomeMinor ? (
											<Dot
												color={
													isSelected
														? theme.colors
																.textOnBrand
														: theme.colors.positive
												}
											/>
										) : null}
										{summary?.hasScheduled ? (
											<Dot
												color={
													isSelected
														? theme.colors
																.textOnBrand
														: theme.colors.warning
												}
											/>
										) : null}
									</View>
								</View>
							</Pressable>
						);
					})}
				</View>
			</Surface>

			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}>
				<AppText variant='heading3' accessibilityRole='header'>
					{formatFullDay(selected)}
				</AppText>
				<Button
					label='Add'
					icon='add'
					compact
					variant='secondary'
					onPress={() =>
						router.push({
							pathname: '/transaction/edit',
							params: { date: selected },
						})
					}
				/>
			</View>
			<Surface padded={false}>
				{dayTransactions.length === 0 ? (
					<EmptyState
						icon='calendar'
						title='Nothing on this day'
						message='Transactions for the selected day appear here.'
					/>
				) : (
					dayTransactions.map((tx, index) => (
						<View key={tx.id}>
							{index > 0 ? <Divider inset={64} /> : null}
							<TransactionRow
								transaction={tx}
								category={categories.get(tx.categoryId)}
								formatAmount={formatAmount}
								now={now}
								onPress={(item) =>
									router.push(`/transaction/${item.id}`)
								}
							/>
						</View>
					))
				)}
			</Surface>
		</Screen>
	);
}

function Dot({ color }: { color: string }) {
	return (
		<View
			style={{
				width: 4,
				height: 4,
				borderRadius: 2,
				backgroundColor: color,
			}}
		/>
	);
}
