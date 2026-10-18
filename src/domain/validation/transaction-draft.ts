import { z } from 'zod';

import { MAIN_ACCOUNT_ID } from '../entities';

import {
	InvalidAmountError,
	MoneyOverflowError,
	parseDecimalToMinor,
} from '../money/money';

export const recurrenceSchema = z
	.object({
		frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
		day: z.number().int().min(1).max(31).nullable(),
		month: z.number().int().min(1).max(12).nullable(),
	})
	.refine(
		(value) =>
			value.frequency !== 'weekly' ||
			value.day === null ||
			value.day <= 7,
		{
			message: 'Choose a weekday',
			path: ['day'],
		},
	)
	.refine((value) => value.frequency !== 'yearly' || value.month !== null, {
		message: 'Choose a month',
		path: ['month'],
	});

export interface TransactionDraftInput {
	amountText: string;
	type: 'income' | 'expense';
	categoryId: string | null;
	cardId: string | null;
	accountId?: string;
	occurredAt: string;
	note: string;
	receiptFile: string | null;
	recurrence: z.input<typeof recurrenceSchema> | null;
}

export type TransactionDraftErrors = Partial<
	Record<'amount' | 'category' | 'note' | 'recurrence', string>
>;

export interface ValidTransactionDraft {
	amountMinor: number;
	type: 'income' | 'expense';
	categoryId: string;
	cardId: string | null;
	accountId: string;
	occurredAt: string;
	note: string;
	receiptFile: string | null;
	recurrence: z.output<typeof recurrenceSchema> | null;
}

export type DraftValidationResult =
	| { ok: true; value: ValidTransactionDraft }
	| { ok: false; errors: TransactionDraftErrors };

export function validateTransactionDraft(
	input: TransactionDraftInput,
	exponent: number,
): DraftValidationResult {
	const errors: TransactionDraftErrors = {};
	let amountMinor = 0;
	try {
		const parsed = parseDecimalToMinor(input.amountText, exponent);
		amountMinor = parsed.minor;
		if (parsed.wasRounded)
			errors.amount = `Use at most ${exponent} decimal places`;
		else if (amountMinor <= 0)
			errors.amount = 'Enter an amount greater than zero';
	} catch (error) {
		if (error instanceof MoneyOverflowError)
			errors.amount = 'Amount is too large';
		else if (error instanceof InvalidAmountError)
			errors.amount = 'Enter a valid amount';
		else throw error;
	}
	if (!input.categoryId) errors.category = 'Choose a category';
	const note = input.note.trim();
	if (note.length === 0) errors.note = 'Add a short description';
	else if (note.length > 500)
		errors.note = 'Keep the description under 500 characters';

	let recurrence: ValidTransactionDraft['recurrence'] = null;
	if (input.recurrence) {
		const parsed = recurrenceSchema.safeParse(input.recurrence);
		if (parsed.success) recurrence = parsed.data;
		else
			errors.recurrence =
				parsed.error.issues[0]?.message ?? 'Check the repeat settings';
	}

	if (Object.keys(errors).length > 0) return { ok: false, errors };
	return {
		ok: true,
		value: {
			amountMinor,
			type: input.type,
			categoryId: input.categoryId!,
			cardId: input.cardId,
			accountId: input.accountId ?? MAIN_ACCOUNT_ID,
			occurredAt: input.occurredAt,
			note,
			receiptFile: input.receiptFile,
			recurrence,
		},
	};
}
