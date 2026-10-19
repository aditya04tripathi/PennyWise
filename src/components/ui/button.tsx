import { ActivityIndicator, View, type PressableProps } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';
import { AppText } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export interface ButtonProps extends Omit<
	PressableProps,
	'children' | 'style'
> {
	label: string;
	variant?: ButtonVariant;
	icon?: IconName;
	loading?: boolean;
	fullWidth?: boolean;
	compact?: boolean;
}

export function Button({
	label,
	variant = 'primary',
	icon,
	loading,
	disabled,
	fullWidth,
	compact,
	onPress,
	...rest
}: ButtonProps) {
	const theme = useTheme();
	const { colors } = theme;
	const inactive = disabled || loading;
	const minTarget = theme.layout.minTouchTarget;
	const visualHeight = compact ? 36 : minTarget + 4;
	const touchSlack = Math.max(0, Math.ceil((minTarget - visualHeight) / 2));
	const palette = {
		primary: {
			background: colors.brandPrimary,
			text: colors.textOnBrand,
			border: colors.brandPrimary,
		},
		secondary: {
			background: colors.surface,
			text: colors.textPrimary,
			border: colors.border,
		},
		destructive: {
			background: colors.negativeSoft,
			text: colors.negative,
			border: colors.negativeSoft,
		},
		ghost: {
			background: 'transparent',
			text: colors.brandPrimary,
			border: 'transparent',
		},
	}[variant];

	return (
		<PressableScale
			accessibilityRole='button'
			accessibilityLabel={label}
			accessibilityState={{ disabled: !!inactive, busy: !!loading }}
			disabled={inactive}
			hitSlop={touchSlack}
			onPress={onPress}
			style={{ alignSelf: fullWidth ? 'stretch' : 'flex-start' }}
			contentStyle={{
				minHeight: visualHeight,
				paddingHorizontal: compact
					? theme.spacing.sm
					: theme.spacing.lg,
				borderRadius: theme.radii.md,
				borderCurve: 'continuous',
				borderWidth: 1,
				borderColor: palette.border,
				backgroundColor: palette.background,
				opacity: inactive ? 0.5 : 1,
				alignItems: 'center',
				justifyContent: 'center',
			}}
			{...rest}>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: theme.spacing.xs,
				}}>
				{loading ? (
					<ActivityIndicator color={palette.text} />
				) : icon ? (
					<Icon name={icon} size={17} color={palette.text} />
				) : null}
				<AppText
					variant='label'
					style={{
						color: palette.text,
						fontSize: compact ? 13 : 15,
					}}>
					{label}
				</AppText>
			</View>
		</PressableScale>
	);
}
