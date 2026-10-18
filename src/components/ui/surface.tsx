import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { AppText } from './text';

export function Surface({
	style,
	children,
	padded = true,
	...rest
}: ViewProps & { padded?: boolean }) {
	const theme = useTheme();
	return (
		<View
			style={[
				{
					backgroundColor: theme.colors.surface,
					borderRadius: theme.radii.lg,
					borderCurve: 'continuous',
					borderWidth: 1,
					borderColor: theme.colors.border,
					padding: padded ? theme.spacing.md : 0,
					overflow: 'hidden',
				},
				style,
			]}
			{...rest}>
			{children}
		</View>
	);
}

export function Section({
	title,
	action,
	children,
}: {
	title?: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	const theme = useTheme();
	return (
		<View style={{ gap: theme.spacing.xs }}>
			{title ? (
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingHorizontal: theme.spacing.xxs,
					}}>
					<AppText
						variant='label'
						tone='textSecondary'
						accessibilityRole='header'>
						{title}
					</AppText>
					{action}
				</View>
			) : null}
			{children}
		</View>
	);
}

export function Divider({ inset = 0 }: { inset?: number }) {
	const theme = useTheme();
	return (
		<View
			style={{
				height: 1,
				backgroundColor: theme.colors.divider,
				marginLeft: inset,
			}}
		/>
	);
}
