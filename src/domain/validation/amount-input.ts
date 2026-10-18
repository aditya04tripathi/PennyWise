import {
	InvalidAmountError,
	MoneyOverflowError,
	parseDecimalToMinor,
	type MinorUnits,
} from '../money/money';

export type AmountInputRule = 'positive' | 'signed';

export interface AmountInputResult {
	minor: MinorUnits | null;
	error?: string;
}

export function parseAmountInput(
	text: string,
	exponent: number,
	rule: AmountInputRule = 'positive',
): AmountInputResult {
	if (!text.trim()) return { minor: null };
	try {
		const parsed = parseDecimalToMinor(text, exponent);
		if (parsed.wasRounded)
			return {
				minor: null,
				error: `Use at most ${exponent} decimal places`,
			};
		if (rule === 'positive' && parsed.minor <= 0)
			return { minor: null, error: 'Enter an amount greater than zero' };
		return { minor: parsed.minor };
	} catch (error) {
		if (error instanceof MoneyOverflowError)
			return { minor: null, error: 'Amount is too large' };
		if (error instanceof InvalidAmountError)
			return { minor: null, error: 'Enter a valid amount' };
		throw error;
	}
}
