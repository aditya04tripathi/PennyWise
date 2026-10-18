import { create } from 'zustand';

import type { DatabaseOpenFailure } from '@/data/database/open-encrypted-database';
import type { SqlDatabase } from '@/data/database/sql-database';
import type { UserSettings } from '@/domain/entities';
import type { SecurityConfiguration } from '@/features/security/app-security';

export type BootState =
	| { kind: 'booting' }
	| { kind: 'failed'; failure: DatabaseOpenFailure }
	| { kind: 'ready' };

interface SessionState {
	boot: BootState;
	database: SqlDatabase | null;
	encrypted: boolean;
	settings: UserSettings | null;
	security: SecurityConfiguration;
	unlocked: boolean;
	dataVersion: number;
	backgroundedAt: number | null;
	setReady(
		database: SqlDatabase,
		encrypted: boolean,
		settings: UserSettings,
		security: SecurityConfiguration,
	): void;
	setFailed(failure: DatabaseOpenFailure): void;
	setSettings(settings: UserSettings): void;
	setSecurity(security: SecurityConfiguration): void;
	unlock(): void;
	lock(): void;
	markBackgrounded(at: number | null): void;
	notifyDataChanged(): void;
	reset(): void;
}

export const useSession = create<SessionState>((set) => ({
	boot: { kind: 'booting' },
	database: null,
	encrypted: false,
	settings: null,
	security: { pinEnabled: false, biometricEnabled: false },
	unlocked: false,
	dataVersion: 0,
	backgroundedAt: null,
	setReady: (database, encrypted, settings, security) =>
		set({
			boot: { kind: 'ready' },
			database,
			encrypted,
			settings,
			security,
			unlocked: !security.pinEnabled && !security.biometricEnabled,
		}),
	setFailed: (failure) => set({ boot: { kind: 'failed', failure } }),
	setSettings: (settings) => set({ settings }),
	setSecurity: (security) => set({ security }),
	unlock: () => set({ unlocked: true, backgroundedAt: null }),
	lock: () =>
		set((state) => ({
			unlocked: !(
				state.security.pinEnabled || state.security.biometricEnabled
			),
		})),
	markBackgrounded: (at) => set({ backgroundedAt: at }),
	notifyDataChanged: () =>
		set((state) => ({ dataVersion: state.dataVersion + 1 })),
	reset: () =>
		set({
			boot: { kind: 'booting' },
			database: null,
			settings: null,
			security: { pinEnabled: false, biometricEnabled: false },
			unlocked: false,
			dataVersion: 0,
		}),
}));

export function requireDatabase(): SqlDatabase {
	const database = useSession.getState().database;
	if (!database) throw new Error('Database is not ready');
	return database;
}
