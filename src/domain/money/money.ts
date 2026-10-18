export type MinorUnits = number;

export class MoneyOverflowError extends Error {
	constructor() {
		super('Amount exceeds the supported range');
		this.name = 'MoneyOverflowError';
	}
}

export class InvalidAmountError extends Error {
	constructor(readonly input: string) {
		super(`Invalid amount: ${input}`);
		this.name = 'InvalidAmountError';
	}
}

export interface ParsedAmount {
	minor: MinorUnits;
	wasRounded: boolean;
}

const DECIMAL_PATTERN = /^(-)?(\d*)(?:\.(\d*))?$/;

export function parseDecimalToMinor(
	input: string,
	exponent: number,
): ParsedAmount {
	const normalized = expandExponentNotation(input.trim().replace(/,/g, ''));
	const match = DECIMAL_PATTERN.exec(normalized);
	if (!match || (match[2] === '' && (match[3] ?? '') === '')) {
		throw new InvalidAmountError(input);
	}
	const [, sign, wholeDigits, fractionDigits = ''] = match;
	const kept = fractionDigits.slice(0, exponent).padEnd(exponent, '0');
	const dropped = fractionDigits.slice(exponent);

	let magnitude = BigInt((wholeDigits || '0') + kept);
	const wasRounded = /[1-9]/.test(dropped);
	if (wasRounded && shouldRoundUpHalfEven(dropped, magnitude)) {
		magnitude += 1n;
	}
	if (magnitude > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new MoneyOverflowError();
	}
	const minor = Number(magnitude);
	return { minor: sign && minor !== 0 ? -minor : minor, wasRounded };
}

function shouldRoundUpHalfEven(
	dropped: string,
	keptMagnitude: bigint,
): boolean {
	const first = Number(dropped[0]);
	if (first > 5) return true;
	if (first < 5) return false;
	if (/[1-9]/.test(dropped.slice(1))) return true;
	return keptMagnitude % 2n === 1n;
}

function expandExponentNotation(value: string): string {
	const match = /^(-)?(\d+)(?:\.(\d+))?e([+-]?\d+)$/i.exec(value);
	if (!match) return value;
	const [, sign = '', whole, fraction = '', exponentText] = match;
	const shift = Number(exponentText);
	const digits = whole + fraction;
	const pointIndex = whole.length + shift;
	if (pointIndex <= 0) return `${sign}0.${'0'.repeat(-pointIndex)}${digits}`;
	if (pointIndex >= digits.length)
		return `${sign}${digits}${'0'.repeat(pointIndex - digits.length)}`;
	return `${sign}${digits.slice(0, pointIndex)}.${digits.slice(pointIndex)}`;
}

export function legacyDoubleToMinor(
	amount: number,
	exponent: number,
): ParsedAmount {
	if (!Number.isFinite(amount)) {
		throw new InvalidAmountError(String(amount));
	}
	return parseDecimalToMinor(String(amount), exponent);
}

export function minorToDecimalString(
	minor: MinorUnits,
	exponent: number,
): string {
	assertSafe(minor);
	const negative = minor < 0;
	const digits = Math.abs(minor)
		.toString()
		.padStart(exponent + 1, '0');
	const whole = digits.slice(0, digits.length - exponent);
	const fraction =
		exponent > 0 ? `.${digits.slice(digits.length - exponent)}` : '';
	return `${negative ? '-' : ''}${whole}${fraction}`;
}

export function addMinor(...values: MinorUnits[]): MinorUnits {
	let total = 0n;
	for (const value of values) {
		assertSafe(value);
		total += BigInt(value);
	}
	if (
		total > BigInt(Number.MAX_SAFE_INTEGER) ||
		total < BigInt(Number.MIN_SAFE_INTEGER)
	) {
		throw new MoneyOverflowError();
	}
	return Number(total);
}

export function sumMinor(values: readonly MinorUnits[]): MinorUnits {
	return addMinor(...values);
}

export function divideMinorRounded(
	minor: MinorUnits,
	divisor: number,
): MinorUnits {
	if (!Number.isInteger(divisor) || divisor <= 0) {
		throw new RangeError('Divisor must be a positive integer');
	}
	assertSafe(minor);
	const value = BigInt(minor);
	const big = BigInt(divisor);
	const quotient = value / big;
	const remainder = value % big;
	const twiceRemainder = (remainder < 0n ? -remainder : remainder) * 2n;
	if (
		twiceRemainder > big ||
		(twiceRemainder === big && quotient % 2n !== 0n)
	) {
		return Number(quotient + (value < 0n ? -1n : 1n));
	}
	return Number(quotient);
}

export function percentageOf(part: MinorUnits, whole: MinorUnits): number {
	if (whole <= 0) return 0;
	return (part / whole) * 100;
}

function assertSafe(value: number): void {
	if (!Number.isSafeInteger(value)) {
		throw new MoneyOverflowError();
	}
}
