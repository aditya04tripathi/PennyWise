import type { ReactNode } from 'react';
import {
	KeyboardAvoidingView,
	Modal,
	Pressable,
	ScrollView,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/use-theme';

import { Icon } from './icon';
import { AppText } from './text';

export interface SheetProps {
	visible: boolean;
	title: string;
	onClose: () => void;
	dismissible?: boolean;
	children: ReactNode;
	footer?: ReactNode;
}

export function Sheet({
	visible,
	title,
	onClose,
	dismissible = true,
	children,
	footer,
}: SheetProps) {
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
			onRequestClose={dismissible ? onClose : () => undefined}>
			<KeyboardAvoidingView
				behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
				style={{ flex: 1, backgroundColor: theme.colors.background }}>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						padding: theme.spacing.md,
						paddingTop:
							process.env.EXPO_OS === 'ios'
								? theme.spacing.md
								: insets.top + theme.spacing.xs,
						gap: theme.spacing.sm,
					}}>
					<AppText
						variant='heading2'
						style={{ flex: 1 }}
						accessibilityRole='header'>
						{title}
					</AppText>
					{dismissible ? (
						<Pressable
							onPress={onClose}
							accessibilityRole='button'
							accessibilityLabel='Close'
							hitSlop={12}
							style={{
								width: 32,
								height: 32,
								borderRadius: 16,
								backgroundColor: theme.colors.surfaceElevated,
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							<Icon
								name='close'
								size={14}
								color={theme.colors.textSecondary}
							/>
						</Pressable>
					) : null}
				</View>
				<ScrollView
					keyboardShouldPersistTaps='handled'
					contentContainerStyle={{
						padding: theme.spacing.md,
						gap: theme.spacing.md,
					}}>
					{children}
				</ScrollView>
				{footer ? (
					<View
						style={{
							padding: theme.spacing.md,
							paddingBottom: insets.bottom + theme.spacing.md,
							gap: theme.spacing.xs,
						}}>
						{footer}
					</View>
				) : null}
			</KeyboardAvoidingView>
		</Modal>
	);
}
