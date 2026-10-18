import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import type { GoalProgress } from '@/features/goals/goal-service';
import { useMoneyFormatter } from '@/hooks/use-app-data';
import { formatShortDate } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

export function GoalCard({ progress }: { progress: GoalProgress }) {
	const theme = useTheme();
	const formatAmount = useMoneyFormatter();
	const { goal, savedMinor } = progress;
	const percent = Math.max(
		0,
		Math.min(100, Math.floor((savedMinor * 100) / goal.targetMinor)),
	);
	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={`${goal.name}, ${percent} percent saved`}
			accessibilityHint='Open goal'
			onPress={() =>
				router.push({
					pathname: '/goals/edit',
					params: { id: goal.id },
				})
			}>
			<Surface style={{ gap: theme.spacing.xs }}>
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
					}}>
					<AppText variant='heading3'>{goal.name}</AppText>
					<AppText variant='bodySmall' tone='textSecondary' numeric>
						{percent}%
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
							width: `${percent}%`,
							height: '100%',
							borderRadius: 4,
							backgroundColor: goal.color,
						}}
					/>
				</View>
				<AppText variant='bodySmall' tone='textSecondary' numeric>
					{formatAmount(savedMinor)} of{' '}
					{formatAmount(goal.targetMinor)}
					{goal.targetDate
						? ` · by ${formatShortDate(goal.targetDate)}`
						: ''}
				</AppText>
			</Surface>
		</Pressable>
	);
}
