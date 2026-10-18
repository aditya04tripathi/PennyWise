export interface CurrencyDefinition {
	code: string;
	name: string;
	exponent: number;
}

const CURRENCIES: readonly CurrencyDefinition[] = [
	{ code: 'USD', name: 'US Dollar', exponent: 2 },
	{ code: 'EUR', name: 'Euro', exponent: 2 },
	{ code: 'GBP', name: 'British Pound', exponent: 2 },
	{ code: 'INR', name: 'Indian Rupee', exponent: 2 },
	{ code: 'JPY', name: 'Japanese Yen', exponent: 0 },
	{ code: 'AUD', name: 'Australian Dollar', exponent: 2 },
	{ code: 'CAD', name: 'Canadian Dollar', exponent: 2 },
	{ code: 'NZD', name: 'New Zealand Dollar', exponent: 2 },
	{ code: 'SGD', name: 'Singapore Dollar', exponent: 2 },
	{ code: 'CHF', name: 'Swiss Franc', exponent: 2 },
	{ code: 'KRW', name: 'South Korean Won', exponent: 0 },
	{ code: 'KWD', name: 'Kuwaiti Dinar', exponent: 3 },
	{ code: 'BHD', name: 'Bahraini Dinar', exponent: 3 },
];

export const LEGACY_CURRENCY_CODES = [
	'USD',
	'EUR',
	'GBP',
	'INR',
	'JPY',
	'AUD',
	'CAD',
] as const;

export function listCurrencies(): readonly CurrencyDefinition[] {
	return CURRENCIES;
}

export function findCurrency(code: string): CurrencyDefinition | undefined {
	return CURRENCIES.find((currency) => currency.code === code.toUpperCase());
}

export function currencyExponent(code: string): number {
	const currency = findCurrency(code);
	if (!currency) {
		throw new UnknownCurrencyError(code);
	}
	return currency.exponent;
}

export class UnknownCurrencyError extends Error {
	constructor(readonly code: string) {
		super(`Unsupported currency: ${code}`);
		this.name = 'UnknownCurrencyError';
	}
}
