import type { ReactNode } from 'react';

import { useTheme } from '@/theme/use-theme';

import { PressableScale } from './pressable-scale';
import { selectionHaptic } from './selection-haptic';
import { AppText } from './text';

export function Chip({
	label,
	selected,
	onPress,
	leading,
}: {
	label: string;
	selected: boolean;
	onPress: () => void;
	leading?: ReactNode;
}) {
	const theme = useTheme();
	return (
		<PressableScale
			accessibilityRole='radio'
			accessibilityState={{ selected }}
			accessibilityLabel={label}
			hitSlop={4}
			onPress={() => {
				selectionHaptic();
				onPress();
			}}
			contentStyle={{
				flexDirection: 'row',
				alignItems: 'center',
				gap: 6,
				minHeight: 36,
				paddingHorizontal: theme.spacing.sm,
				borderRadius: theme.radii.pill,
				borderWidth: 1,
				borderColor: selected
					? theme.colors.brandPrimary
					: theme.colors.border,
				backgroundColor: selected
					? theme.colors.brandSoft
					: theme.colors.surface,
			}}>
			{leading}
			<AppText
				variant='bodySmall'
				style={{
					color: selected
						? theme.colors.brandPrimary
						: theme.colors.textPrimary,
					fontWeight: selected ? '600' : '400',
				}}>
				{label}
			</AppText>
		</PressableScale>
	);
}
