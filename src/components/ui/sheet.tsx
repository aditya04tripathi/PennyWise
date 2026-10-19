import {
	Group,
	Host,
	RNHostView,
	BottomSheet as SwiftBottomSheet,
} from '@expo/ui/swift-ui';
import {
	frame,
	padding,
	presentationBackground,
	presentationDetents,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
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
	const body = scroll ? (
		<ScrollView
			keyboardShouldPersistTaps='handled'
			style={{ flex: 1 }}
			contentContainerStyle={{
				paddingHorizontal: theme.spacing.md,
				paddingBottom: footer ? theme.spacing.sm : theme.spacing.md,
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
	);

	return (
		<Host style={{ position: 'absolute' }} pointerEvents='none'>
			<SwiftBottomSheet
				isPresented={visible}
				onIsPresentedChange={(presented) => {
					if (!presented && dismissible) onClose();
				}}
				fitToContents={!scroll}>
				<Group
					modifiers={[
						frame({ maxWidth: Infinity, alignment: 'topLeading' }),
						padding({ top: 0, bottom: 0, leading: 0, trailing: 0 }),
						presentationDragIndicator(
							dismissible ? 'visible' : 'hidden',
						),
						...(scroll
							? [presentationDetents(['medium', 'large'])]
							: []),
						presentationBackground(theme.colors.background),
					]}>
					<RNHostView
						matchContents={scroll ? false : { vertical: true }}>
						<View
							style={
								scroll ? { flexGrow: 1, height: 0 } : undefined
							}>
							<KeyboardAvoidingView
								behavior='padding'
								style={{
									flex: scroll ? 1 : undefined,
									backgroundColor: theme.colors.background,
								}}>
								<View
									style={{
										paddingVertical: theme.spacing.lg,
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									<AppText
										variant='heading1'
										accessibilityRole='header'
										style={{
											paddingHorizontal: theme.spacing.md,
											paddingTop: theme.spacing.xs,
											paddingBottom: theme.spacing.sm,
										}}>
										{title}
									</AppText>
								</View>
								{body}
								<View
									style={{
										paddingHorizontal: theme.spacing.md,
										paddingBottom:
											insets.bottom + theme.spacing.md,
										gap: theme.spacing.xs,
									}}>
									{footer}
								</View>
							</KeyboardAvoidingView>
						</View>
					</RNHostView>
				</Group>
			</SwiftBottomSheet>
		</Host>
	);
}
