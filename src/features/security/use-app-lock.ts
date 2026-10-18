import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { shouldLockAfterBackground } from '@/domain/security/auto-lock';

import { useSession } from '../session/session-store';

let suspensions = 0;

export async function withAutoLockSuspended<T>(
	task: () => Promise<T>,
): Promise<T> {
	suspensions += 1;
	try {
		return await task();
	} finally {
		setTimeout(() => {
			suspensions -= 1;
		}, 1000);
	}
}

export function useAppLock(): { obscured: boolean } {
	const [appState, setAppState] = useState<AppStateStatus>(
		AppState.currentState,
	);
	const protectedApp = useSession(
		(state) => state.security.pinEnabled || state.security.biometricEnabled,
	);

	useEffect(() => {
		const subscription = AppState.addEventListener('change', (next) => {
			setAppState(next);
			const session = useSession.getState();
			if (next === 'background') {
				if (
					session.unlocked &&
					session.backgroundedAt === null &&
					suspensions === 0
				)
					session.markBackgrounded(Date.now());
			} else if (next === 'active') {
				const autoLock = session.settings?.autoLockSeconds ?? 0;
				if (
					shouldLockAfterBackground(
						session.backgroundedAt,
						Date.now(),
						autoLock,
					)
				)
					session.lock();
				session.markBackgrounded(null);
			}
		});
		return () => subscription.remove();
	}, []);

	useEffect(() => {
		if (process.env.EXPO_OS !== 'android') return;
		const action = protectedApp
			? ScreenCapture.preventScreenCaptureAsync('pennywise-lock')
			: ScreenCapture.allowScreenCaptureAsync('pennywise-lock');
		action.catch(() => undefined);
	}, [protectedApp]);

	return { obscured: protectedApp && appState !== 'active' };
}
