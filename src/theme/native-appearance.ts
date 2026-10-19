import { Appearance, Platform, Settings } from 'react-native';

import type { AppearancePreference } from '@/domain/entities';

const STORAGE_KEY = 'pennywise.appearance';

function isAppearance(value: unknown): value is AppearancePreference {
	return value === 'system' || value === 'light' || value === 'dark';
}

function readCachedAppearance(): AppearancePreference | null {
	if (Platform.OS !== 'ios') return null;
	const value = Settings.get(STORAGE_KEY);
	return isAppearance(value) ? value : null;
}

function nativeScheme(
	preference: AppearancePreference,
): 'light' | 'dark' | 'unspecified' {
	return preference === 'system' ? 'unspecified' : preference;
}

export const cachedAppearance = readCachedAppearance();

let applied: AppearancePreference | null = null;

export function applyNativeAppearance(preference: AppearancePreference): void {
	if (Platform.OS === 'ios' && Settings.get(STORAGE_KEY) !== preference) {
		Settings.set({ [STORAGE_KEY]: preference });
	}
	if (applied === preference) return;
	applied = preference;
	Appearance.setColorScheme(nativeScheme(preference));
}

if (cachedAppearance) {
	applied = cachedAppearance;
	Appearance.setColorScheme(nativeScheme(cachedAppearance));
}
