import { layout } from '@/theme/tokens';

import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

export function IconButton({
	label,
	icon,
	onPress,
	disabled,
	backgroundColor = 'transparent',
	color,
	iconSize = 18,
}: {
	label: string;
	icon: IconName;
	onPress: () => void;
	disabled?: boolean;
	backgroundColor?: string;
	color: string;
	iconSize?: number;
}) {
	return (
		<PressableScale
			accessibilityRole='button'
			accessibilityLabel={label}
			accessibilityState={{ disabled: !!disabled }}
			disabled={disabled}
			onPress={onPress}
			contentStyle={{
				width: layout.minTouchTarget,
				height: layout.minTouchTarget,
				borderRadius: layout.minTouchTarget / 2,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor,
				opacity: disabled ? 0.35 : 1,
			}}>
			<Icon name={icon} size={iconSize} color={color} />
		</PressableScale>
	);
}
