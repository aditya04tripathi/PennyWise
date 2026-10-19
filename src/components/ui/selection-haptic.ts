import * as Haptics from 'expo-haptics';

export function selectionHaptic(): void {
	if (process.env.EXPO_OS !== 'ios') return;
	Haptics.selectionAsync().catch(() => undefined);
}
