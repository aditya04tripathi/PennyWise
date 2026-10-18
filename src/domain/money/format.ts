import { currencyExponent, findCurrency } from './currency';
import { minorToDecimalString, type MinorUnits } from './money';

export interface FormatMoneyOptions {
	locale?: string;
	signDisplay?: 'auto' | 'always' | 'exceptZero';
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function formatterFor(
	currencyCode: string,
	exponent: number,
	options: FormatMoneyOptions,
) {
	const key = `${options.locale ?? 'default'}|${currencyCode}|${options.signDisplay ?? 'auto'}`;
	let formatter = formatterCache.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(options.locale, {
			style: 'currency',
			currency: currencyCode,
			minimumFractionDigits: exponent,
			maximumFractionDigits: exponent,
			signDisplay: options.signDisplay ?? 'auto',
		});
		formatterCache.set(key, formatter);
	}
	return formatter;
}

export function formatMoney(
	minor: MinorUnits,
	currencyCode: string,
	options: FormatMoneyOptions = {},
): string {
	const exponent = findCurrency(currencyCode)
		? currencyExponent(currencyCode)
		: 2;
	const decimal = minorToDecimalString(minor, exponent);
	return formatterFor(currencyCode, exponent, options).format(
		Number(decimal),
	);
}

export function formatMoneyInput(
	minor: MinorUnits,
	currencyCode: string,
): string {
	return minorToDecimalString(minor, currencyExponent(currencyCode));
}
