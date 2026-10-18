import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import type { DatabaseOpenFailure } from '@/data/database/open-encrypted-database';
import { useTheme } from '@/theme/use-theme';

import { confirmAction } from './confirm';

const MESSAGES: Record<
	DatabaseOpenFailure,
	{ title: string; body: string; canReset: boolean }
> = {
	'encryption-unavailable': {
		title: 'Encrypted storage is unavailable',
		body: 'This build of PennyWise cannot encrypt your data, so it will not store anything. Install the official release build.',
		canReset: false,
	},
	'key-unavailable': {
		title: 'Your device is locked',
		body: 'PennyWise could not read its encryption key from the device keychain. Unlock your device and try again.',
		canReset: false,
	},
	'key-mismatch': {
		title: 'Your data could not be unlocked',
		body: 'The encryption key on this device does not match the stored data. This can happen after restoring a device from a backup. If you have a PennyWise backup file, you can reset and restore it.',
		canReset: true,
	},
	'migration-failed': {
		title: 'PennyWise could not update your data',
		body: 'Your data was left unchanged. Update to the latest version of PennyWise and try again.',
		canReset: false,
	},
	unknown: {
		title: 'PennyWise could not start',
		body: 'Your data was left unchanged. Close the app and try again.',
		canReset: false,
	},
};

export function DatabaseErrorScreen({
	failure,
	onRetry,
	onReset,
}: {
	failure: DatabaseOpenFailure;
	onRetry: () => Promise<void>;
	onReset: () => Promise<void>;
}) {
	const theme = useTheme();
	const [busy, setBusy] = useState(false);
	const message = MESSAGES[failure];

	const run = async (action: () => Promise<void>) => {
		setBusy(true);
		try {
			await action();
		} finally {
			setBusy(false);
		}
	};

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<View
				style={{
					flex: 1,
					padding: theme.spacing.xl,
					justifyContent: 'center',
					gap: theme.spacing.md,
				}}
				accessibilityRole='alert'>
				<Icon name='warning' size={36} color={theme.colors.warning} />
				<AppText variant='heading1'>{message.title}</AppText>
				<AppText variant='bodyLarge' tone='textSecondary'>
					{message.body}
				</AppText>
				<Button
					label='Try again'
					onPress={() => run(onRetry)}
					loading={busy}
					fullWidth
				/>
				{message.canReset ? (
					<Button
						label='Erase local data and start over'
						variant='destructive'
						disabled={busy}
						fullWidth
						onPress={async () => {
							const confirmed = await confirmAction({
								title: 'Erase all local data?',
								message:
									'Everything stored in PennyWise on this device will be permanently deleted. Restore from a backup file afterwards if you have one.',
								confirmLabel: 'Erase',
								destructive: true,
							});
							if (confirmed) await run(onReset);
						}}
					/>
				) : null}
			</View>
		</SafeAreaView>
	);
}
