import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/use-theme';

import { AppText } from './text';
import { useTabBarInset } from './tab-bar-inset';

export interface ScreenProps extends ScrollViewProps {
	title?: string;
	subtitle?: string;
	headerAction?: ReactNode;
	topInset?: boolean;
	tabBarInset?: boolean;
	footer?: ReactNode;
	children: ReactNode;
}

export function Screen({
	title,
	subtitle,
	headerAction,
	topInset = false,
	tabBarInset = false,
	footer,
	children,
	contentContainerStyle,
	...rest
}: ScreenProps) {
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	const tabInset = useTabBarInset();
	const scroll = (
		<ScrollView
			style={{ flex: 1, backgroundColor: theme.colors.background }}
			contentInsetAdjustmentBehavior={
				topInset || tabBarInset ? 'never' : 'automatic'
			}
			keyboardShouldPersistTaps='handled'
			keyboardDismissMode='interactive'
			contentContainerStyle={[
				{
					paddingHorizontal: theme.layout.screenPadding,
					paddingTop: topInset ? theme.spacing.sm : theme.spacing.md,
					paddingBottom: footer
						? theme.spacing.md
						: theme.spacing.xl + (tabBarInset ? 0 : insets.bottom),
					gap: theme.spacing.lg,
				},
				contentContainerStyle,
			]}
			{...rest}>
			{title ? (
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'flex-end',
						justifyContent: 'space-between',
						gap: theme.spacing.sm,
					}}>
					<View style={{ flex: 1, gap: 2 }}>
						{subtitle ? (
							<AppText variant='bodySmall' tone='textSecondary'>
								{subtitle}
							</AppText>
						) : null}
						<AppText variant='heading1' accessibilityRole='header'>
							{title}
						</AppText>
					</View>
					{headerAction}
				</View>
			) : null}
			{children}
		</ScrollView>
	);
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: theme.colors.background,
				paddingTop: topInset ? insets.top : 0,
			}}>
			{scroll}
			{footer}
			{tabBarInset ? <View style={{ height: tabInset }} /> : null}
		</View>
	);
}
