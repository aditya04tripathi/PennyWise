import DateTimePicker, {
	DateTimePickerAndroid,
	type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { formatFullDay, formatTime } from '@/lib/format-date';
import {
	localDateOf,
	parseLocalDateTime,
	toLocalDateTime,
	type LocalDateTime,
} from '@/domain/dates';
import { useTheme } from '@/theme/use-theme';

export function DateTimeField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: LocalDateTime;
	onChange: (value: LocalDateTime) => void;
}) {
	const theme = useTheme();
	const date = parseLocalDateTime(value);

	if (process.env.EXPO_OS === 'ios') {
		return (
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					minHeight: theme.layout.minTouchTarget,
				}}>
				<AppText variant='label' tone='textSecondary'>
					{label}
				</AppText>
				<DateTimePicker
					value={date}
					mode='datetime'
					display='compact'
					accentColor={theme.colors.brandPrimary}
					themeVariant={theme.dark ? 'dark' : 'light'}
					accessibilityLabel={label}
					onChange={(_event: DateTimePickerEvent, next?: Date) =>
						next && onChange(toLocalDateTime(next))
					}
				/>
			</View>
		);
	}

	const openDate = () =>
		DateTimePickerAndroid.open({
			value: date,
			mode: 'date',
			onChange: (event, next) => {
				if (event.type !== 'set' || !next) return;
				const merged = new Date(next);
				merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
				onChange(toLocalDateTime(merged));
			},
		});
	const openTime = () =>
		DateTimePickerAndroid.open({
			value: date,
			mode: 'time',
			onChange: (event, next) => {
				if (event.type !== 'set' || !next) return;
				const merged = new Date(date);
				merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
				onChange(toLocalDateTime(merged));
			},
		});

	return (
		<View style={{ gap: theme.spacing.xxs }}>
			<AppText variant='label' tone='textSecondary'>
				{label}
			</AppText>
			<View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
				<Button
					label={formatFullDay(localDateOf(value))}
					variant='secondary'
					compact
					onPress={openDate}
					accessibilityHint='Change the date'
				/>
				<Button
					label={formatTime(value)}
					variant='secondary'
					compact
					onPress={openTime}
					accessibilityHint='Change the time'
				/>
			</View>
		</View>
	);
}
