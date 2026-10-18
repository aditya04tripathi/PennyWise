import * as Notifications from 'expo-notifications';

const BUDGET_CHANNEL = 'budget-alerts';

let configured = false;

export async function configureNotifications(): Promise<void> {
	if (configured) return;
	configured = true;
	Notifications.setNotificationHandler({
		handleNotification: async () => ({
			shouldShowBanner: true,
			shouldShowList: true,
			shouldPlaySound: false,
			shouldSetBadge: false,
		}),
	});
	if (process.env.EXPO_OS === 'android') {
		await Notifications.setNotificationChannelAsync(BUDGET_CHANNEL, {
			name: 'Budget alerts',
			importance: Notifications.AndroidImportance.DEFAULT,
		});
	}
}

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export async function notificationPermission(): Promise<NotificationPermission> {
	const { status } = await Notifications.getPermissionsAsync();
	return status === 'granted'
		? 'granted'
		: status === 'denied'
			? 'denied'
			: 'undetermined';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
	const current = await notificationPermission();
	if (current !== 'undetermined') return current;
	const { status } = await Notifications.requestPermissionsAsync();
	return status === 'granted' ? 'granted' : 'denied';
}

export async function presentBudgetNotification(
	title: string,
	body: string,
): Promise<boolean> {
	if ((await notificationPermission()) !== 'granted') return false;
	await configureNotifications();
	await Notifications.scheduleNotificationAsync({
		content: { title, body },
		trigger:
			process.env.EXPO_OS === 'android'
				? { channelId: BUDGET_CHANNEL }
				: null,
	});
	return true;
}
