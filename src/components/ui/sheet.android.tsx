import { BottomSheet, RNHostView } from '@expo/ui';
import type { ReactNode } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/use-theme';

import { AppText } from './text';

export interface SheetProps {
	visible: boolean;
	title: string;
	onClose: () => void;
	dismissible?: boolean;
	scroll?: boolean;
	children: ReactNode;
	footer?: ReactNode;
}

export function Sheet({
	visible,
	title,
	onClose,
	dismissible = true,
	scroll = true,
	children,
	footer,
}: SheetProps) {
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();

	return (
		<BottomSheet
			isPresented={visible}
			onDismiss={() => {
				if (dismissible) onClose();
			}}
			showDragIndicator={dismissible}
			shouldDismissOnBackPress={dismissible}
			shouldDismissOnClickOutside={dismissible}
			snapPoints={scroll ? ['half', 'full'] : undefined}
			containerColor={theme.colors.background}
			contentPadding={0}>
			<RNHostView matchContents={false}>
				<View
					style={
						scroll
							? { width, flexGrow: 1, height: 0 }
							: { width }
					}>
					<AppText
						variant='heading2'
						accessibilityRole='header'
						style={{
							paddingHorizontal: theme.spacing.md,
							paddingTop: theme.spacing.xs,
							paddingBottom: theme.spacing.sm,
						}}>
						{title}
					</AppText>
					{scroll ? (
						<ScrollView
							nestedScrollEnabled
							keyboardShouldPersistTaps='handled'
							style={{ flex: 1 }}
							contentContainerStyle={{
								paddingHorizontal: theme.spacing.md,
								paddingBottom: footer
									? theme.spacing.sm
									: theme.spacing.md,
								gap: theme.spacing.md,
							}}>
							{children}
						</ScrollView>
					) : (
						<View
							style={{
								paddingHorizontal: theme.spacing.md,
								paddingBottom: theme.spacing.sm,
								gap: theme.spacing.md,
							}}>
							{children}
						</View>
					)}
					<View
						style={{
							paddingHorizontal: theme.spacing.md,
							paddingBottom: insets.bottom + theme.spacing.md,
							gap: theme.spacing.xs,
						}}>
						{footer}
					</View>
				</View>
			</RNHostView>
		</BottomSheet>
	);
}
