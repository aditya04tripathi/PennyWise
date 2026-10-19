import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FreeBanner } from '@/components/ads/free-banner';
import { showMessage, userFacingError } from '@/components/feedback/confirm';
import {
	EmptyState,
	ErrorState,
	LoadingState,
} from '@/components/feedback/states';
import { TransactionRow } from '@/components/finance/transaction-row';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useTabBarInset } from '@/components/ui/tab-bar-inset';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import {
	queryTransactions,
	type TransactionQuery,
} from '@/data/repositories/transaction-repository';
import { localDateOf, toLocalDateTime } from '@/domain/dates';
import type { Transaction, TransactionType } from '@/domain/entities';
import { addMinor } from '@/domain/money/money';
import {
	activityFilterCount,
	receiptQuery,
	SORT_LABELS,
	useActivityFilters,
	type ActivitySort,
} from '@/features/activity/activity-filters';
import { exportTransactionsCsv } from '@/features/backup/backup-service';
import { useCategories, useMoneyFormatter } from '@/hooks/use-app-data';
import { useLedgerQuery } from '@/hooks/use-ledger-query';
import { formatDayHeading } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

const PAGE_SIZE = 50;
type TypeFilter = 'all' | TransactionType;

function useDebounced<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
}

export default function ActivityScreen() {
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	const tabInset = useTabBarInset();
	const formatAmount = useMoneyFormatter();
	const { byId: categoryById } = useCategories(true);
	const activityFilters = useActivityFilters();
	const [search, setSearch] = useState('');
	const [type, setType] = useState<TypeFilter>('all');
	const [paging, setPaging] = useState({ key: '', pages: 1 });
	const [exporting, setExporting] = useState(false);
	const debouncedSearch = useDebounced(search, 250);

	const filters = useMemo<Omit<TransactionQuery, 'limit' | 'offset'>>(
		() => ({
			search: debouncedSearch,
			type: type === 'all' ? null : type,
			categoryId: activityFilters.categoryId || null,
			cardId: activityFilters.cardId || null,
			accountId: activityFilters.accountId || null,
			hasReceipt: receiptQuery(activityFilters.receipt),
			sort: activityFilters.sort,
		}),
		[debouncedSearch, type, activityFilters],
	);

	const filterKey = JSON.stringify(filters);
	const pages = paging.key === filterKey ? paging.pages : 1;
	const loadMore = () => setPaging({ key: filterKey, pages: pages + 1 });

	const result = useLedgerQuery(
		async (db) => {
			const rows = await queryTransactions(db, {
				...filters,
				limit: pages * PAGE_SIZE + 1,
				offset: 0,
			});
			return {
				rows: rows.slice(0, pages * PAGE_SIZE),
				hasMore: rows.length > pages * PAGE_SIZE,
			};
		},
		[filters, pages],
	);

	const sections = useMemo(
		() => groupByDay(result.data?.rows ?? [], activityFilters.sort),
		[result.data, activityFilters.sort],
	);
	const now = toLocalDateTime(new Date());
	const activeFilters = activityFilterCount(activityFilters);
	const openDetail = useCallback(
		(tx: Transaction) => router.push(`/transaction/${tx.id}`),
		[],
	);

	const exportCsv = async () => {
		setExporting(true);
		try {
			const count = await exportTransactionsCsv(filters);
			if (count === 0)
				showMessage(
					'Nothing exported',
					'No transactions match the current filters.',
				);
		} catch (error) {
			showMessage('Export failed', userFacingError(error));
		} finally {
			setExporting(false);
		}
	};

	return (
		<View
			style={{
				flex: 1,
				paddingTop: insets.top,
				backgroundColor: theme.colors.background,
			}}>
			<SectionList
				style={{ flex: 1 }}
				sections={sections}
				keyExtractor={(item) => item.id}
				stickySectionHeadersEnabled={false}
				contentInsetAdjustmentBehavior='never'
				keyboardDismissMode='on-drag'
				keyboardShouldPersistTaps='handled'
				contentContainerStyle={{
					paddingTop: theme.spacing.sm,
					paddingBottom: theme.spacing.md,
				}}
				ListHeaderComponent={
					<View
						style={{
							paddingHorizontal: theme.layout.screenPadding,
							gap: theme.spacing.sm,
							paddingBottom: theme.spacing.sm,
						}}>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}>
							<AppText
								variant='heading1'
								accessibilityRole='header'>
								Activity
							</AppText>
							<IconButton
								label='Add transaction'
								icon='add'
								iconSize={20}
								color={theme.colors.textOnBrand}
								backgroundColor={theme.colors.brandPrimary}
								onPress={() => router.push('/transaction/edit')}
							/>
						</View>
						<TextField
							label='Search'
							value={search}
							onChangeText={setSearch}
							placeholder='Search descriptions'
							returnKeyType='search'
							autoCorrect={false}
							clearButtonMode='while-editing'
						/>
						<SegmentedControl
							accessibilityLabel='Transaction type'
							value={type}
							onChange={setType}
							options={[
								{ value: 'all', label: 'All' },
								{ value: 'expense', label: 'Expenses' },
								{ value: 'income', label: 'Income' },
							]}
						/>
						<View
							style={{
								flexDirection: 'row',
								gap: theme.spacing.xs,
							}}>
							<Button
								label={
									activeFilters
										? `Filters · ${activeFilters}`
										: 'Filters'
								}
								icon='filter'
								variant='secondary'
								compact
								onPress={() => router.push('/filters')}
							/>
							<Button
								label='Export CSV'
								icon='export'
								variant='secondary'
								compact
								onPress={exportCsv}
								loading={exporting}
							/>
						</View>
					</View>
				}
				renderSectionHeader={({ section }) => (
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							paddingHorizontal: theme.layout.screenPadding,
							paddingTop: theme.spacing.md,
							paddingBottom: theme.spacing.xxs,
						}}>
						<AppText
							variant='label'
							tone='textSecondary'
							accessibilityRole='header'>
							{section.title}
						</AppText>
						{section.netMinor !== null ? (
							<AppText
								variant='label'
								tone='textSecondary'
								numeric>
								{formatAmount(section.netMinor, {
									signDisplay: 'exceptZero',
								})}
							</AppText>
						) : null}
					</View>
				)}
				renderItem={({ item }) => (
					<TransactionRow
						transaction={item}
						category={categoryById.get(item.categoryId)}
						formatAmount={formatAmount}
						now={now}
						onPress={openDetail}
					/>
				)}
				ListEmptyComponent={
					result.status === 'loading' ? (
						<LoadingState />
					) : result.status === 'error' ? (
						<ErrorState
							message='Transactions could not be loaded.'
							onRetry={result.reload}
						/>
					) : search || activeFilters || type !== 'all' ? (
						<EmptyState
							icon='search'
							title='No matches'
							message='Try a different search or clear the filters.'
						/>
					) : (
						<EmptyState
							icon='activity'
							title='No transactions yet'
							message='Everything you record appears here, grouped by day.'
						/>
					)
				}
				ListFooterComponent={
					result.data?.hasMore ? (
						<Button
							label='Load more'
							variant='ghost'
							onPress={() => loadMore()}
						/>
					) : null
				}
			/>

			<FreeBanner />
			<View style={{ height: tabInset }} />
		</View>
	);
}

interface DaySection {
	title: string;
	netMinor: number | null;
	data: Transaction[];
}

function groupByDay(
	rows: readonly Transaction[],
	sort: ActivitySort,
): DaySection[] {
	if (sort.startsWith('amount'))
		return rows.length
			? [{ title: SORT_LABELS[sort], netMinor: null, data: [...rows] }]
			: [];
	const sections: DaySection[] = [];
	for (const row of rows) {
		const day = localDateOf(row.occurredAt);
		const title = formatDayHeading(day);
		let section = sections[sections.length - 1];
		if (!section || section.title !== title) {
			section = { title, netMinor: 0, data: [] };
			sections.push(section);
		}
		section.data.push(row);
		section.netMinor = addMinor(
			section.netMinor ?? 0,
			row.type === 'income' ? row.amountMinor : -row.amountMinor,
		);
	}
	return sections;
}
