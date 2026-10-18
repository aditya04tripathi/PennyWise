import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import type { DailyNet } from '@/domain/calculations/trends';
import { sumMinor } from '@/domain/money/money';
import type { MoneyFormatter } from '@/hooks/use-app-data';
import { formatShortDate } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

const CHART_HEIGHT = 120;

export function NetTrend({
	series,
	formatAmount,
}: {
	series: readonly DailyNet[];
	formatAmount: MoneyFormatter;
}) {
	const theme = useTheme();
	const peak = Math.max(1, ...series.map((day) => Math.abs(day.netMinor)));
	const positives = series.filter((day) => day.netMinor > 0).length;
	const negatives = series.filter((day) => day.netMinor < 0).length;
	const net = sumMinor(series.map((day) => day.netMinor));
	const first = series[0];
	const last = series[series.length - 1];
	const summary = `Net ${formatAmount(net, { signDisplay: 'exceptZero' })} over ${series.length} days. ${positives} days with net income, ${negatives} days with net spending.`;

	return (
		<View style={{ gap: theme.spacing.xs }}>
			<View
				accessible
				accessibilityRole='image'
				accessibilityLabel={summary}
				style={{
					height: CHART_HEIGHT,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 2,
				}}>
				{series.map((day) => {
					const height =
						(Math.abs(day.netMinor) / peak) *
						(CHART_HEIGHT / 2 - 2);
					return (
						<View
							key={day.date}
							style={{
								flex: 1,
								height: CHART_HEIGHT,
								justifyContent: 'center',
							}}>
							<View
								style={{
									height: CHART_HEIGHT / 2,
									justifyContent: 'flex-end',
								}}>
								{day.netMinor > 0 ? (
									<View
										style={{
											height,
											borderRadius: 2,
											backgroundColor:
												theme.colors.positive,
										}}
									/>
								) : null}
							</View>
							<View
								style={{
									height: 1,
									backgroundColor: theme.colors.border,
								}}
							/>
							<View style={{ height: CHART_HEIGHT / 2 - 1 }}>
								{day.netMinor < 0 ? (
									<View
										style={{
											height,
											borderRadius: 2,
											backgroundColor:
												theme.colors.negative,
										}}
									/>
								) : null}
							</View>
						</View>
					);
				})}
			</View>
			{first && last ? (
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
					}}
					importantForAccessibility='no-hide-descendants'>
					<AppText variant='caption' tone='textTertiary'>
						{formatShortDate(first.date)}
					</AppText>
					<AppText variant='caption' tone='textTertiary'>
						{formatShortDate(last.date)}
					</AppText>
				</View>
			) : null}
			<AppText variant='bodySmall' tone='textSecondary'>
				{summary}
			</AppText>
		</View>
	);
}
