import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

import { utf8Decode, utf8Encode } from '@/lib/crypto/bytes';

const LEGACY_HEADER = utf8Encode('ENC');
const LEGACY_SALT_TEXT =
	'8d9e01fe98b12e705fb137d91ebea847f9b311ed070f29346dbd11c46bc440a3fd31f7c7de6e6a99fc2a111b746ef2a76d4ba9878af6b07df6a456c2726a8c58';
const LEGACY_ITERATIONS = 60_000;
const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;

export class LegacyBackupDecryptionError extends Error {
	constructor(readonly reason: 'wrong-password-or-corrupt' | 'truncated') {
		super(
			reason === 'truncated'
				? 'The backup file is incomplete.'
				: 'The password is incorrect or the backup file is damaged.',
		);
		this.name = 'LegacyBackupDecryptionError';
	}
}

export function isLegacyEncryptedBackup(bytes: Uint8Array): boolean {
	return LEGACY_HEADER.every((byte, index) => bytes[index] === byte);
}

export async function deriveLegacyBackupKey(
	password: string,
): Promise<Uint8Array> {
	return pbkdf2Async(
		sha256,
		utf8Encode(password),
		utf8Encode(LEGACY_SALT_TEXT),
		{
			c: LEGACY_ITERATIONS,
			dkLen: 32,
		},
	);
}

export async function decryptLegacyBackup(
	bytes: Uint8Array,
	password: string,
): Promise<string> {
	const body = bytes.subarray(LEGACY_HEADER.length);
	if (body.length < NONCE_LENGTH + TAG_LENGTH) {
		throw new LegacyBackupDecryptionError('truncated');
	}
	const nonce = body.subarray(0, NONCE_LENGTH);
	const sealed = body.subarray(NONCE_LENGTH);
	const key = await deriveLegacyBackupKey(password);
	try {
		return utf8Decode(gcm(key, nonce).decrypt(sealed));
	} catch {
		throw new LegacyBackupDecryptionError('wrong-password-or-corrupt');
	}
}
