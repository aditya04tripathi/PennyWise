import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { selectionHaptic } from './selection-haptic';
import { AppText } from './text';

export interface SegmentedOption<T extends string> {
	value: T;
	label: string;
}

export function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	accessibilityLabel,
}: {
	options: readonly SegmentedOption<T>[];
	value: T;
	onChange: (value: T) => void;
	accessibilityLabel: string;
}) {
	const theme = useTheme();
	return (
		<View
			accessibilityRole='tablist'
			accessibilityLabel={accessibilityLabel}
			style={{
				flexDirection: 'row',
				alignItems: 'stretch',
				backgroundColor: theme.colors.surfaceElevated,
				borderRadius: theme.radii.md,
				borderCurve: 'continuous',
				padding: 2,
				minHeight: theme.layout.minTouchTarget,
			}}>
			{options.map((option) => {
				const selected = option.value === value;
				const segmentHeight = theme.layout.minTouchTarget - 4;
				const hitSlop = Math.max(
					0,
					Math.ceil(
						(theme.layout.minTouchTarget - segmentHeight) / 2,
					),
				);
				return (
					<Pressable
						key={option.value}
						accessibilityRole='tab'
						accessibilityLabel={option.label}
						accessibilityState={{ selected }}
						hitSlop={hitSlop}
						onPress={() => {
							if (selected) return;
							selectionHaptic();
							onChange(option.value);
						}}
						style={({ pressed }) => ({
							flex: 1,
							minHeight: segmentHeight,
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: theme.radii.sm,
							borderCurve: 'continuous',
							paddingHorizontal: theme.spacing.xs,
							backgroundColor: selected
								? theme.colors.surface
								: pressed
									? theme.colors.border
									: 'transparent',
						})}>
						<AppText
							variant='label'
							tone={selected ? 'textPrimary' : 'textSecondary'}
							numberOfLines={1}>
							{option.label}
						</AppText>
					</Pressable>
				);
			})}
		</View>
	);
}
