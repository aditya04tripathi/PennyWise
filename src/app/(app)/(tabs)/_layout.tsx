import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/theme/use-theme';

export default function TabsLayout() {
	const theme = useTheme();
	return (
		<NativeTabs tintColor={theme.colors.brandPrimary}>
			<NativeTabs.Trigger name='index'>
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: 'house', selected: 'house.fill' }}
					md='home'
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name='activity'>
				<NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf='list.bullet.rectangle'
					md='receipt_long'
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name='planning'>
				<NativeTabs.Trigger.Label>Planning</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
					md='pie_chart'
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name='calendar'>
				<NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon sf='calendar' md='calendar_month' />
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name='settings'>
				<NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
					md='settings'
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
