import { Directory, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

import { listReferencedReceiptFiles } from '@/data/repositories/transaction-repository';
import type { SqlExecutor } from '@/data/database/sql-database';
import { base64ToBytes, bytesToBase64, bytesToHex } from '@/lib/crypto/bytes';
import {
	decryptReceipt,
	encryptReceipt,
	isEncryptedReceipt,
	RECEIPT_KEY_LENGTH,
} from '@/lib/crypto/receipt-cipher';
import { secureRandomBytes, secureRandomId } from '@/lib/crypto/random';

const RECEIPT_NAME = /^[A-Za-z0-9-]+\.(jpg|jpeg|png|heic)$/;
const ENCRYPTED_SUFFIX = '.enc';
const KEY_STORAGE_NAME = 'pennywise.receipt-key.v1';
const KEY_PATTERN = /^[0-9a-f]{64}$/;
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
	keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const MIME_TYPES: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	heic: 'image/heic',
};

export class ReceiptKeyUnavailableError extends Error {
	constructor() {
		super('The receipt encryption key is not available on this device.');
		this.name = 'ReceiptKeyUnavailableError';
	}
}

let cachedKey: Uint8Array | null = null;

function receiptDirectory(): Directory {
	const directory = new Directory(Paths.document, 'receipts');
	if (!directory.exists) directory.create({ intermediates: true });
	return directory;
}

function encryptedFile(fileName: string): File {
	return new File(receiptDirectory(), `${fileName}${ENCRYPTED_SUFFIX}`);
}

function plaintextFile(fileName: string): File {
	return new File(receiptDirectory(), fileName);
}

function storedFileNames(): string[] {
	return receiptDirectory()
		.list()
		.filter((entry): entry is File => entry instanceof File)
		.map((file) => file.name);
}

function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let index = 0; index < bytes.length; index += 1)
		bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
	return bytes;
}

async function receiptKey(): Promise<Uint8Array> {
	if (cachedKey) return cachedKey;
	const stored = await SecureStore.getItemAsync(
		KEY_STORAGE_NAME,
		SECURE_STORE_OPTIONS,
	);
	if (stored && KEY_PATTERN.test(stored)) {
		cachedKey = hexToBytes(stored);
		return cachedKey;
	}
	if (storedFileNames().some((name) => name.endsWith(ENCRYPTED_SUFFIX)))
		throw new ReceiptKeyUnavailableError();
	const created = secureRandomBytes(RECEIPT_KEY_LENGTH);
	await SecureStore.setItemAsync(
		KEY_STORAGE_NAME,
		bytesToHex(created),
		SECURE_STORE_OPTIONS,
	);
	cachedKey = created;
	return created;
}

async function writeEncrypted(
	fileName: string,
	plaintext: Uint8Array,
): Promise<void> {
	const sealed = encryptReceipt(
		await receiptKey(),
		plaintext,
		secureRandomBytes(12),
		fileName,
	);
	const file = encryptedFile(fileName);
	if (file.exists) file.delete();
	file.create();
	file.write(sealed);
}

async function readPlaintext(fileName: string): Promise<Uint8Array | null> {
	if (!RECEIPT_NAME.test(fileName)) return null;
	const encrypted = encryptedFile(fileName);
	if (encrypted.exists) {
		const sealed = await encrypted.bytes();
		return isEncryptedReceipt(sealed)
			? decryptReceipt(await receiptKey(), sealed, fileName)
			: null;
	}
	const legacy = plaintextFile(fileName);
	return legacy.exists ? legacy.bytes() : null;
}

function extensionOf(uri: string): string {
	const match = /\.(jpg|jpeg|png|heic)$/i.exec(uri.split('?')[0]);
	return match ? match[1].toLowerCase() : 'jpg';
}

export function receiptExists(fileName: string): boolean {
	if (!RECEIPT_NAME.test(fileName)) return false;
	return encryptedFile(fileName).exists || plaintextFile(fileName).exists;
}

export async function loadReceiptDataUri(
	fileName: string,
): Promise<string | null> {
	const plaintext = await readPlaintext(fileName);
	if (!plaintext) return null;
	const mime = MIME_TYPES[extensionOf(fileName)] ?? 'image/jpeg';
	return `data:${mime};base64,${bytesToBase64(plaintext)}`;
}

export async function storeReceipt(sourceUri: string): Promise<string> {
	const fileName = `${secureRandomId()}.${extensionOf(sourceUri)}`;
	await writeEncrypted(fileName, await new File(sourceUri).bytes());
	return fileName;
}

export async function readReceiptBase64(
	fileName: string,
): Promise<string | null> {
	const plaintext = await readPlaintext(fileName).catch(() => null);
	return plaintext ? bytesToBase64(plaintext) : null;
}

export async function writeReceiptBase64(
	fileName: string,
	base64: string,
): Promise<void> {
	if (!RECEIPT_NAME.test(fileName))
		throw new Error('Invalid receipt file name');
	await writeEncrypted(fileName, base64ToBytes(base64));
	const legacy = plaintextFile(fileName);
	if (legacy.exists) legacy.delete();
}

export async function encryptPlaintextReceipts(): Promise<number> {
	const plaintextNames = storedFileNames().filter((name) =>
		RECEIPT_NAME.test(name),
	);
	let migrated = 0;
	for (const name of plaintextNames) {
		const source = plaintextFile(name);
		if (!encryptedFile(name).exists)
			await writeEncrypted(name, await source.bytes());
		source.delete();
		migrated += 1;
	}
	return migrated;
}

function deleteStoredReceipt(fileName: string): void {
	for (const file of [encryptedFile(fileName), plaintextFile(fileName)])
		if (file.exists) file.delete();
}

function logicalName(storedName: string): string {
	return storedName.endsWith(ENCRYPTED_SUFFIX)
		? storedName.slice(0, -ENCRYPTED_SUFFIX.length)
		: storedName;
}

export async function deleteReceiptIfUnreferenced(
	db: SqlExecutor,
	fileName: string | null,
): Promise<void> {
	if (!fileName) return;
	const referenced = await listReferencedReceiptFiles(db);
	if (referenced.includes(fileName)) return;
	deleteStoredReceipt(fileName);
}

export async function findOrphanedReceipts(db: SqlExecutor): Promise<string[]> {
	const referenced = new Set(await listReferencedReceiptFiles(db));
	return [...new Set(storedFileNames().map(logicalName))].filter(
		(name) => !referenced.has(name),
	);
}

export async function findMissingReceipts(db: SqlExecutor): Promise<string[]> {
	const referenced = await listReferencedReceiptFiles(db);
	return referenced.filter((name) => !receiptExists(name));
}

export function deleteReceiptFiles(names: readonly string[]): void {
	for (const name of names) deleteStoredReceipt(name);
}

export async function deleteAllReceipts(): Promise<void> {
	const directory = new Directory(Paths.document, 'receipts');
	if (directory.exists) directory.delete();
	cachedKey = null;
	await SecureStore.deleteItemAsync(KEY_STORAGE_NAME, SECURE_STORE_OPTIONS);
}
