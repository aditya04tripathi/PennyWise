import * as Haptics from 'expo-haptics';
import {
	ActivityIndicator,
	Pressable,
	View,
	type PressableProps,
} from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { Icon, type IconName } from './icon';
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
	const palette = {
		primary: {
			background: colors.brandPrimary,
			pressed: colors.brandPressed,
			text: colors.textOnBrand,
			border: colors.brandPrimary,
		},
		secondary: {
			background: colors.surface,
			pressed: colors.surfaceElevated,
			text: colors.textPrimary,
			border: colors.border,
		},
		destructive: {
			background: colors.negativeSoft,
			pressed: colors.negativeSoft,
			text: colors.negative,
			border: colors.negativeSoft,
		},
		ghost: {
			background: 'transparent',
			pressed: colors.surfaceElevated,
			text: colors.brandPrimary,
			border: 'transparent',
		},
	}[variant];

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={label}
			accessibilityState={{ disabled: !!inactive, busy: !!loading }}
			disabled={inactive}
			onPress={(event) => {
				if (process.env.EXPO_OS === 'ios')
					Haptics.selectionAsync().catch(() => undefined);
				onPress?.(event);
			}}
			style={({ pressed }) => ({
				minHeight: compact ? 36 : theme.layout.minTouchTarget + 4,
				paddingHorizontal: compact
					? theme.spacing.sm
					: theme.spacing.lg,
				borderRadius: theme.radii.md,
				borderCurve: 'continuous',
				borderWidth: 1,
				borderColor: palette.border,
				backgroundColor: pressed ? palette.pressed : palette.background,
				opacity: inactive ? 0.5 : 1,
				alignSelf: fullWidth ? 'stretch' : 'auto',
				alignItems: 'center',
				justifyContent: 'center',
			})}
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
		</Pressable>
	);
}
