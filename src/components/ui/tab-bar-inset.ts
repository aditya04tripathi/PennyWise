import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const IOS_TAB_BAR_HEIGHT = 49;
const ANDROID_NAVIGATION_BAR_HEIGHT = 80;

export function tabBarInset(
	bottomSafeInset: number,
	os: 'ios' | 'android' = Platform.OS === 'android' ? 'android' : 'ios',
): number {
	const bar =
		os === 'android' ? ANDROID_NAVIGATION_BAR_HEIGHT : IOS_TAB_BAR_HEIGHT;
	return bar + bottomSafeInset;
}

export function useTabBarInset(): number {
	return tabBarInset(useSafeAreaInsets().bottom);
}
