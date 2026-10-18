import { router } from 'expo-router';
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBadge } from '@/components/finance/category-badge';
import { TransactionRow } from '@/components/finance/transaction-row';
import { showMessage, userFacingError } from '@/components/feedback/confirm';
import {
	EmptyState,
	ErrorState,
	LoadingState,
} from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Chip } from '@/components/ui/chip';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import {
	queryTransactions,
	type TransactionQuery,
} from '@/data/repositories/transaction-repository';
import { localDateOf, toLocalDateTime } from '@/domain/dates';
import type { Transaction, TransactionType } from '@/domain/entities';
import { addMinor } from '@/domain/money/money';
import { exportTransactionsCsv } from '@/features/backup/backup-service';
import {
	useAccounts,
	useCards,
	useCategories,
	useMoneyFormatter,
} from '@/hooks/use-app-data';
import { useLedgerQuery } from '@/hooks/use-ledger-query';
import { formatDayHeading } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

const PAGE_SIZE = 50;
type TypeFilter = 'all' | TransactionType;
type Sort = NonNullable<TransactionQuery['sort']>;

const SORT_LABELS: Record<Sort, string> = {
	'date-desc': 'Newest first',
	'date-asc': 'Oldest first',
	'amount-desc': 'Largest amount',
	'amount-asc': 'Smallest amount',
};

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
	const formatAmount = useMoneyFormatter();
	const { categories, byId: categoryById } = useCategories(true);
	const { cards } = useCards();
	const { accounts } = useAccounts();
	const [search, setSearch] = useState('');
	const [type, setType] = useState<TypeFilter>('all');
	const [categoryId, setCategoryId] = useState<string | null>(null);
	const [cardId, setCardId] = useState<string | null>(null);
	const [accountId, setAccountId] = useState<string | null>(null);
	const [hasReceipt, setHasReceipt] = useState<boolean | null>(null);
	const [sort, setSort] = useState<Sort>('date-desc');
	const [paging, setPaging] = useState({ key: '', pages: 1 });
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [exporting, setExporting] = useState(false);
	const debouncedSearch = useDebounced(search, 250);

	const filters = useMemo<Omit<TransactionQuery, 'limit' | 'offset'>>(
		() => ({
			search: debouncedSearch,
			type: type === 'all' ? null : type,
			categoryId,
			cardId,
			accountId,
			hasReceipt,
			sort,
		}),
		[
			debouncedSearch,
			type,
			categoryId,
			cardId,
			accountId,
			hasReceipt,
			sort,
		],
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
		() => groupByDay(result.data?.rows ?? [], sort),
		[result.data, sort],
	);
	const now = toLocalDateTime(new Date());
	const activeFilters =
		[categoryId, cardId, accountId, hasReceipt].filter(
			(value) => value !== null,
		).length + (sort === 'date-desc' ? 0 : 1);
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
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<SectionList
				sections={sections}
				keyExtractor={(item) => item.id}
				stickySectionHeadersEnabled={false}
				keyboardDismissMode='on-drag'
				keyboardShouldPersistTaps='handled'
				contentContainerStyle={{
					paddingTop: insets.top + theme.spacing.sm,
					paddingBottom: theme.spacing.huge + insets.bottom,
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
							<Pressable
								accessibilityRole='button'
								accessibilityLabel='Add transaction'
								onPress={() => router.push('/transaction/edit')}
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
								onPress={() => setFiltersOpen(true)}
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
							actionLabel='Add transaction'
							onAction={() => router.push('/transaction/edit')}
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

			<Sheet
				visible={filtersOpen}
				title='Filters'
				onClose={() => setFiltersOpen(false)}
				footer={
					<>
						<Button
							label='Show results'
							onPress={() => setFiltersOpen(false)}
							fullWidth
						/>
						<Button
							label='Clear filters'
							variant='ghost'
							onPress={() => {
								setCategoryId(null);
								setCardId(null);
								setAccountId(null);
								setHasReceipt(null);
								setSort('date-desc');
							}}
						/>
					</>
				}>
				<FilterGroup title='Sort'>
					{(Object.keys(SORT_LABELS) as Sort[]).map((option) => (
						<Chip
							key={option}
							label={SORT_LABELS[option]}
							selected={sort === option}
							onPress={() => setSort(option)}
						/>
					))}
				</FilterGroup>
				<FilterGroup title='Category'>
					<Chip
						label='Any'
						selected={categoryId === null}
						onPress={() => setCategoryId(null)}
					/>
					{categories.map((category) => (
						<Chip
							key={category.id}
							label={
								category.archivedAt
									? `${category.name} (archived)`
									: category.name
							}
							selected={categoryId === category.id}
							onPress={() => setCategoryId(category.id)}
							leading={
								<CategoryBadge category={category} size={20} />
							}
						/>
					))}
				</FilterGroup>
				{accounts.length > 1 ? (
					<FilterGroup title='Account'>
						<Chip
							label='Any'
							selected={accountId === null}
							onPress={() => setAccountId(null)}
						/>
						{accounts.map(({ account }) => (
							<Chip
								key={account.id}
								label={account.name}
								selected={accountId === account.id}
								onPress={() => setAccountId(account.id)}
							/>
						))}
					</FilterGroup>
				) : null}
				{cards.length > 0 ? (
					<FilterGroup title='Card'>
						<Chip
							label='Any'
							selected={cardId === null}
							onPress={() => setCardId(null)}
						/>
						{cards.map((card) => (
							<Chip
								key={card.id}
								label={`${card.bankName} ·${card.lastFour}`}
								selected={cardId === card.id}
								onPress={() => setCardId(card.id)}
							/>
						))}
					</FilterGroup>
				) : null}
				<FilterGroup title='Receipt'>
					<Chip
						label='Any'
						selected={hasReceipt === null}
						onPress={() => setHasReceipt(null)}
					/>
					<Chip
						label='With receipt'
						selected={hasReceipt === true}
						onPress={() => setHasReceipt(true)}
					/>
					<Chip
						label='Without receipt'
						selected={hasReceipt === false}
						onPress={() => setHasReceipt(false)}
					/>
				</FilterGroup>
			</Sheet>
		</View>
	);
}

interface DaySection {
	title: string;
	netMinor: number | null;
	data: Transaction[];
}

function groupByDay(rows: readonly Transaction[], sort: Sort): DaySection[] {
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

function FilterGroup({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	const theme = useTheme();
	return (
		<View style={{ gap: theme.spacing.xs }}>
			<AppText variant='label' tone='textSecondary'>
				{title}
			</AppText>
			<View
				style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					gap: theme.spacing.xs,
				}}>
				{children}
			</View>
		</View>
	);
}
