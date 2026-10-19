import { File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { bytesToHex } from '@/lib/crypto/bytes';
import { secureRandomBytes } from '@/lib/crypto/random';

import { databaseFileUri } from './database-file-uri';
import { wrapExpoDatabase } from './expo-database';
import { migrateDatabase } from './migrations';
import type { SqlDatabase } from './sql-database';

export const DATABASE_NAME = 'pennywise-v2.db';
const LEGACY_DATABASE_NAME = 'pennywise.db';
const KEY_STORAGE_NAME = 'pennywise.database-key.v2';
const KEY_PATTERN = /^[0-9a-f]{64}$/;

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
	keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export type DatabaseOpenFailure =
	| 'encryption-unavailable'
	| 'key-unavailable'
	| 'key-mismatch'
	| 'migration-failed'
	| 'unreadable'
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

function databaseFiles(): File[] {
	const directory = SQLite.defaultDatabaseDirectory;
	if (typeof directory !== 'string' || directory.length === 0) return [];
	return ['', '-wal', '-shm', '-journal'].map(
		(suffix) =>
			new File(databaseFileUri(directory, `${DATABASE_NAME}${suffix}`)),
	);
}

async function readStoredKey(): Promise<string | null> {
	try {
		const existing = await SecureStore.getItemAsync(
			KEY_STORAGE_NAME,
			SECURE_STORE_OPTIONS,
		);
		return existing && KEY_PATTERN.test(existing) ? existing : null;
	} catch (error) {
		throw new DatabaseOpenError('key-unavailable', error);
	}
}

async function createKey(): Promise<string> {
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

export function legacyDatabaseExists(): boolean {
	try {
		const directory = SQLite.defaultDatabaseDirectory;
		if (typeof directory !== 'string' || directory.length === 0)
			return false;
		return new File(databaseFileUri(directory, LEGACY_DATABASE_NAME))
			.exists;
	} catch {
		return false;
	}
}

function traceError(step: string, error: unknown): void {
	const cause =
		error instanceof DatabaseOpenError
			? error.cause
			: error instanceof Error
				? error
				: undefined;
	console.log(`[pennywise] ${step}`, {
		name: error instanceof Error ? error.name : typeof error,
		message: error instanceof Error ? error.message : String(error),
		failure: error instanceof DatabaseOpenError ? error.failure : undefined,
		cause:
			cause instanceof Error
				? { name: cause.name, message: cause.message }
				: cause,
	});
}

export async function openEncryptedDatabase(): Promise<OpenedDatabase> {
	console.log('[pennywise] opening', DATABASE_NAME);
	return openDatabase();
}

async function openDatabase(): Promise<OpenedDatabase> {
	console.log('[pennywise] sqlite open start');
	const native = await SQLite.openDatabaseAsync(DATABASE_NAME, {
		useNewConnection: true,
	});
	console.log('[pennywise] sqlite open ok');
	try {
		const storedKey = plaintextAllowedForDevelopment()
			? null
			: ((await readStoredKey()) ?? (await createKey()));
		console.log('[pennywise] encryption key', storedKey ? 'ready' : 'none');
		if (storedKey)
			await native.execAsync(`PRAGMA key = "x'${storedKey}'";`);

		let cipherVersion: string | null = null;
		try {
			const cipher = await native.getFirstAsync<{
				cipher_version: string;
			}>('PRAGMA cipher_version;');
			cipherVersion = cipher?.cipher_version ?? null;
			console.log('[pennywise] cipher_version', cipherVersion);
		} catch (error) {
			traceError('cipher_version failed', error);
			throw error;
		}
		if (!cipherVersion && !plaintextAllowedForDevelopment())
			throw new DatabaseOpenError('encryption-unavailable');

		try {
			await native.getFirstAsync(
				'SELECT count(*) AS total FROM sqlite_master;',
			);
			console.log('[pennywise] sqlite_master ok');
		} catch (error) {
			traceError('sqlite_master failed', error);
			throw new DatabaseOpenError('key-mismatch', error);
		}

		const database = wrapExpoDatabase(native);
		try {
			const version = await migrateDatabase(database);
			console.log('[pennywise] migrated', version);
		} catch (error) {
			traceError('migration failed', error);
			throw new DatabaseOpenError('migration-failed', error);
		}
		return {
			database,
			encrypted: cipherVersion !== null,
			cipherVersion,
		};
	} catch (error) {
		traceError('openDatabase failed', error);
		await native.closeAsync().catch(() => undefined);
		throw error;
	}
}

export async function destroyLocalDatabase(): Promise<void> {
	await SQLite.deleteDatabaseAsync(DATABASE_NAME).catch(() => undefined);
	for (const file of databaseFiles()) {
		try {
			if (file.exists) file.delete();
		} catch {
			continue;
		}
	}
	await SecureStore.deleteItemAsync(
		KEY_STORAGE_NAME,
		SECURE_STORE_OPTIONS,
	).catch(() => undefined);
}
