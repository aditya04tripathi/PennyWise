import { parseAmountInput } from '@/domain/validation/amount-input';

describe('parseAmountInput', () => {
	it('treats empty input as no amount', () => {
		expect(parseAmountInput('  ', 2)).toEqual({ minor: null });
	});

	it('parses positive amounts into minor units', () => {
		expect(parseAmountInput('1,234.50', 2)).toEqual({ minor: 123450 });
		expect(parseAmountInput('500', 0)).toEqual({ minor: 500 });
	});

	it('rejects zero, negatives and extra precision for positive amounts', () => {
		expect(parseAmountInput('0', 2).error).toBe(
			'Enter an amount greater than zero',
		);
		expect(parseAmountInput('-5', 2).error).toBe(
			'Enter an amount greater than zero',
		);
		expect(parseAmountInput('1.005', 2).error).toBe(
			'Use at most 2 decimal places',
		);
		expect(parseAmountInput('abc', 2).error).toBe('Enter a valid amount');
	});

	it('allows zero and negative values for signed amounts', () => {
		expect(parseAmountInput('-250.75', 2, 'signed')).toEqual({
			minor: -25075,
		});
		expect(parseAmountInput('0', 2, 'signed')).toEqual({ minor: 0 });
	});
});
