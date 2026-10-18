import { useColorScheme } from 'react-native';

import { useSession } from '@/features/session/session-store';

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
	const preference = useSession(
		(state) => state.settings?.appearance ?? 'system',
	);
	const dark =
		preference === 'system' ? system === 'dark' : preference === 'dark';
	return dark ? darkTheme : lightTheme;
}
