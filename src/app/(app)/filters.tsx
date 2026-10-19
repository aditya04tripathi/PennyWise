import { Button } from '@/components/ui/button';
import { MenuPicker } from '@/components/ui/menu-picker';
import { Screen } from '@/components/ui/screen';
import { Divider, Surface } from '@/components/ui/surface';
import {
	activityFilterCount,
	clearActivityFilters,
	SORT_LABELS,
	updateActivityFilters,
	useActivityFilters,
	type ActivitySort,
	type ReceiptFilter,
} from '@/features/activity/activity-filters';
import { useAccounts, useCards, useCategories } from '@/hooks/use-app-data';

const SORTS = Object.keys(SORT_LABELS) as ActivitySort[];
const RECEIPTS: { value: ReceiptFilter; label: string }[] = [
	{ value: 'any', label: 'Any' },
	{ value: 'with', label: 'With receipt' },
	{ value: 'without', label: 'Without receipt' },
];

export default function FiltersScreen() {
	const filters = useActivityFilters();
	const { categories } = useCategories(true);
	const { accounts } = useAccounts();
	const { cards } = useCards();
	const active = activityFilterCount(filters) > 0;

	return (
		<Screen>
			<Surface padded={false}>
				<MenuPicker
					label='Sort'
					value={filters.sort}
					onChange={(sort) => updateActivityFilters({ sort })}
					options={SORTS.map((value) => ({
						value,
						label: SORT_LABELS[value],
					}))}
				/>
				<Divider inset={16} />
				<MenuPicker
					label='Category'
					value={filters.categoryId}
					onChange={(categoryId) =>
						updateActivityFilters({ categoryId })
					}
					options={[
						{ value: '', label: 'Any' },
						...categories.map((category) => ({
							value: category.id,
							label: category.archivedAt
								? `${category.name} (archived)`
								: category.name,
						})),
					]}
				/>
				{accounts.length > 1 ? (
					<>
						<Divider inset={16} />
						<MenuPicker
							label='Account'
							value={filters.accountId}
							onChange={(accountId) =>
								updateActivityFilters({ accountId })
							}
							options={[
								{ value: '', label: 'Any' },
								...accounts.map(({ account }) => ({
									value: account.id,
									label: account.name,
								})),
							]}
						/>
					</>
				) : null}
				{cards.length > 0 ? (
					<>
						<Divider inset={16} />
						<MenuPicker
							label='Card'
							value={filters.cardId}
							onChange={(cardId) =>
								updateActivityFilters({ cardId })
							}
							options={[
								{ value: '', label: 'Any' },
								...cards.map((card) => ({
									value: card.id,
									label: `${card.bankName} · ${card.lastFour}`,
								})),
							]}
						/>
					</>
				) : null}
				<Divider inset={16} />
				<MenuPicker
					label='Receipt'
					value={filters.receipt}
					onChange={(receipt) => updateActivityFilters({ receipt })}
					options={RECEIPTS}
				/>
			</Surface>
			{active ? (
				<Button
					label='Clear filters'
					variant='ghost'
					onPress={clearActivityFilters}
				/>
			) : null}
		</Screen>
	);
}
