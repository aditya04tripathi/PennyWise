import { Platform } from 'react-native';

export interface ColorTokens {
	background: string;
	surface: string;
	surfaceElevated: string;
	textPrimary: string;
	textSecondary: string;
	textTertiary: string;
	textOnBrand: string;
	brandPrimary: string;
	brandPressed: string;
	brandSoft: string;
	positive: string;
	negative: string;
	negativeSoft: string;
	warning: string;
	warningSoft: string;
	border: string;
	divider: string;
	overlay: string;
}

export const lightColors: ColorTokens = {
	background: '#F7F8FA',
	surface: '#FFFFFF',
	surfaceElevated: '#F0F3F5',
	textPrimary: '#151A21',
	textSecondary: '#5E6875',
	textTertiary: '#7A848F',
	textOnBrand: '#FFFFFF',
	brandPrimary: '#176B57',
	brandPressed: '#115545',
	brandSoft: '#E7F4EF',
	positive: '#13775C',
	negative: '#B8434B',
	negativeSoft: '#FBECEC',
	warning: '#8F5B14',
	warningSoft: '#FBF1E1',
	border: '#E1E5EA',
	divider: '#EDF0F2',
	overlay: 'rgba(13, 17, 23, 0.45)',
};

export const darkColors: ColorTokens = {
	background: '#0D1117',
	surface: '#171D25',
	surfaceElevated: '#202833',
	textPrimary: '#F4F6F8',
	textSecondary: '#A3ADBA',
	textTertiary: '#8591A2',
	textOnBrand: '#06241C',
	brandPrimary: '#57C5A4',
	brandPressed: '#47AE8F',
	brandSoft: '#183B34',
	positive: '#62D2AA',
	negative: '#F18D95',
	negativeSoft: '#3A2226',
	warning: '#E7BB73',
	warningSoft: '#3A2F1C',
	border: '#2C3541',
	divider: '#262F39',
	overlay: 'rgba(0, 0, 0, 0.6)',
};

export const spacing = {
	xxs: 4,
	xs: 8,
	sm: 12,
	md: 16,
	lg: 20,
	xl: 24,
	xxl: 32,
	xxxl: 40,
	huge: 48,
} as const;

export const radii = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 22,
	pill: 999,
} as const;

export const layout = {
	screenPadding: spacing.lg,
	minTouchTarget: Platform.OS === 'android' ? 48 : 44,
	rowHeight: 52,
} as const;

export const typography = {
	displayXL: {
		fontSize: 40,
		lineHeight: 46,
		fontWeight: '700',
		letterSpacing: -0.8,
	},
	display: {
		fontSize: 32,
		lineHeight: 38,
		fontWeight: '700',
		letterSpacing: -0.6,
	},
	heading1: {
		fontSize: 26,
		lineHeight: 32,
		fontWeight: '700',
		letterSpacing: -0.4,
	},
	heading2: {
		fontSize: 20,
		lineHeight: 26,
		fontWeight: '600',
		letterSpacing: -0.2,
	},
	heading3: {
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '600',
		letterSpacing: 0,
	},
	bodyLarge: {
		fontSize: 17,
		lineHeight: 24,
		fontWeight: '400',
		letterSpacing: 0,
	},
	body: { fontSize: 15, lineHeight: 21, fontWeight: '400', letterSpacing: 0 },
	bodySmall: {
		fontSize: 13,
		lineHeight: 18,
		fontWeight: '400',
		letterSpacing: 0,
	},
	label: {
		fontSize: 13,
		lineHeight: 16,
		fontWeight: '600',
		letterSpacing: 0.2,
	},
	caption: {
		fontSize: 12,
		lineHeight: 16,
		fontWeight: '500',
		letterSpacing: 0.2,
	},
} as const;

export type TypographyVariant = keyof typeof typography;

export const motion = {
	quick: 150,
	standard: 220,
	emphasized: 320,
} as const;
