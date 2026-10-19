import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { AppText } from './text';

export interface TextFieldProps extends TextInputProps {
	label: string;
	error?: string;
	hint?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
	function TextField({ label, error, hint, style, ...rest }, ref) {
		const theme = useTheme();
		return (
			<View style={{ gap: theme.spacing.xxs }}>
				<AppText variant='label' tone='textSecondary'>
					{label}
				</AppText>
				<TextInput
					ref={ref}
					accessibilityLabel={label}
					accessibilityHint={error ?? hint}
					placeholderTextColor={theme.colors.textTertiary}
					style={[
						theme.typography.bodyLarge,
						{
							color: theme.colors.textPrimary,
							backgroundColor: theme.colors.surface,
							borderWidth: 1,
							borderColor: error
								? theme.colors.negative
								: theme.colors.border,
							borderRadius: theme.radii.md,
							borderCurve: 'continuous',
							paddingHorizontal: theme.spacing.md,
							paddingVertical: theme.spacing.sm,
							minHeight: theme.layout.minTouchTarget + 4,
						},
						style,
					]}
					{...rest}
				/>
				{error ? (
					<AppText
						variant='bodySmall'
						tone='negative'
						selectable
						accessibilityLiveRegion='polite'
						accessibilityRole='alert'>
						{error}
					</AppText>
				) : hint ? (
					<AppText variant='bodySmall' tone='textSecondary'>
						{hint}
					</AppText>
				) : null}
			</View>
		);
	},
);
