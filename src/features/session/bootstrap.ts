import {
	DatabaseOpenError,
	destroyLocalDatabase,
	openEncryptedDatabase,
} from '@/data/database/open-encrypted-database';
import { loadSettings } from '@/data/repositories/settings-repository';

import { ensureDefaultCategories } from '../catalog/catalog-service';
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
} from '../security/app-security';
import { useSession } from './session-store';

export async function bootstrapSession(): Promise<void> {
	const session = useSession.getState();
	try {
		const { database, encrypted } = await openEncryptedDatabase();
		const [settings, security] = await Promise.all([
			loadSettings(database),
			loadSecurityConfiguration(),
		]);
		session.setReady(database, encrypted, settings, security);
		await ensureDefaultCategories();
		await encryptPlaintextReceipts().catch(() => 0);
		await loadCachedEntitlement();
		syncEntitlementWithStore().catch(() => undefined);
	} catch (error) {
		session.setFailed(
			error instanceof DatabaseOpenError ? error.failure : 'unknown',
		);
	}
}

export async function eraseAllLocalData(): Promise<void> {
	const { database, reset } = useSession.getState();
	await database?.close().catch(() => undefined);
	reset();
	await destroyLocalDatabase();
	await deleteAllReceipts();
	await clearSecurity();
	await bootstrapSession();
}
