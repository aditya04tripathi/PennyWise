import * as ExpoCrypto from 'expo-crypto';

export function secureRandomBytes(length: number): Uint8Array {
	const webCrypto = (globalThis as { crypto?: Crypto }).crypto;
	if (webCrypto?.getRandomValues) {
		return webCrypto.getRandomValues(new Uint8Array(length));
	}
	return ExpoCrypto.getRandomBytes(length);
}

export function secureRandomId(): string {
	const webCrypto = (globalThis as { crypto?: Crypto }).crypto;
	if (webCrypto?.randomUUID) return webCrypto.randomUUID();
	return ExpoCrypto.randomUUID();
}
