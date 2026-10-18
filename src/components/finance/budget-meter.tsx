import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import type { BudgetStatus } from '@/domain/calculations/budget';
import type { MoneyFormatter } from '@/hooks/use-app-data';
import { useTheme } from '@/theme/use-theme';

export function BudgetMeter({
	status,
	formatAmount,
	label = 'Monthly budget',
}: {
	status: BudgetStatus;
	formatAmount: MoneyFormatter;
	label?: string;
}) {
	const theme = useTheme();
	if (
		status.state === 'unset' ||
		status.budgetMinor === null ||
		status.remainingMinor === null ||
		status.usedBasisPoints === null
	)
		return null;
	const fill = Math.min(10_000, status.usedBasisPoints) / 100;
	const tone =
		status.state === 'exceeded'
			? theme.colors.negative
			: status.state === 'approaching'
				? theme.colors.warning
				: theme.colors.brandPrimary;
	const usedPercent = Math.floor(status.usedBasisPoints / 100);
	const remainingLabel =
		status.remainingMinor >= 0
			? `${formatAmount(status.remainingMinor)} left`
			: `${formatAmount(-status.remainingMinor)} over budget`;

	return (
		<View
			style={{ gap: theme.spacing.xs }}
			accessible
			accessibilityRole='progressbar'
			accessibilityLabel={`${label}, ${usedPercent} percent used, ${remainingLabel}`}
			accessibilityValue={{
				min: 0,
				max: 100,
				now: Math.min(100, usedPercent),
			}}>
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
				}}>
				<AppText variant='bodySmall' tone='textSecondary' numeric>
					{formatAmount(status.spentMinor)} of{' '}
					{formatAmount(status.budgetMinor)}
				</AppText>
				<AppText
					variant='bodySmall'
					numeric
					style={{ color: tone, fontWeight: '600' }}>
					{remainingLabel}
				</AppText>
			</View>
			<View
				style={{
					height: 8,
					borderRadius: 4,
					backgroundColor: theme.colors.surfaceElevated,
					overflow: 'hidden',
				}}>
				<View
					style={{
						width: `${fill}%`,
						height: '100%',
						borderRadius: 4,
						backgroundColor: tone,
					}}
				/>
			</View>
		</View>
	);
}
