import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import {
	localDateOf,
	parseLocalDateTime,
	toLocalDateTime,
	type LocalDateTime,
} from '@/domain/dates';
import { formatFullDay, formatTime } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

export function DateTimeField({
	label,
	value,
	onChange,
	mode = 'datetime',
}: {
	label: string;
	value: LocalDateTime;
	onChange: (value: LocalDateTime) => void;
	mode?: 'date' | 'datetime';
}) {
	const theme = useTheme();
	const date = parseLocalDateTime(value);
	const [androidPicker, setAndroidPicker] = useState<'date' | 'time' | null>(
		null,
	);

	const apply = (part: 'date' | 'time', next: Date) => {
		if (part === 'date') {
			const merged = new Date(next);
			merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
			onChange(toLocalDateTime(merged));
			return;
		}
		const merged = new Date(date);
		merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
		onChange(toLocalDateTime(merged));
	};

	return (
		<View>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: theme.spacing.sm,
					minHeight: theme.layout.rowHeight,
					paddingHorizontal: theme.spacing.md,
				}}>
				<AppText variant='body'>{label}</AppText>
				<Button
					label={formatFullDay(localDateOf(value))}
					variant='secondary'
					compact
					onPress={() => setAndroidPicker('date')}
					accessibilityHint='Change the date'
				/>
			</View>
			{mode === 'datetime' ? (
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: theme.spacing.sm,
						minHeight: theme.layout.rowHeight,
						paddingHorizontal: theme.spacing.md,
					}}>
					<AppText variant='body'>Time</AppText>
					<Button
						label={formatTime(value)}
						variant='secondary'
						compact
						onPress={() => setAndroidPicker('time')}
						accessibilityHint='Change the time'
					/>
				</View>
			) : null}
			{androidPicker ? (
				<DateTimePicker
					value={date}
					mode={androidPicker}
					accentColor={theme.colors.brandPrimary}
					onDismiss={() => setAndroidPicker(null)}
					onValueChange={(_event, next) => {
						const part = androidPicker;
						setAndroidPicker(null);
						apply(part, next);
					}}
				/>
			) : null}
		</View>
	);
}
