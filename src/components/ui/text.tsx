import {
	Text as NativeText,
	type TextProps as NativeTextProps,
} from 'react-native';

import type { ColorTokens, TypographyVariant } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export interface AppTextProps extends NativeTextProps {
	variant?: TypographyVariant;
	tone?: keyof Pick<
		ColorTokens,
		| 'textPrimary'
		| 'textSecondary'
		| 'textTertiary'
		| 'brandPrimary'
		| 'positive'
		| 'negative'
		| 'warning'
		| 'textOnBrand'
	>;
	numeric?: boolean;
	align?: 'left' | 'center' | 'right';
}

export function AppText({
	variant = 'body',
	tone = 'textPrimary',
	numeric,
	align,
	style,
	...rest
}: AppTextProps) {
	const theme = useTheme();
	return (
		<NativeText
			maxFontSizeMultiplier={variant.startsWith('display') ? 1.6 : 2.2}
			style={[
				theme.typography[variant],
				{ color: theme.colors[tone], textAlign: align },
				numeric && { fontVariant: ['tabular-nums'] },
				style,
			]}
			{...rest}
		/>
	);
}
