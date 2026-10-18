import type {
	CardNetwork,
	CategoryIcon,
	RecurringFrequency,
	TransactionType,
} from '@/domain/entities';

const ICON_BY_MATERIAL_CODEPOINT: Readonly<Record<number, CategoryIcon>> = {
	0xe527: 'food',
	0xe1d1: 'transport',
	0xe59c: 'shopping',
	0xe040: 'income',
	0xe318: 'housing',
	0xef37: 'tag',
	0xf37d: 'shopping',
	0xf316: 'food',
	0xefc6: 'transport',
	0xf107: 'housing',
	0xf06ec: 'utilities',
	0xf1f5: 'entertainment',
	0xf07a: 'fitness',
	0xf1be: 'health',
	0xf33c: 'education',
	0xf085: 'travel',
	0xf285: 'pets',
	0xef2d: 'gifts',
};

export function iconForLegacyCodepoint(codepoint: number): CategoryIcon | null {
	return ICON_BY_MATERIAL_CODEPOINT[codepoint] ?? null;
}

export function argbToHex(argb: number): string {
	const rgb = (argb >>> 0) & 0xffffff;
	return `#${rgb.toString(16).padStart(6, '0').toUpperCase()}`;
}

export const LEGACY_TRANSACTION_TYPES: readonly TransactionType[] = [
	'income',
	'expense',
];
export const LEGACY_FREQUENCIES: readonly RecurringFrequency[] = [
	'daily',
	'weekly',
	'monthly',
	'yearly',
];
export const LEGACY_CARD_NETWORKS: readonly CardNetwork[] = [
	'visa',
	'mastercard',
	'amex',
	'discover',
	'other',
];
