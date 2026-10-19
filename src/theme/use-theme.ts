import { useColorScheme } from 'react-native';

import { useSession } from '@/features/session/session-store';

import { cachedAppearance } from './native-appearance';

import {
	darkColors,
	lightColors,
	layout,
	motion,
	radii,
	spacing,
	typography,
	type ColorTokens,
} from './tokens';

export interface Theme {
	dark: boolean;
	colors: ColorTokens;
	spacing: typeof spacing;
	radii: typeof radii;
	typography: typeof typography;
	layout: typeof layout;
	motion: typeof motion;
}

const lightTheme: Theme = {
	dark: false,
	colors: lightColors,
	spacing,
	radii,
	typography,
	layout,
	motion,
};
const darkTheme: Theme = {
	dark: true,
	colors: darkColors,
	spacing,
	radii,
	typography,
	layout,
	motion,
};

export function useTheme(): Theme {
	const system = useColorScheme();
	const stored = useSession((state) => state.settings?.appearance ?? null);
	const preference = stored ?? cachedAppearance ?? 'system';
	const dark =
		preference === 'system' ? system === 'dark' : preference === 'dark';
	return dark ? darkTheme : lightTheme;
}
