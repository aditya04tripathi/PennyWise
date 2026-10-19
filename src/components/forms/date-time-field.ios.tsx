import { Host } from '@expo/ui';
import { DatePicker } from '@expo/ui/swift-ui';
import {
	controlSize,
	datePickerStyle,
	fixedSize,
	labelsHidden,
} from '@expo/ui/swift-ui/modifiers';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import {
	parseLocalDateTime,
	toLocalDateTime,
	type LocalDateTime,
} from '@/domain/dates';
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

	const changeDate = (next: Date) => {
		const merged = new Date(next);
		merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
		onChange(toLocalDateTime(merged));
	};
	const changeTime = (next: Date) => {
		const merged = new Date(date);
		merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
		onChange(toLocalDateTime(merged));
	};

	return (
		<View>
			<PickerRow label={label}>
				<CompactPicker
					date={date}
					components={['date']}
					colorScheme={theme.dark ? 'dark' : 'light'}
					onChange={changeDate}
				/>
			</PickerRow>
			{mode === 'datetime' ? (
				<>
					<View
						style={{
							height: 1,
							marginLeft: theme.spacing.md,
							backgroundColor: theme.colors.divider,
						}}
					/>
					<PickerRow label='Time'>
						<CompactPicker
							date={date}
							components={['hourAndMinute']}
							colorScheme={theme.dark ? 'dark' : 'light'}
							onChange={changeTime}
						/>
					</PickerRow>
				</>
			) : null}
		</View>
	);
}

function CompactPicker({
	date,
	components,
	colorScheme,
	onChange,
}: {
	date: Date;
	components: ('date' | 'hourAndMinute')[];
	colorScheme: 'light' | 'dark';
	onChange: (date: Date) => void;
}) {
	return (
		<Host
			matchContents
			colorScheme={colorScheme}
			ignoreSafeArea='all'
			style={{ marginVertical: -8 }}>
			<DatePicker
				selection={date}
				displayedComponents={components}
				onDateChange={onChange}
				modifiers={[
					datePickerStyle('compact'),
					controlSize('small'),
					labelsHidden(),
					fixedSize({ horizontal: true, vertical: true }),
				]}
			/>
		</Host>
	);
}

function PickerRow({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	const theme = useTheme();
	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: theme.spacing.sm,
				height: theme.layout.rowHeight,
				paddingHorizontal: theme.spacing.md,
			}}>
			<AppText variant='body' style={{ flexShrink: 0 }}>
				{label}
			</AppText>
			<View style={{ flexShrink: 1, alignItems: 'flex-end' }}>
				{children}
			</View>
		</View>
	);
}
