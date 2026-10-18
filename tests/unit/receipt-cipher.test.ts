import { randomBytes } from 'node:crypto';

import { utf8Encode } from '@/lib/crypto/bytes';
import {
	decryptReceipt,
	encryptReceipt,
	isEncryptedReceipt,
	ReceiptCipherError,
} from '@/lib/crypto/receipt-cipher';

const key = new Uint8Array(randomBytes(32));
const nonce = new Uint8Array(randomBytes(12));
const image = utf8Encode('\u00ffJPEG fake receipt bytes');

describe('receipt cipher', () => {
	it('round trips and hides the plaintext', () => {
		const sealed = encryptReceipt(key, image, nonce, 'abc.jpg');
		expect(isEncryptedReceipt(sealed)).toBe(true);
		expect(Buffer.from(sealed).includes(Buffer.from('JPEG'))).toBe(false);
		expect(decryptReceipt(key, sealed, 'abc.jpg')).toEqual(image);
	});

	it('binds the ciphertext to its file name and key', () => {
		const sealed = encryptReceipt(key, image, nonce, 'abc.jpg');
		expect(() => decryptReceipt(key, sealed, 'other.jpg')).toThrow(
			ReceiptCipherError,
		);
		expect(() =>
			decryptReceipt(new Uint8Array(randomBytes(32)), sealed, 'abc.jpg'),
		).toThrow(ReceiptCipherError);
	});

	it('detects tampering and rejects plaintext files and bad keys', () => {
		const sealed = encryptReceipt(key, image, nonce, 'abc.jpg');
		sealed[sealed.length - 1] ^= 1;
		expect(() => decryptReceipt(key, sealed, 'abc.jpg')).toThrow(
			ReceiptCipherError,
		);
		expect(isEncryptedReceipt(image)).toBe(false);
		expect(() => decryptReceipt(key, image, 'abc.jpg')).toThrow(
			ReceiptCipherError,
		);
		expect(() =>
			encryptReceipt(new Uint8Array(16), image, nonce, 'abc.jpg'),
		).toThrow(ReceiptCipherError);
	});
});
