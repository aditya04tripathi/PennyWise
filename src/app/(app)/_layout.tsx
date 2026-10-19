import { Stack } from 'expo-router/stack';

import { useTheme } from '@/theme/use-theme';

export default function AppLayout() {
	const theme = useTheme();
	return (
		<Stack
			screenOptions={{
				headerBackButtonDisplayMode: 'minimal',
				headerBackTitle: 'Back',
				headerLargeTitleEnabled: false,
				headerLargeTitleShadowVisible: false,
				headerLargeTitleStyle: { color: theme.colors.textPrimary },
				headerTintColor: theme.colors.brandPrimary,
				headerTitleStyle: { color: theme.colors.textPrimary },
				headerStyle: { backgroundColor: theme.colors.background },
				headerShadowVisible: false,
				contentStyle: { backgroundColor: theme.colors.background },
			}}>
			<Stack.Screen
				name='(tabs)'
				options={{ headerShown: false, title: 'Back' }}
			/>
			<Stack.Screen name='filters' options={{ title: 'Filters' }} />
			<Stack.Screen
				name='transaction/edit'
				options={{
					presentation: 'modal',
					title: 'Transaction',
					headerLargeTitleEnabled: false,
				}}
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
				options={{
					presentation: 'modal',
					title: 'Category',
					headerLargeTitleEnabled: false,
				}}
			/>
			<Stack.Screen name='cards/index' options={{ title: 'Cards' }} />
			<Stack.Screen
				name='cards/edit'
				options={{
					presentation: 'modal',
					title: 'Card',
					headerLargeTitleEnabled: false,
				}}
			/>
			<Stack.Screen
				name='accounts/index'
				options={{ title: 'Accounts' }}
			/>
			<Stack.Screen
				name='accounts/edit'
				options={{
					presentation: 'modal',
					title: 'Account',
					headerLargeTitleEnabled: false,
				}}
			/>
			<Stack.Screen
				name='accounts/transfer'
				options={{
					presentation: 'modal',
					title: 'Transfer',
					headerLargeTitleEnabled: false,
				}}
			/>
			<Stack.Screen
				name='goals/index'
				options={{ title: 'Savings goals' }}
			/>
			<Stack.Screen name='goals/edit' options={{ title: 'Goal' }} />
			<Stack.Screen
				name='pro'
				options={{
					presentation: 'modal',
					title: 'PennyWise Pro',
					headerLargeTitleEnabled: false,
				}}
			/>
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
