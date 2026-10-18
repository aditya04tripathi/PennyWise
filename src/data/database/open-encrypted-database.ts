import { File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { bytesToHex } from '@/lib/crypto/bytes';
import { secureRandomBytes } from '@/lib/crypto/random';

import { wrapExpoDatabase } from './expo-database';
import { migrateDatabase } from './migrations';
import type { SqlDatabase } from './sql-database';

export const DATABASE_NAME = 'pennywise.db';
const KEY_STORAGE_NAME = 'pennywise.database-key.v1';
const KEY_PATTERN = /^[0-9a-f]{64}$/;

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
	keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export type DatabaseOpenFailure =
	| 'encryption-unavailable'
	| 'key-unavailable'
	| 'key-mismatch'
	| 'migration-failed'
	| 'unknown';

export class DatabaseOpenError extends Error {
	constructor(
		readonly failure: DatabaseOpenFailure,
		cause?: unknown,
	) {
		super(`Database could not be opened: ${failure}`);
		this.name = 'DatabaseOpenError';
		this.cause = cause;
	}
}

export interface OpenedDatabase {
	database: SqlDatabase;
	encrypted: boolean;
	cipherVersion: string | null;
}

function databaseFileExists(): boolean {
	return new File(SQLite.defaultDatabaseDirectory, DATABASE_NAME).exists;
}

async function loadOrCreateKey(): Promise<string> {
	let existing: string | null;
	try {
		existing = await SecureStore.getItemAsync(
			KEY_STORAGE_NAME,
			SECURE_STORE_OPTIONS,
		);
	} catch (error) {
		throw new DatabaseOpenError('key-unavailable', error);
	}
	if (existing && KEY_PATTERN.test(existing)) return existing;
	if (databaseFileExists()) throw new DatabaseOpenError('key-unavailable');
	const created = bytesToHex(secureRandomBytes(32));
	await SecureStore.setItemAsync(
		KEY_STORAGE_NAME,
		created,
		SECURE_STORE_OPTIONS,
	);
	return created;
}

function plaintextAllowedForDevelopment(): boolean {
	return (
		__DEV__ && process.env.EXPO_PUBLIC_ALLOW_PLAINTEXT_DEV_DATABASE === '1'
	);
}

export async function openEncryptedDatabase(): Promise<OpenedDatabase> {
	const native = await SQLite.openDatabaseAsync(DATABASE_NAME);
	const cipher = await native
		.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version;')
		.catch(() => null);
	const cipherVersion = cipher?.cipher_version ?? null;

	if (!cipherVersion && !plaintextAllowedForDevelopment()) {
		await native.closeAsync();
		throw new DatabaseOpenError('encryption-unavailable');
	}

	if (cipherVersion) {
		const key = await loadOrCreateKey();
		await native.execAsync(`PRAGMA key = "x'${key}'";`);
		try {
			await native.getFirstAsync(
				'SELECT count(*) AS total FROM sqlite_master;',
			);
		} catch (error) {
			await native.closeAsync();
			throw new DatabaseOpenError('key-mismatch', error);
		}
	}

	const database = wrapExpoDatabase(native);
	try {
		await migrateDatabase(database);
	} catch (error) {
		await database.close();
		throw new DatabaseOpenError('migration-failed', error);
	}
	return { database, encrypted: cipherVersion !== null, cipherVersion };
}

export async function destroyLocalDatabase(): Promise<void> {
	await SQLite.deleteDatabaseAsync(DATABASE_NAME).catch(() => undefined);
	await SecureStore.deleteItemAsync(KEY_STORAGE_NAME, SECURE_STORE_OPTIONS);
}
