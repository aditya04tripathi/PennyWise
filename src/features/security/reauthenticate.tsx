import { useState } from 'react';
import { View } from 'react-native';

import { PinDots, PinPad } from '@/components/forms/pin-pad';
import { AppText } from '@/components/ui/text';
import { PIN_LENGTH } from '@/domain/security/pin';
import { useTheme } from '@/theme/use-theme';

import { authenticateWithBiometrics, checkPin } from './app-security';

function describeWait(ms: number): string {
	const seconds = Math.ceil(ms / 1000);
	return seconds < 60
		? `${seconds} seconds`
		: `${Math.ceil(seconds / 60)} minutes`;
}

export function Reauthenticate({
	reason,
	biometricEnabled,
	onVerified,
}: {
	reason: string;
	biometricEnabled: boolean;
	onVerified: () => void;
}) {
	const theme = useTheme();
	const [pin, setPin] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [checking, setChecking] = useState(false);

	const handlePinChange = (next: string) => {
		setPin(next);
		if (next.length !== PIN_LENGTH) return;
		setChecking(true);
		checkPin(next)
			.then((result) => {
				if (result.kind === 'accepted') {
					onVerified();
					return;
				}
				if (result.kind === 'not-configured') {
					setMessage('No PIN is set.');
				} else if (result.kind === 'locked') {
					setMessage(
						`Too many attempts. Try again in ${describeWait(result.retryInMs)}.`,
					);
				} else {
					setMessage(
						result.attemptsBeforeLockout > 0
							? `Incorrect PIN. ${result.attemptsBeforeLockout} attempts left before a pause.`
							: 'Incorrect PIN.',
					);
				}
				setPin('');
			})
			.catch(() => {
				setMessage('Your PIN could not be checked. Try again.');
				setPin('');
			})
			.finally(() => setChecking(false));
	};

	const verifyWithBiometrics = async () => {
		if (await authenticateWithBiometrics(reason)) onVerified();
	};

	return (
		<View style={{ gap: theme.spacing.lg, alignItems: 'center' }}>
			<AppText
				variant='body'
				tone='textSecondary'
				align='center'
				accessibilityLiveRegion='polite'>
				{message ?? reason}
			</AppText>
			<PinDots
				length={pin.length}
				error={!!message && pin.length === 0}
			/>
			<PinPad
				value={pin}
				onChange={handlePinChange}
				disabled={checking}
				onBiometric={
					biometricEnabled ? verifyWithBiometrics : undefined
				}
			/>
		</View>
	);
}
