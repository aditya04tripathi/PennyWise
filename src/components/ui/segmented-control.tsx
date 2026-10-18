import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

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
			accessibilityRole='radiogroup'
			accessibilityLabel={accessibilityLabel}
			style={{
				flexDirection: 'row',
				backgroundColor: theme.colors.surfaceElevated,
				borderRadius: theme.radii.md,
				borderCurve: 'continuous',
				padding: 3,
				gap: 3,
			}}>
			{options.map((option) => {
				const selected = option.value === value;
				return (
					<Pressable
						key={option.value}
						accessibilityRole='radio'
						accessibilityState={{ selected }}
						accessibilityLabel={option.label}
						onPress={() => onChange(option.value)}
						style={{
							flex: 1,
							minHeight: 38,
							borderRadius: theme.radii.sm + 2,
							borderCurve: 'continuous',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: selected
								? theme.colors.surface
								: 'transparent',
							borderWidth: selected ? 1 : 0,
							borderColor: theme.colors.border,
						}}>
						<AppText
							variant='label'
							tone={selected ? 'textPrimary' : 'textSecondary'}>
							{option.label}
						</AppText>
					</Pressable>
				);
			})}
		</View>
	);
}
