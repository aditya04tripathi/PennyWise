import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmAction } from '@/components/feedback/confirm';
import { PinDots, PinPad } from '@/components/forms/pin-pad';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { PIN_LENGTH } from '@/domain/security/pin';
import {
	authenticateWithBiometrics,
	checkPin,
	currentLockout,
} from '@/features/security/app-security';
import { eraseAllLocalData } from '@/features/session/bootstrap';
import { useSession } from '@/features/session/session-store';
import { useTheme } from '@/theme/use-theme';

function formatWait(ms: number): string {
	const seconds = Math.ceil(ms / 1000);
	if (seconds < 60) return `${seconds} s`;
	const minutes = Math.ceil(seconds / 60);
	return `${minutes} min`;
}

export default function LockScreen() {
	const theme = useTheme();
	const security = useSession((state) => state.security);
	const unlock = useSession((state) => state.unlock);
	const [pin, setPin] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [lockedUntil, setLockedUntil] = useState<number | null>(null);
	const [now, setNow] = useState(() => Date.now());
	const [checking, setChecking] = useState(false);
	const promptedBiometric = useRef(false);

	const tryBiometric = useCallback(async () => {
		if (await authenticateWithBiometrics('Unlock PennyWise')) unlock();
	}, [unlock]);

	useEffect(() => {
		currentLockout().then(
			(remaining) =>
				remaining > 0 && setLockedUntil(Date.now() + remaining),
		);
		if (security.biometricEnabled && !promptedBiometric.current) {
			promptedBiometric.current = true;
			tryBiometric();
		}
	}, [security.biometricEnabled, tryBiometric]);

	useEffect(() => {
		if (lockedUntil === null) return;
		const timer = setInterval(() => {
			const current = Date.now();
			setNow(current);
			if (current >= lockedUntil) {
				setLockedUntil(null);
				setMessage(null);
			}
		}, 1000);
		return () => clearInterval(timer);
	}, [lockedUntil]);

	const handlePinChange = (next: string) => {
		setPin(next);
		if (next.length !== PIN_LENGTH) return;
		setChecking(true);
		checkPin(next)
			.then((result) => {
				if (
					result.kind === 'accepted' ||
					result.kind === 'not-configured'
				) {
					unlock();
					return;
				}
				if (result.kind === 'locked') {
					setLockedUntil(Date.now() + result.retryInMs);
					setMessage('Too many attempts.');
				} else {
					setMessage(
						result.attemptsBeforeLockout > 0
							? `Incorrect PIN. ${result.attemptsBeforeLockout} attempts left before a pause.`
							: 'Incorrect PIN.',
					);
				}
				setPin('');
			})
			.finally(() => setChecking(false));
	};

	const locked = lockedUntil !== null && now < lockedUntil;
	const status = locked
		? `Too many attempts. Try again in ${formatWait(lockedUntil - now)}.`
		: message;

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					padding: theme.spacing.lg,
					gap: theme.spacing.xl,
				}}>
				<View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
					<Icon
						name='lock'
						size={28}
						color={theme.colors.brandPrimary}
					/>
					<AppText variant='heading1' align='center'>
						Enter your PIN
					</AppText>
					<AppText
						variant='body'
						tone={status ? 'negative' : 'textSecondary'}
						align='center'
						accessibilityLiveRegion='assertive'>
						{status ?? 'PennyWise is locked'}
					</AppText>
				</View>
				{security.pinEnabled ? (
					<>
						<PinDots
							length={pin.length}
							error={!!message && pin.length === 0}
						/>
						<PinPad
							value={pin}
							onChange={handlePinChange}
							disabled={locked || checking}
							onBiometric={
								security.biometricEnabled
									? tryBiometric
									: undefined
							}
						/>
					</>
				) : (
					<Button
						label='Unlock with biometrics'
						icon='biometric'
						onPress={tryBiometric}
						fullWidth
					/>
				)}
				<Button
					label='Forgot PIN?'
					variant='ghost'
					onPress={async () => {
						const confirmed = await confirmAction({
							title: 'Reset PennyWise?',
							message:
								'Your PIN cannot be recovered. Resetting permanently erases all data on this device. You can then restore a backup file if you have one.',
							confirmLabel: 'Erase and reset',
							destructive: true,
						});
						if (confirmed) await eraseAllLocalData();
					}}
				/>
			</View>
		</SafeAreaView>
	);
}
