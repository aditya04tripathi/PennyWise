import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { showMessage, userFacingError } from '@/components/feedback/confirm';
import { CurrencyPicker } from '@/components/forms/currency-picker';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { findCurrency } from '@/domain/money/currency';
import { useBackupFlow } from '@/features/backup/backup-flow';
import {
	biometricAvailability,
	setBiometricEnabled,
	setPin,
} from '@/features/security/app-security';
import { PinSetup } from '@/features/security/pin-setup';
import { useSession } from '@/features/session/session-store';
import {
	changeCurrency,
	updateSettings,
} from '@/features/settings/settings-service';
import { useTheme } from '@/theme/use-theme';

type Step = 'welcome' | 'profile' | 'security' | 'pin' | 'biometric';

export default function OnboardingScreen() {
	const theme = useTheme();
	const [step, setStep] = useState<Step>('welcome');
	const [name, setName] = useState('');
	const [currency, setCurrency] = useState(() => guessCurrency());
	const [pickingCurrency, setPickingCurrency] = useState(false);
	const [busy, setBusy] = useState(false);
	const backup = useBackupFlow({
		hasExistingData: false,
		onCompleted: () =>
			updateSettings({ onboardingCompleted: true }).catch(
				() => undefined,
			),
	});

	const finish = async () => {
		setBusy(true);
		try {
			await updateSettings({
				name: name.trim(),
				onboardingCompleted: true,
			});
		} catch (error) {
			showMessage('Could not finish setup', userFacingError(error));
		} finally {
			setBusy(false);
		}
	};

	const saveProfile = async () => {
		setBusy(true);
		try {
			await changeCurrency(currency);
			setStep('security');
		} catch (error) {
			showMessage('Could not save currency', userFacingError(error));
		} finally {
			setBusy(false);
		}
	};

	const savePin = useCallback(
		async (pin: string) => {
			await setPin(pin);
			useSession
				.getState()
				.setSecurity({ pinEnabled: true, biometricEnabled: false });
			if ((await biometricAvailability()) === 'available')
				setStep('biometric');
			else
				await updateSettings({
					name: name.trim(),
					onboardingCompleted: true,
				});
		},
		[name],
	);

	if (step === 'pin') {
		return (
			<SafeAreaView
				style={{
					flex: 1,
					backgroundColor: theme.colors.background,
					justifyContent: 'center',
					padding: theme.spacing.lg,
				}}>
				<PinSetup onComplete={savePin} />
				<Button
					label='Back'
					variant='ghost'
					onPress={() => setStep('security')}
				/>
			</SafeAreaView>
		);
	}

	return (
		<Screen
			topInset
			contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
			{step === 'welcome' ? (
				<View style={{ gap: theme.spacing.xl }}>
					<View style={{ gap: theme.spacing.sm }}>
						<View
							style={{
								width: 56,
								height: 56,
								borderRadius: theme.radii.lg,
								borderCurve: 'continuous',
								backgroundColor: theme.colors.brandPrimary,
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							<Icon
								name='wallet'
								size={28}
								color={theme.colors.textOnBrand}
							/>
						</View>
						<AppText variant='display'>
							Know where your money goes.
						</AppText>
						<AppText variant='bodyLarge' tone='textSecondary'>
							PennyWise keeps your finances on this device,
							encrypted. No account, no cloud, no tracking.
						</AppText>
					</View>
					<View style={{ gap: theme.spacing.xs }}>
						<Button
							label='Get started'
							onPress={() => setStep('profile')}
							fullWidth
						/>
						<Button
							label='Import or restore a backup'
							variant='secondary'
							icon='import'
							onPress={backup.start}
							loading={backup.busy}
							fullWidth
						/>
					</View>
				</View>
			) : null}

			{step === 'profile' ? (
				<View style={{ gap: theme.spacing.lg }}>
					<AppText variant='heading1'>About you</AppText>
					<TextField
						label='Your name (optional)'
						value={name}
						onChangeText={setName}
						autoComplete='name'
						textContentType='name'
						maxLength={60}
						returnKeyType='done'
					/>
					<Surface padded={false}>
						<ListRow
							title='Currency'
							value={`${currency} · ${findCurrency(currency)?.name ?? ''}`}
							icon='currency'
							onPress={() => setPickingCurrency(true)}
						/>
					</Surface>
					<AppText variant='bodySmall' tone='textSecondary'>
						All amounts are recorded in this currency. You can
						change it later.
					</AppText>
					<Button
						label='Continue'
						onPress={saveProfile}
						loading={busy}
						fullWidth
					/>
					<Button
						label='Back'
						variant='ghost'
						onPress={() => setStep('welcome')}
					/>
				</View>
			) : null}

			{step === 'security' ? (
				<View style={{ gap: theme.spacing.lg }}>
					<AppText variant='heading1'>Protect your data</AppText>
					<AppText variant='bodyLarge' tone='textSecondary'>
						Your data is always encrypted on this device. A PIN also
						stops anyone holding your unlocked phone from opening
						PennyWise.
					</AppText>
					<Button
						label='Set a PIN'
						icon='lock'
						onPress={() => setStep('pin')}
						fullWidth
					/>
					<Button
						label='Skip for now'
						variant='ghost'
						onPress={finish}
						loading={busy}
					/>
				</View>
			) : null}

			{step === 'biometric' ? (
				<View style={{ gap: theme.spacing.lg }}>
					<AppText variant='heading1'>Unlock faster</AppText>
					<AppText variant='bodyLarge' tone='textSecondary'>
						Use Face ID, Touch ID or your fingerprint instead of
						typing your PIN. Your PIN still works as a fallback.
					</AppText>
					<Button
						label='Enable biometric unlock'
						icon='biometric'
						loading={busy}
						fullWidth
						onPress={async () => {
							if (await setBiometricEnabled(true))
								useSession.getState().setSecurity({
									pinEnabled: true,
									biometricEnabled: true,
								});
							await finish();
						}}
					/>
					<Button label='Not now' variant='ghost' onPress={finish} />
				</View>
			) : null}

			<CurrencyPicker
				visible={pickingCurrency}
				selected={currency}
				onClose={() => setPickingCurrency(false)}
				onSelect={(code) => {
					setCurrency(code);
					setPickingCurrency(false);
				}}
			/>
			{backup.element}
		</Screen>
	);
}

function guessCurrency(): string {
	try {
		const code = new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: 'USD',
		}).resolvedOptions().locale;
		const region = code.split('-')[1];
		const byRegion: Record<string, string> = {
			GB: 'GBP',
			IN: 'INR',
			JP: 'JPY',
			CA: 'CAD',
			AU: 'AUD',
			CN: 'CNY',
			DE: 'EUR',
			FR: 'EUR',
			ES: 'EUR',
			IT: 'EUR',
			NL: 'EUR',
		};
		const guess = region ? byRegion[region] : undefined;
		return guess && findCurrency(guess) ? guess : 'USD';
	} catch {
		return 'USD';
	}
}
