import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import {
	createPinVerifier,
	INITIAL_LOCKOUT,
	matchesPinVerifier,
	registerFailedAttempt,
	remainingLockoutMs,
	type LockoutState,
	type PinVerifier,
} from '@/domain/security/pin';
import { secureRandomBytes } from '@/lib/crypto/random';

const PIN_KEY = 'pennywise.pin-verifier.v1';
const LOCKOUT_KEY = 'pennywise.pin-lockout.v1';
const BIOMETRIC_KEY = 'pennywise.biometric-enabled.v1';

const OPTIONS: SecureStore.SecureStoreOptions = {
	keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function readJson<T>(key: string): Promise<T | null> {
	const raw = await SecureStore.getItemAsync(key, OPTIONS);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export interface SecurityConfiguration {
	pinEnabled: boolean;
	biometricEnabled: boolean;
}

export async function loadSecurityConfiguration(): Promise<SecurityConfiguration> {
	const [verifier, biometric] = await Promise.all([
		readJson<PinVerifier>(PIN_KEY),
		SecureStore.getItemAsync(BIOMETRIC_KEY, OPTIONS),
	]);
	return {
		pinEnabled: verifier !== null,
		biometricEnabled: biometric === 'true',
	};
}

export async function setPin(pin: string): Promise<void> {
	const verifier = await createPinVerifier(pin, secureRandomBytes(16));
	await SecureStore.setItemAsync(PIN_KEY, JSON.stringify(verifier), OPTIONS);
	await SecureStore.setItemAsync(
		LOCKOUT_KEY,
		JSON.stringify(INITIAL_LOCKOUT),
		OPTIONS,
	);
}

export type PinCheckResult =
	| { kind: 'accepted' }
	| { kind: 'rejected'; attemptsBeforeLockout: number }
	| { kind: 'locked'; retryInMs: number }
	| { kind: 'not-configured' };

export async function checkPin(
	pin: string,
	nowMs = Date.now(),
): Promise<PinCheckResult> {
	const verifier = await readJson<PinVerifier>(PIN_KEY);
	if (!verifier) return { kind: 'not-configured' };
	const lockout =
		(await readJson<LockoutState>(LOCKOUT_KEY)) ?? INITIAL_LOCKOUT;
	const waiting = remainingLockoutMs(lockout, nowMs);
	if (waiting > 0) return { kind: 'locked', retryInMs: waiting };

	if (await matchesPinVerifier(pin, verifier)) {
		await SecureStore.setItemAsync(
			LOCKOUT_KEY,
			JSON.stringify(INITIAL_LOCKOUT),
			OPTIONS,
		);
		return { kind: 'accepted' };
	}
	const next = registerFailedAttempt(lockout, nowMs);
	await SecureStore.setItemAsync(LOCKOUT_KEY, JSON.stringify(next), OPTIONS);
	const retryInMs = remainingLockoutMs(next, nowMs);
	if (retryInMs > 0) return { kind: 'locked', retryInMs };
	return {
		kind: 'rejected',
		attemptsBeforeLockout: Math.max(0, 5 - next.failedAttempts),
	};
}

export async function currentLockout(nowMs = Date.now()): Promise<number> {
	const lockout =
		(await readJson<LockoutState>(LOCKOUT_KEY)) ?? INITIAL_LOCKOUT;
	return remainingLockoutMs(lockout, nowMs);
}

export type BiometricAvailability =
	'available' | 'not-enrolled' | 'unsupported';

export async function biometricAvailability(): Promise<BiometricAvailability> {
	if (!(await LocalAuthentication.hasHardwareAsync())) return 'unsupported';
	return (await LocalAuthentication.isEnrolledAsync())
		? 'available'
		: 'not-enrolled';
}

export async function authenticateWithBiometrics(
	promptMessage: string,
): Promise<boolean> {
	if ((await biometricAvailability()) !== 'available') return false;
	const result = await LocalAuthentication.authenticateAsync({
		promptMessage,
		cancelLabel: 'Use PIN',
		disableDeviceFallback: true,
		biometricsSecurityLevel: 'strong',
	});
	return result.success;
}

export async function setBiometricEnabled(enabled: boolean): Promise<boolean> {
	if (
		enabled &&
		!(await authenticateWithBiometrics(
			'Confirm to enable biometric unlock',
		))
	)
		return false;
	await SecureStore.setItemAsync(
		BIOMETRIC_KEY,
		enabled ? 'true' : 'false',
		OPTIONS,
	);
	return true;
}

export async function clearSecurity(): Promise<void> {
	await Promise.all(
		[PIN_KEY, LOCKOUT_KEY, BIOMETRIC_KEY].map((key) =>
			SecureStore.deleteItemAsync(key, OPTIONS),
		),
	);
}
