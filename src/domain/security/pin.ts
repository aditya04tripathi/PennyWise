import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

import {
	base64ToBytes,
	bytesToBase64,
	constantTimeEqual,
	utf8Encode,
} from '@/lib/crypto/bytes';

export const PIN_LENGTH = 4;
const PIN_ITERATIONS = 20_000;

export interface PinVerifier {
	version: 1;
	salt: string;
	hash: string;
	iterations: number;
}

export function isWellFormedPin(pin: string): boolean {
	return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export async function createPinVerifier(
	pin: string,
	salt: Uint8Array,
): Promise<PinVerifier> {
	if (!isWellFormedPin(pin))
		throw new Error('PIN must be exactly four digits');
	const hash = await pbkdf2Async(sha256, utf8Encode(pin), salt, {
		c: PIN_ITERATIONS,
		dkLen: 32,
	});
	return {
		version: 1,
		salt: bytesToBase64(salt),
		hash: bytesToBase64(hash),
		iterations: PIN_ITERATIONS,
	};
}

export async function matchesPinVerifier(
	pin: string,
	verifier: PinVerifier,
): Promise<boolean> {
	if (!isWellFormedPin(pin)) return false;
	const hash = await pbkdf2Async(
		sha256,
		utf8Encode(pin),
		base64ToBytes(verifier.salt),
		{
			c: verifier.iterations,
			dkLen: 32,
		},
	);
	return constantTimeEqual(hash, base64ToBytes(verifier.hash));
}

export interface LockoutState {
	failedAttempts: number;
	lockedUntil: number | null;
}

export const INITIAL_LOCKOUT: LockoutState = {
	failedAttempts: 0,
	lockedUntil: null,
};

const FREE_ATTEMPTS = 5;
const LOCKOUT_STEPS_SECONDS = [30, 60, 300, 900, 3600];

export function registerFailedAttempt(
	state: LockoutState,
	nowMs: number,
): LockoutState {
	const failedAttempts = state.failedAttempts + 1;
	if (failedAttempts < FREE_ATTEMPTS)
		return { failedAttempts, lockedUntil: null };
	const step = Math.min(
		failedAttempts - FREE_ATTEMPTS,
		LOCKOUT_STEPS_SECONDS.length - 1,
	);
	return {
		failedAttempts,
		lockedUntil: nowMs + LOCKOUT_STEPS_SECONDS[step] * 1000,
	};
}

export function remainingLockoutMs(state: LockoutState, nowMs: number): number {
	return state.lockedUntil === null
		? 0
		: Math.max(0, state.lockedUntil - nowMs);
}
