import { gcm } from '@noble/ciphers/aes.js';

import { concatBytes, constantTimeEqual, utf8Encode } from './bytes';

const MAGIC = utf8Encode('PWR1');
const NONCE_LENGTH = 12;
export const RECEIPT_KEY_LENGTH = 32;

export class ReceiptCipherError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ReceiptCipherError';
	}
}

function assertKey(key: Uint8Array): void {
	if (key.length !== RECEIPT_KEY_LENGTH)
		throw new ReceiptCipherError('Receipt key must be 32 bytes');
}

export function encryptReceipt(
	key: Uint8Array,
	plaintext: Uint8Array,
	nonce: Uint8Array,
	fileName: string,
): Uint8Array {
	assertKey(key);
	if (nonce.length !== NONCE_LENGTH)
		throw new ReceiptCipherError('Receipt nonce must be 12 bytes');
	const sealed = gcm(key, nonce, utf8Encode(fileName)).encrypt(plaintext);
	return concatBytes(MAGIC, nonce, sealed);
}

export function isEncryptedReceipt(bytes: Uint8Array): boolean {
	return (
		bytes.length > MAGIC.length + NONCE_LENGTH &&
		constantTimeEqual(bytes.subarray(0, MAGIC.length), MAGIC)
	);
}

export function decryptReceipt(
	key: Uint8Array,
	sealed: Uint8Array,
	fileName: string,
): Uint8Array {
	assertKey(key);
	if (!isEncryptedReceipt(sealed))
		throw new ReceiptCipherError('Not an encrypted receipt');
	const nonce = sealed.subarray(MAGIC.length, MAGIC.length + NONCE_LENGTH);
	const body = sealed.subarray(MAGIC.length + NONCE_LENGTH);
	try {
		return gcm(key, nonce, utf8Encode(fileName)).decrypt(body);
	} catch {
		throw new ReceiptCipherError('Receipt could not be decrypted');
	}
}
