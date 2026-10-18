import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/use-theme';

export default function AppLayout() {
	const theme = useTheme();
	return (
		<Stack
			screenOptions={{
				headerBackButtonDisplayMode: 'minimal',
				headerTintColor: theme.colors.brandPrimary,
				headerTitleStyle: { color: theme.colors.textPrimary },
				headerStyle: { backgroundColor: theme.colors.background },
				headerShadowVisible: false,
				contentStyle: { backgroundColor: theme.colors.background },
			}}>
			<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
			<Stack.Screen
				name='transaction/edit'
				options={{ presentation: 'modal', title: 'Transaction' }}
			/>
			<Stack.Screen
				name='transaction/[id]'
				options={{ title: 'Details' }}
			/>
			<Stack.Screen name='recurring' options={{ title: 'Recurring' }} />
			<Stack.Screen
				name='categories/index'
				options={{ title: 'Categories' }}
			/>
			<Stack.Screen
				name='categories/edit'
				options={{ presentation: 'modal', title: 'Category' }}
			/>
			<Stack.Screen name='cards/index' options={{ title: 'Cards' }} />
			<Stack.Screen
				name='cards/edit'
				options={{ presentation: 'modal', title: 'Card' }}
			/>
			<Stack.Screen
				name='accounts/index'
				options={{ title: 'Accounts' }}
			/>
			<Stack.Screen
				name='accounts/edit'
				options={{ presentation: 'modal', title: 'Account' }}
			/>
			<Stack.Screen
				name='accounts/transfer'
				options={{ presentation: 'modal', title: 'Transfer' }}
			/>
			<Stack.Screen
				name='goals/index'
				options={{ title: 'Savings goals' }}
			/>
			<Stack.Screen name='goals/edit' options={{ title: 'Goal' }} />
			<Stack.Screen
				name='settings/profile'
				options={{ title: 'Profile' }}
			/>
			<Stack.Screen
				name='settings/budget'
				options={{ title: 'Budget & alerts' }}
			/>
			<Stack.Screen
				name='settings/security'
				options={{ title: 'Security' }}
			/>
			<Stack.Screen
				name='settings/backup'
				options={{ title: 'Backup & import' }}
			/>
			<Stack.Screen
				name='settings/about'
				options={{ title: 'Privacy & about' }}
			/>
		</Stack>
	);
}
