import { Alert } from 'react-native';

export function confirmAction({
	title,
	message,
	confirmLabel,
	destructive = false,
}: {
	title: string;
	message: string;
	confirmLabel: string;
	destructive?: boolean;
}): Promise<boolean> {
	return new Promise((resolve) => {
		Alert.alert(
			title,
			message,
			[
				{
					text: 'Cancel',
					style: 'cancel',
					onPress: () => resolve(false),
				},
				{
					text: confirmLabel,
					style: destructive ? 'destructive' : 'default',
					onPress: () => resolve(true),
				},
			],
			{ cancelable: true, onDismiss: () => resolve(false) },
		);
	});
}

export function showMessage(title: string, message: string): void {
	Alert.alert(title, message);
}

export function userFacingError(
	error: unknown,
	fallback = 'Something went wrong. Your data was not changed.',
): string {
	if (
		error instanceof Error &&
		error.message &&
		!/sqlite|sql|constraint|undefined|null/i.test(error.message)
	)
		return error.message;
	return fallback;
}
