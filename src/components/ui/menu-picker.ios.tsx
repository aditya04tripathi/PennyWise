import { Host } from '@expo/ui';
import { Menu, Toggle } from '@expo/ui/swift-ui';
import {
	buttonBorderShape,
	buttonStyle,
	controlSize,
	frame,
	lineLimit,
	menuIndicator,
	menuStyle,
} from '@expo/ui/swift-ui/modifiers';
import { View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { selectionHaptic } from './selection-haptic';
import { AppText } from './text';

export function MenuPicker<T extends string | number>({
	label,
	value,
	onChange,
	options,
}: {
	label: string;
	value: T;
	onChange: (value: T) => void;
	options: readonly { value: T; label: string }[];
}) {
	const theme = useTheme();
	const selected =
		options.find((option) => option.value === value)?.label ?? '';

	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: theme.spacing.sm,
				minHeight: theme.layout.rowHeight,
				paddingHorizontal: theme.spacing.md,
				paddingVertical: theme.spacing.xxs,
			}}>
			<AppText variant='body' style={{ flexShrink: 0 }}>
				{label}
			</AppText>
			<Host
				matchContents
				colorScheme={theme.dark ? 'dark' : 'light'}
				ignoreSafeArea='all'>
				<Menu
					label={selected}
					modifiers={[
						menuStyle('button'),
						buttonStyle('bordered'),
						buttonBorderShape('roundedRectangle', 8),
						menuIndicator('visible'),
						controlSize('small'),
						lineLimit(1),
						frame({ maxWidth: 220, alignment: 'trailing' }),
					]}>
					{options.map((option) => (
						<Toggle
							key={String(option.value)}
							label={option.label}
							isOn={option.value === value}
							onIsOnChange={() => {
								if (option.value === value) return;
								selectionHaptic();
								onChange(option.value);
							}}
						/>
					))}
				</Menu>
			</Host>
		</View>
	);
}
