import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '@/theme/use-theme';

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
		<Pressable
			accessibilityRole='radio'
			accessibilityState={{ selected }}
			accessibilityLabel={label}
			onPress={onPress}
			style={{
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
		</Pressable>
	);
}
