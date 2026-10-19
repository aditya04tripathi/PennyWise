import { Host, Switch } from '@expo/ui';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

export interface ListRowProps {
	title: string;
	subtitle?: string;
	value?: string;
	icon?: IconName;
	iconColor?: string;
	destructive?: boolean;
	onPress?: () => void;
	toggle?: {
		value: boolean;
		onChange: (value: boolean) => void;
		disabled?: boolean;
	};
	trailing?: ReactNode;
	accessibilityHint?: string;
}

export function ListRow({
	title,
	subtitle,
	value,
	icon,
	iconColor,
	destructive,
	onPress,
	toggle,
	trailing,
	accessibilityHint,
}: ListRowProps) {
	const theme = useTheme();
	const titleColor = destructive
		? theme.colors.negative
		: theme.colors.textPrimary;
	const content = (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				gap: theme.spacing.sm,
				minHeight: theme.layout.rowHeight,
				paddingVertical: theme.spacing.xs,
			}}>
			{icon ? (
				<View
					style={{
						width: 36,
						height: 36,
						borderRadius: theme.radii.sm,
						backgroundColor: destructive
							? theme.colors.negativeSoft
							: theme.colors.brandSoft,
						alignItems: 'center',
						justifyContent: 'center',
					}}>
					<Icon
						name={icon}
						size={16}
						color={
							iconColor ??
							(destructive
								? theme.colors.negative
								: theme.colors.brandPrimary)
						}
					/>
				</View>
			) : null}
			<View style={{ flex: 1, minWidth: 72, gap: 2 }}>
				<AppText
					variant='body'
					style={{ color: titleColor, fontWeight: '500' }}>
					{title}
				</AppText>
				{subtitle ? (
					<AppText variant='bodySmall' tone='textSecondary'>
						{subtitle}
					</AppText>
				) : null}
			</View>
			{value ? (
				<AppText
					variant='body'
					tone='textSecondary'
					numberOfLines={3}
					style={{ flexShrink: 1, textAlign: 'right' }}>
					{value}
				</AppText>
			) : null}
			{trailing}
			{toggle ? (
				<View
					accessible
					accessibilityRole='switch'
					accessibilityLabel={title}
					accessibilityState={{
						checked: toggle.value,
						disabled: !!toggle.disabled,
					}}>
					<Host
						matchContents
						colorScheme={theme.dark ? 'dark' : 'light'}
						seedColor={theme.colors.brandPrimary}>
						<Switch
							value={toggle.value}
							onValueChange={toggle.onChange}
							disabled={toggle.disabled}
						/>
					</Host>
				</View>
			) : null}
			{onPress && !toggle ? (
				<Icon
					name='chevronRight'
					size={14}
					color={theme.colors.textTertiary}
				/>
			) : null}
		</View>
	);

	if (!onPress) {
		return (
			<View
				style={{ paddingHorizontal: theme.spacing.md }}
				accessible={!toggle}
				accessibilityLabel={
					toggle
						? undefined
						: [title, subtitle, value].filter(Boolean).join(', ')
				}>
				{content}
			</View>
		);
	}
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole='button'
			accessibilityLabel={[title, value].filter(Boolean).join(', ')}
			accessibilityHint={accessibilityHint ?? subtitle}
			style={({ pressed }) => ({
				paddingHorizontal: theme.spacing.md,
				backgroundColor: pressed
					? theme.colors.surfaceElevated
					: 'transparent',
			})}>
			{content}
		</Pressable>
	);
}
