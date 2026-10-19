import {
	DatabaseOpenError,
	destroyLocalDatabase,
	legacyDatabaseExists,
	openEncryptedDatabase,
	type DatabaseOpenFailure,
} from '@/data/database/open-encrypted-database';
import type { SqlDatabase } from '@/data/database/sql-database';
import { loadSettings } from '@/data/repositories/settings-repository';
import type { UserSettings } from '@/domain/entities';

import { ensureDefaultCategories } from '../catalog/catalog-service';
import { removeDevelopmentSeed } from './remove-development-seed';
import {
	loadCachedEntitlement,
	syncEntitlementWithStore,
} from '../pro/purchase-service';
import {
	deleteAllReceipts,
	encryptPlaintextReceipts,
} from '../receipts/receipt-files';
import {
	clearSecurity,
	loadSecurityConfiguration,
	type SecurityConfiguration,
} from '../security/app-security';
import { isDiscardableDatabaseFailure } from './discard-existing-data';
import { useSession } from './session-store';

type PreviousDataNotice = 'fresh-start' | 'legacy-removed';

interface OpenedSession {
	database: SqlDatabase;
	encrypted: boolean;
	settings: UserSettings;
	security: SecurityConfiguration;
}

function failureOf(error: unknown): DatabaseOpenFailure {
	return error instanceof DatabaseOpenError ? error.failure : 'unknown';
}

function noticeFor(ignoredPreviousData: boolean): PreviousDataNotice | null {
	return ignoredPreviousData ? 'fresh-start' : null;
}

async function discardStoredData(): Promise<void> {
	const { database } = useSession.getState();
	await database?.close().catch(() => undefined);
	await destroyLocalDatabase().catch(() => undefined);
	await deleteAllReceipts().catch(() => undefined);
	await clearSecurity().catch(() => undefined);
}

async function readSession(): Promise<OpenedSession> {
	const { database, encrypted } = await openEncryptedDatabase();
	const [settings, security] = await Promise.all([
		loadSettings(database),
		loadSecurityConfiguration(),
	]);
	return { database, encrypted, settings, security };
}

async function publishSession(
	opened: OpenedSession,
	notice: PreviousDataNotice | null,
): Promise<void> {
	await removeDevelopmentSeed(opened.database);
	const settings = await loadSettings(opened.database);
	useSession
		.getState()
		.setReady(
			opened.database,
			opened.encrypted,
			settings,
			opened.security,
			notice,
		);
	await ensureDefaultCategories();
	await encryptPlaintextReceipts().catch(() => 0);
	await loadCachedEntitlement();
	syncEntitlementWithStore().catch(() => undefined);
}

function traceBootstrap(step: string, error: unknown): void {
	const cause = error instanceof DatabaseOpenError ? error.cause : undefined;
	console.log(`[pennywise] bootstrap ${step}`, {
		failure: failureOf(error),
		message: error instanceof Error ? error.message : String(error),
		cause:
			cause instanceof Error
				? { name: cause.name, message: cause.message }
				: cause,
	});
}

let pendingBootstrap: Promise<void> | null = null;

export function bootstrapSession(): Promise<void> {
	if (pendingBootstrap) return pendingBootstrap;
	pendingBootstrap = runBootstrap().finally(() => {
		pendingBootstrap = null;
	});
	return pendingBootstrap;
}

async function runBootstrap(): Promise<void> {
	const session = useSession.getState();
	console.log('[pennywise] bootstrap start');
	const ignoredPreviousData = legacyDatabaseExists();
	console.log('[pennywise] legacy database present', ignoredPreviousData);
	let opened: OpenedSession;
	try {
		opened = await readSession();
		console.log('[pennywise] session read ok');
	} catch (error) {
		traceBootstrap('read failed', error);
		if (!isDiscardableDatabaseFailure(failureOf(error))) {
			session.setFailed(failureOf(error));
			return;
		}
		console.log('[pennywise] discarding stored data and retrying');
		await discardStoredData();
		try {
			await publishSession(await readSession(), 'fresh-start');
			console.log('[pennywise] retry ok');
		} catch (retryError) {
			traceBootstrap('retry failed', retryError);
			session.notePreviousDataRemoved('fresh-start');
			session.setFailed(failureOf(retryError));
		}
		return;
	}
	try {
		await publishSession(opened, noticeFor(ignoredPreviousData));
	} catch (error) {
		session.setFailed(failureOf(error));
	}
}

export async function eraseAllLocalData(): Promise<void> {
	const { reset } = useSession.getState();
	await discardStoredData();
	reset();
	await bootstrapSession();
}
