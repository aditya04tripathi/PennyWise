import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import type { Category } from '@/domain/entities';
import { useTheme } from '@/theme/use-theme';

export function CategoryBadge({
	category,
	size = 36,
}: {
	category: Category | undefined;
	size?: number;
}) {
	const theme = useTheme();
	const color = category?.color ?? theme.colors.textTertiary;
	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: size * 0.32,
				borderCurve: 'continuous',
				backgroundColor: `${color}22`,
				alignItems: 'center',
				justifyContent: 'center',
			}}>
			<Icon
				name={category?.icon ?? 'tag'}
				size={size * 0.48}
				color={theme.dark ? lightenForDark(color) : color}
			/>
		</View>
	);
}

function lightenForDark(hex: string): string {
	const value = Number.parseInt(hex.slice(1, 7), 16);
	if (Number.isNaN(value)) return hex;
	const channel = (shift: number) =>
		Math.round(
			((value >> shift) & 0xff) +
				(255 - ((value >> shift) & 0xff)) * 0.45,
		);
	return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, '0')).join('')}`;
}
