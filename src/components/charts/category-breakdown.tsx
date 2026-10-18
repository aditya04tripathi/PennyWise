import { View } from 'react-native';

import { CategoryBadge } from '@/components/finance/category-badge';
import { AppText } from '@/components/ui/text';
import type { CategoryTotal } from '@/domain/calculations/ledger';
import type { Category } from '@/domain/entities';
import { percentageOf, sumMinor } from '@/domain/money/money';
import type { MoneyFormatter } from '@/hooks/use-app-data';
import { useTheme } from '@/theme/use-theme';

export function CategoryBreakdown({
	totals,
	categories,
	formatAmount,
}: {
	totals: readonly CategoryTotal[];
	categories: ReadonlyMap<string, Category>;
	formatAmount: MoneyFormatter;
}) {
	const theme = useTheme();
	const total = sumMinor(totals.map((item) => item.totalMinor));
	const largest = totals[0]?.totalMinor ?? 0;
	return (
		<View style={{ gap: theme.spacing.sm }}>
			{totals.map((item) => {
				const category = categories.get(item.categoryId);
				const share = percentageOf(item.totalMinor, total);
				const width =
					largest > 0
						? Math.max(2, (item.totalMinor / largest) * 100)
						: 0;
				return (
					<View
						key={item.categoryId}
						accessible
						accessibilityLabel={`${category?.name ?? 'Unknown'}, ${formatAmount(item.totalMinor)}, ${share} percent of spending`}
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: theme.spacing.sm,
						}}>
						<CategoryBadge category={category} size={30} />
						<View style={{ flex: 1, gap: 4 }}>
							<View
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
									gap: theme.spacing.xs,
								}}>
								<AppText
									variant='bodySmall'
									numberOfLines={1}
									style={{
										flexShrink: 1,
										fontWeight: '500',
									}}>
									{category?.name ?? 'Unknown'}
								</AppText>
								<AppText
									variant='bodySmall'
									numeric
									tone='textSecondary'>
									{formatAmount(item.totalMinor)} · {share}%
								</AppText>
							</View>
							<View
								style={{
									height: 6,
									borderRadius: 3,
									backgroundColor:
										theme.colors.surfaceElevated,
								}}>
								<View
									style={{
										width: `${width}%`,
										height: '100%',
										borderRadius: 3,
										backgroundColor:
											category?.color ??
											theme.colors.textTertiary,
									}}
								/>
							</View>
						</View>
					</View>
				);
			})}
		</View>
	);
}
