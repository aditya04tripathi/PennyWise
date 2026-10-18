import { normalizeIsoToLocalDateTime, InvalidDateError } from '@/domain/dates';
import {
	createPinVerifier,
	INITIAL_LOCKOUT,
	matchesPinVerifier,
	registerFailedAttempt,
	remainingLockoutMs,
} from '@/domain/security/pin';
import { validateTransactionDraft } from '@/domain/validation/transaction-draft';

describe('PIN verifier', () => {
	const salt = new Uint8Array(16).fill(7);

	it('never stores the PIN and verifies correctly', async () => {
		const verifier = await createPinVerifier('4821', salt);
		expect(JSON.stringify(verifier)).not.toContain('4821');
		await expect(matchesPinVerifier('4821', verifier)).resolves.toBe(true);
		await expect(matchesPinVerifier('4822', verifier)).resolves.toBe(false);
		await expect(matchesPinVerifier('48a1', verifier)).resolves.toBe(false);
	});

	it('rejects malformed PINs at creation', async () => {
		await expect(createPinVerifier('123', salt)).rejects.toThrow();
	});

	it('applies escalating lockouts after five failures', () => {
		let state = INITIAL_LOCKOUT;
		for (let attempt = 0; attempt < 4; attempt += 1)
			state = registerFailedAttempt(state, 0);
		expect(remainingLockoutMs(state, 0)).toBe(0);
		state = registerFailedAttempt(state, 1000);
		expect(remainingLockoutMs(state, 1000)).toBe(30_000);
		state = registerFailedAttempt(state, 40_000);
		expect(remainingLockoutMs(state, 40_000)).toBe(60_000);
	});
});

const withoutAmountText = <T extends { amountText: string }>({
	amountText: _ignored,
	...rest
}: T) => rest;

describe('transaction draft validation', () => {
	const base = {
		amountText: '12.50',
		type: 'expense' as const,
		categoryId: 'food',
		cardId: null,
		occurredAt: '2026-10-10T12:00:00.000',
		note: ' Lunch ',
		receiptFile: null,
		recurrence: null,
	};

	it('accepts a valid draft and normalises it', () => {
		expect(validateTransactionDraft(base, 2)).toEqual({
			ok: true,
			value: {
				...withoutAmountText(base),
				amountMinor: 1250,
				accountId: 'main',
				note: 'Lunch',
			},
		});
	});

	it('reports every legacy-required field', () => {
		const result = validateTransactionDraft(
			{ ...base, amountText: '0', categoryId: null, note: '  ' },
			2,
		);
		expect(result).toEqual({
			ok: false,
			errors: {
				amount: 'Enter an amount greater than zero',
				category: 'Choose a category',
				note: 'Add a short description',
			},
		});
	});

	it('rejects more decimals than the currency allows', () => {
		expect(
			validateTransactionDraft({ ...base, amountText: '12.5' }, 0),
		).toMatchObject({ ok: false });
		expect(
			validateTransactionDraft({ ...base, amountText: '1.234' }, 3),
		).toMatchObject({ ok: true });
	});

	it('validates recurrence', () => {
		const result = validateTransactionDraft(
			{
				...base,
				recurrence: { frequency: 'weekly', day: 9, month: null },
			},
			2,
		);
		expect(result).toMatchObject({
			ok: false,
			errors: { recurrence: 'Choose a weekday' },
		});
	});
});

describe('legacy date normalisation', () => {
	it('keeps local wall time and trims Dart microseconds', () => {
		expect(normalizeIsoToLocalDateTime('2026-09-04T18:45:12.345678')).toBe(
			'2026-09-04T18:45:12.345',
		);
		expect(normalizeIsoToLocalDateTime('2026-09-03T00:00:00.000')).toBe(
			'2026-09-03T00:00:00.000',
		);
	});

	it('rejects impossible dates', () => {
		expect(() =>
			normalizeIsoToLocalDateTime('2026-02-30T00:00:00.000'),
		).toThrow(InvalidDateError);
		expect(() => normalizeIsoToLocalDateTime('yesterday')).toThrow(
			InvalidDateError,
		);
	});
});
