import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { confirmAction, showMessage } from '@/components/feedback/confirm';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import {
	biometricAvailability,
	clearSecurity,
	setBiometricEnabled,
	setPin,
	type BiometricAvailability,
} from '@/features/security/app-security';
import { PinSetup } from '@/features/security/pin-setup';
import { Reauthenticate } from '@/features/security/reauthenticate';
import { useSession } from '@/features/session/session-store';
import { updateSettings } from '@/features/settings/settings-service';
import { useSettings } from '@/hooks/use-app-data';
import { useTheme } from '@/theme/use-theme';

interface PinFlow {
	purpose: 'change' | 'turn-off';
	stage: 'verify' | 'set';
}

const AUTO_LOCK_OPTIONS = [
	{ seconds: 0, label: 'Immediately' },
	{ seconds: 60, label: 'After 1 min' },
	{ seconds: 300, label: 'After 5 min' },
	{ seconds: 900, label: 'After 15 min' },
] as const;

export default function SecurityScreen() {
	const theme = useTheme();
	const settings = useSettings();
	const security = useSession((state) => state.security);
	const setSecurity = useSession((state) => state.setSecurity);
	const encrypted = useSession((state) => state.encrypted);
	const [pinFlow, setPinFlow] = useState<PinFlow | null>(null);
	const [biometrics, setBiometrics] = useState<BiometricAvailability | null>(
		null,
	);

	useEffect(() => {
		biometricAvailability().then(setBiometrics, () =>
			setBiometrics('unsupported'),
		);
	}, []);

	const savePin = async (pin: string) => {
		await setPin(pin);
		setSecurity({
			pinEnabled: true,
			biometricEnabled: security.biometricEnabled,
		});
		setPinFlow(null);
	};

	const startPinChange = () =>
		setPinFlow(
			security.pinEnabled
				? { purpose: 'change', stage: 'verify' }
				: { purpose: 'change', stage: 'set' },
		);

	const handleVerified = () => {
		if (!pinFlow) return;
		if (pinFlow.purpose === 'change') {
			setPinFlow({ purpose: 'change', stage: 'set' });
			return;
		}
		setPinFlow(null);
		clearSecurity()
			.then(() =>
				setSecurity({ pinEnabled: false, biometricEnabled: false }),
			)
			.catch(() =>
				showMessage('Not changed', 'App lock could not be turned off.'),
			);
	};

	const requestTurnOff = async () => {
		const confirmed = await confirmAction({
			title: 'Turn off app lock?',
			message:
				'Anyone with your unlocked phone will be able to open PennyWise. Your data stays encrypted on the device. You will be asked for your current PIN.',
			confirmLabel: 'Continue',
			destructive: true,
		});
		if (confirmed) setPinFlow({ purpose: 'turn-off', stage: 'verify' });
	};

	const toggleBiometric = async (enabled: boolean) => {
		const changed = await setBiometricEnabled(enabled);
		if (changed)
			setSecurity({
				pinEnabled: security.pinEnabled,
				biometricEnabled: enabled,
			});
		else if (enabled)
			showMessage(
				'Biometric unlock not enabled',
				'Authentication was cancelled or failed.',
			);
	};

	return (
		<Screen>
			<Surface padded={false}>
				<ListRow
					icon='database'
					title='Storage encryption'
					value={encrypted ? 'On' : 'Off (development build)'}
					subtitle={
						encrypted
							? 'AES-256 via SQLCipher, key in the device keychain'
							: undefined
					}
				/>
			</Surface>

			<Section title='App lock'>
				<Surface padded={false}>
					{security.pinEnabled ? (
						<>
							<ListRow
								icon='lock'
								title='Change PIN'
								onPress={startPinChange}
							/>
							<Divider inset={60} />
							{biometrics === 'available' ? (
								<>
									<ListRow
										icon='biometric'
										title='Biometric unlock'
										toggle={{
											value: security.biometricEnabled,
											onChange: toggleBiometric,
										}}
									/>
									<Divider inset={60} />
								</>
							) : null}
							<ListRow
								icon='lock'
								title='Turn off app lock'
								destructive
								onPress={requestTurnOff}
							/>
						</>
					) : (
						<ListRow
							icon='lock'
							title='Set a PIN'
							subtitle='Require a PIN to open PennyWise'
							onPress={startPinChange}
						/>
					)}
				</Surface>
				{security.pinEnabled && biometrics === 'not-enrolled' ? (
					<AppText variant='bodySmall' tone='textSecondary'>
						Set up Face ID, Touch ID or a fingerprint in your device
						settings to unlock with biometrics.
					</AppText>
				) : null}
			</Section>

			{security.pinEnabled ? (
				<Section title='Lock when leaving the app'>
					<View
						style={{
							flexDirection: 'row',
							flexWrap: 'wrap',
							gap: theme.spacing.xs,
						}}>
						{AUTO_LOCK_OPTIONS.map((option) => (
							<Chip
								key={option.seconds}
								label={option.label}
								selected={
									settings.autoLockSeconds === option.seconds
								}
								onPress={() =>
									updateSettings({
										autoLockSeconds: option.seconds,
									})
								}
							/>
						))}
					</View>
					<AppText variant='bodySmall' tone='textSecondary'>
						While the app lock is on, PennyWise hides its contents
						in the app switcher.
					</AppText>
				</Section>
			) : null}

			<Sheet
				visible={pinFlow !== null}
				title={
					pinFlow?.stage === 'verify'
						? 'Enter current PIN'
						: security.pinEnabled
							? 'Change PIN'
							: 'Set PIN'
				}
				onClose={() => setPinFlow(null)}>
				{pinFlow?.stage === 'verify' ? (
					<Reauthenticate
						reason={
							pinFlow.purpose === 'turn-off'
								? 'Confirm it’s you to turn off app lock'
								: 'Confirm it’s you to change your PIN'
						}
						biometricEnabled={security.biometricEnabled}
						onVerified={handleVerified}
					/>
				) : (
					<PinSetup onComplete={savePin} />
				)}
				<Button
					label='Cancel'
					variant='ghost'
					onPress={() => setPinFlow(null)}
				/>
			</Sheet>
		</Screen>
	);
}
