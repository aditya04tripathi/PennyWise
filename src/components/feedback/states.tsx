import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/use-theme';

export function EmptyState({
	icon,
	title,
	message,
	actionLabel,
	onAction,
}: {
	icon: IconName;
	title: string;
	message: string;
	actionLabel?: string;
	onAction?: () => void;
}) {
	const theme = useTheme();
	return (
		<View
			style={{
				alignItems: 'center',
				gap: theme.spacing.sm,
				paddingVertical: theme.spacing.xxl,
				paddingHorizontal: theme.spacing.xl,
			}}>
			<View
				style={{
					width: 52,
					height: 52,
					borderRadius: theme.radii.lg,
					borderCurve: 'continuous',
					backgroundColor: theme.colors.brandSoft,
					alignItems: 'center',
					justifyContent: 'center',
				}}>
				<Icon name={icon} size={24} color={theme.colors.brandPrimary} />
			</View>
			<AppText variant='heading3' align='center'>
				{title}
			</AppText>
			<AppText variant='body' tone='textSecondary' align='center'>
				{message}
			</AppText>
			{actionLabel && onAction ? (
				<Button label={actionLabel} onPress={onAction} compact />
			) : null}
		</View>
	);
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
	const theme = useTheme();
	return (
		<View
			accessibilityLabel={label}
			accessibilityRole='progressbar'
			style={{ padding: theme.spacing.xxl, alignItems: 'center' }}>
			<ActivityIndicator color={theme.colors.brandPrimary} />
		</View>
	);
}

export function ErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry?: () => void;
}) {
	const theme = useTheme();
	return (
		<View
			style={{
				alignItems: 'center',
				gap: theme.spacing.sm,
				padding: theme.spacing.xl,
			}}
			accessibilityRole='alert'>
			<Icon name='warning' size={24} color={theme.colors.warning} />
			<AppText variant='body' align='center' selectable>
				{message}
			</AppText>
			{onRetry ? (
				<Button
					label='Try again'
					variant='secondary'
					onPress={onRetry}
					compact
				/>
			) : null}
		</View>
	);
}
