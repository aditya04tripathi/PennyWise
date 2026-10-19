import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/theme/use-theme';

export default function TabsLayout() {
	const theme = useTheme();
	return (
		<NativeTabs
			tintColor={theme.colors.brandPrimary}
			blurEffect={
				theme.dark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'
			}
			iconColor={{
				default: theme.colors.textSecondary,
				selected: theme.colors.brandPrimary,
			}}
			labelStyle={{
				default: { color: theme.colors.textSecondary },
				selected: { color: theme.colors.brandPrimary },
			}}>
			<NativeTabs.Trigger name='index' accessibilityLabel='Home'>
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: 'house', selected: 'house.fill' }}
					md='home'
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name='activity' accessibilityLabel='Activity'>
				<NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf='list.bullet.rectangle'
					md='receipt_long'
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name='planning' accessibilityLabel='Planning'>
				<NativeTabs.Trigger.Label>Planning</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
					md='pie_chart'
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name='calendar' accessibilityLabel='Calendar'>
				<NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon sf='calendar' md='calendar_month' />
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name='settings' accessibilityLabel='Settings'>
				<NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
					md='settings'
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
