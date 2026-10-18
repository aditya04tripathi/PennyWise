import { formatMoney } from '@/domain/money/format';
import {
	addMinor,
	divideMinorRounded,
	InvalidAmountError,
	legacyDoubleToMinor,
	minorToDecimalString,
	MoneyOverflowError,
	parseDecimalToMinor,
} from '@/domain/money/money';

describe('parseDecimalToMinor', () => {
	it.each([
		['12.34', 2, 1234],
		['12', 2, 1200],
		['.5', 2, 50],
		['0.1', 2, 10],
		['1,234.56', 2, 123456],
		['1500', 0, 1500],
		['1.234', 3, 1234],
		['-7.25', 2, -725],
	])('parses %s with exponent %d', (input, exponent, expected) => {
		expect(parseDecimalToMinor(input, exponent)).toEqual({
			minor: expected,
			wasRounded: false,
		});
	});

	it('rounds half to even and reports rounding', () => {
		expect(parseDecimalToMinor('12.345', 2)).toEqual({
			minor: 1234,
			wasRounded: true,
		});
		expect(parseDecimalToMinor('12.355', 2)).toEqual({
			minor: 1236,
			wasRounded: true,
		});
		expect(parseDecimalToMinor('12.3451', 2)).toEqual({
			minor: 1235,
			wasRounded: true,
		});
		expect(parseDecimalToMinor('99.5', 0)).toEqual({
			minor: 100,
			wasRounded: true,
		});
	});

	it('rejects malformed input', () => {
		expect(() => parseDecimalToMinor('', 2)).toThrow(InvalidAmountError);
		expect(() => parseDecimalToMinor('abc', 2)).toThrow(InvalidAmountError);
		expect(() => parseDecimalToMinor('1.2.3', 2)).toThrow(
			InvalidAmountError,
		);
	});

	it('protects against overflow', () => {
		expect(() => parseDecimalToMinor('999999999999999999', 2)).toThrow(
			MoneyOverflowError,
		);
	});
});

describe('legacyDoubleToMinor', () => {
	it('converts Dart doubles exactly via their shortest representation', () => {
		expect(legacyDoubleToMinor(0.1, 2).minor).toBe(10);
		expect(legacyDoubleToMinor(99.99, 2).minor).toBe(9999);
		expect(legacyDoubleToMinor(1e-7, 2)).toEqual({
			minor: 0,
			wasRounded: true,
		});
		expect(() => legacyDoubleToMinor(1e21, 0)).toThrow(MoneyOverflowError);
		expect(() => legacyDoubleToMinor(Number.NaN, 2)).toThrow(
			InvalidAmountError,
		);
	});

	it('avoids floating point drift that the legacy app accumulated', () => {
		expect(0.1 + 0.2).not.toBe(0.3);
		expect(
			addMinor(
				legacyDoubleToMinor(0.1, 2).minor,
				legacyDoubleToMinor(0.2, 2).minor,
			),
		).toBe(30);
	});
});

describe('arithmetic helpers', () => {
	it('formats decimals for each exponent', () => {
		expect(minorToDecimalString(5, 2)).toBe('0.05');
		expect(minorToDecimalString(-1234, 2)).toBe('-12.34');
		expect(minorToDecimalString(1500, 0)).toBe('1500');
		expect(minorToDecimalString(1234, 3)).toBe('1.234');
	});

	it('divides with banker rounding', () => {
		expect(divideMinorRounded(1000, 3)).toBe(333);
		expect(divideMinorRounded(5, 2)).toBe(2);
		expect(divideMinorRounded(7, 2)).toBe(4);
		expect(divideMinorRounded(-7, 2)).toBe(-4);
	});

	it('throws when sums exceed the safe range', () => {
		expect(() => addMinor(Number.MAX_SAFE_INTEGER, 1)).toThrow(
			MoneyOverflowError,
		);
	});
});

describe('formatMoney', () => {
	it('uses the currency precision', () => {
		expect(formatMoney(123456, 'USD', { locale: 'en-US' })).toBe(
			'$1,234.56',
		);
		expect(formatMoney(1500, 'JPY', { locale: 'en-US' })).toBe('¥1,500');
		expect(formatMoney(1234, 'KWD', { locale: 'en-US' })).toMatch(
			/^KWD\s1\.234$/,
		);
	});
});
