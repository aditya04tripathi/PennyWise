import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { showMessage } from '@/components/feedback/confirm';
import { DatabaseErrorScreen } from '@/components/feedback/database-error';
import { PrivacyOverlay } from '@/components/feedback/privacy-overlay';
import { LoadingState } from '@/components/feedback/states';
import { configureNotifications } from '@/features/notifications/local-notifications';
import { useAppLock } from '@/features/security/use-app-lock';
import {
	bootstrapSession,
	eraseAllLocalData,
} from '@/features/session/bootstrap';
import { useSession } from '@/features/session/session-store';
import { applyNativeAppearance } from '@/theme/native-appearance';
import { useTheme } from '@/theme/use-theme';

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<AppShell />
		</SafeAreaProvider>
	);
}

function AppShell() {
	const theme = useTheme();
	const boot = useSession((state) => state.boot);
	const previousDataNotice = useSession((state) => state.previousDataNotice);
	const onboarded =
		useSession((state) => state.settings?.onboardingCompleted ?? false) &&
		false;
	const unlocked = useSession((state) => state.unlocked);
	const appearance = useSession((state) => state.settings?.appearance ?? null);
	const { obscured } = useAppLock();

	useEffect(() => {
		bootstrapSession();
		configureNotifications().catch(() => undefined);
	}, []);

	useEffect(() => {
		if (boot.kind !== 'ready' || previousDataNotice !== 'legacy-removed')
			return;
		showMessage(
			'Older data was removed',
			'Data from the previous version of PennyWise was still on this device. It was deleted. What you have saved in this version was kept.',
		);
		useSession.setState({ previousDataNotice: null });
	}, [boot.kind, previousDataNotice]);

	if (appearance) applyNativeAppearance(appearance);

	const navigationTheme = theme.dark
		? {
				...DarkTheme,
				colors: {
					...DarkTheme.colors,
					background: theme.colors.background,
					card: theme.colors.surface,
					primary: theme.colors.brandPrimary,
					text: theme.colors.textPrimary,
					border: theme.colors.border,
				},
			}
		: {
				...DefaultTheme,
				colors: {
					...DefaultTheme.colors,
					background: theme.colors.background,
					card: theme.colors.surface,
					primary: theme.colors.brandPrimary,
					text: theme.colors.textPrimary,
					border: theme.colors.border,
				},
			};

	let content;
	if (boot.kind === 'booting') {
		content = (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					backgroundColor: theme.colors.background,
				}}>
				<LoadingState label='Opening PennyWise' />
			</View>
		);
	} else if (boot.kind === 'failed') {
		content = (
			<DatabaseErrorScreen
				failure={boot.failure}
				onRetry={bootstrapSession}
				onReset={eraseAllLocalData}
			/>
		);
	} else {
		content = (
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: theme.colors.background },
				}}>
				<Stack.Protected guard={!onboarded}>
					<Stack.Screen name='onboarding' />
				</Stack.Protected>
				<Stack.Protected guard={onboarded && !unlocked}>
					<Stack.Screen
						name='lock'
						options={{ animation: 'fade', gestureEnabled: false }}
					/>
				</Stack.Protected>
				<Stack.Protected guard={onboarded && unlocked}>
					<Stack.Screen name='(app)' />
				</Stack.Protected>
			</Stack>
		);
	}

	return (
		<ThemeProvider value={navigationTheme}>
			<StatusBar
				style={theme.dark ? 'light' : 'dark'}
				translucent
				backgroundColor='transparent'
				animated
			/>
			{content}
			{obscured ? <PrivacyOverlay /> : null}
		</ThemeProvider>
	);
}
