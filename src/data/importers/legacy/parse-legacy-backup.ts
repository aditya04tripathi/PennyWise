import { z } from 'zod';

import { InvalidDateError, normalizeIsoToLocalDateTime } from '@/domain/dates';
import type {
	Category,
	PaymentCard,
	Transaction,
	UserSettings,
} from '@/domain/entities';
import { DEFAULT_SETTINGS, MAIN_ACCOUNT_ID } from '@/domain/entities';
import { currencyExponent, findCurrency } from '@/domain/money/currency';
import {
	InvalidAmountError,
	legacyDoubleToMinor,
	MoneyOverflowError,
} from '@/domain/money/money';

import { parseCsv } from './csv';
import {
	argbToHex,
	iconForLegacyCodepoint,
	LEGACY_CARD_NETWORKS,
	LEGACY_FREQUENCIES,
	LEGACY_TRANSACTION_TYPES,
} from './legacy-mapping';

const legacyUserSchema = z.object({
	name: z.string(),
	primaryCurrency: z.string(),
	pin: z.string().nullish(),
	isBiometricEnabled: z.boolean().nullish(),
	isOnboardingCompleted: z.boolean().nullish(),
	monthlyBudget: z.number().nullish(),
	budgetAlertLimitPercent: z.number().nullish(),
	budgetAlertsEnabled: z.boolean().nullish(),
});

const legacyCategorySchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	iconCode: z.number().int(),
	colorValue: z.number().int(),
	budgetLimit: z.number().nullish(),
});

const legacyCardSchema = z.object({
	id: z.string().min(1),
	bankName: z.string(),
	cardHolderName: z.string(),
	lastFourDigits: z.string(),
	cardType: z.number().int().nullish(),
	maskedNumber: z.string().nullish(),
	colorValue: z.number().int(),
});

const legacyTransactionSchema = z.object({
	id: z.string().min(1),
	amount: z.number(),
	categoryId: z.string(),
	type: z.number().int().nullish(),
	date: z.string(),
	note: z.string().nullish(),
	isRecurring: z.boolean().nullish(),
	frequency: z.number().int().nullish(),
	recurringDay: z.number().int().nullish(),
	recurringMonth: z.number().int().nullish(),
	imagePath: z.string().nullish(),
	cardId: z.string().nullish(),
});

export type LegacyIssueSeverity = 'info' | 'warning' | 'rejected';

export interface LegacyImportIssue {
	severity: LegacyIssueSeverity;
	row: number | null;
	message: string;
}

export interface LegacyRawTransaction {
	type: 'income' | 'expense';
	amount: number;
	occurredAt: string;
}

export interface LegacySnapshot {
	settings: UserSettings;
	categories: Category[];
	cards: PaymentCard[];
	transactions: Transaction[];
	issues: LegacyImportIssue[];
	rawAcceptedTransactions: LegacyRawTransaction[];
	sourceCounts: {
		users: number;
		categories: number;
		cards: number;
		transactions: number;
		unknownRows: number;
	};
}

export class LegacyBackupFormatError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'LegacyBackupFormatError';
	}
}

interface RawRow {
	index: number;
	kind: string;
	data: unknown;
}

function readRows(content: string): RawRow[] {
	let rows: string[][];
	try {
		rows = parseCsv(content);
	} catch {
		throw new LegacyBackupFormatError(
			'The file is not a readable PennyWise backup.',
		);
	}
	const [header, ...body] = rows;
	if (
		!header ||
		header[0]?.trim() !== 'type' ||
		header[1]?.trim() !== 'data'
	) {
		throw new LegacyBackupFormatError(
			'The file is not a PennyWise backup (missing type/data header).',
		);
	}
	return body.map((cells, offset) => {
		let data: unknown = null;
		try {
			data = JSON.parse(cells[1] ?? '');
		} catch {
			data = undefined;
		}
		return { index: offset + 2, kind: (cells[0] ?? '').trim(), data };
	});
}

export function parseLegacyBackup(
	content: string,
	importedAt: string,
): LegacySnapshot {
	const rows = readRows(content);
	const issues: LegacyImportIssue[] = [];
	const report = (
		severity: LegacyIssueSeverity,
		row: number | null,
		message: string,
	) => issues.push({ severity, row, message });

	const sourceCounts = {
		users: 0,
		categories: 0,
		cards: 0,
		transactions: 0,
		unknownRows: 0,
	};
	const users: z.infer<typeof legacyUserSchema>[] = [];
	const categoryRows: {
		row: number;
		value: z.infer<typeof legacyCategorySchema>;
	}[] = [];
	const cardRows: { row: number; value: z.infer<typeof legacyCardSchema> }[] =
		[];
	const transactionRows: {
		row: number;
		value: z.infer<typeof legacyTransactionSchema>;
	}[] = [];

	for (const row of rows) {
		if (row.data === undefined) {
			report(
				'rejected',
				row.index,
				'Row contains unreadable data and was skipped.',
			);
			continue;
		}
		const parse = <S extends z.ZodTypeAny>(schema: S) => {
			const result = schema.safeParse(row.data);
			if (!result.success) {
				report(
					'rejected',
					row.index,
					`${row.kind} row is missing required fields and was skipped.`,
				);
				return null;
			}
			return result.data as z.infer<S>;
		};
		switch (row.kind) {
			case 'user': {
				sourceCounts.users += 1;
				const value = parse(legacyUserSchema);
				if (value) users.push(value);
				break;
			}
			case 'category': {
				sourceCounts.categories += 1;
				const value = parse(legacyCategorySchema);
				if (value) categoryRows.push({ row: row.index, value });
				break;
			}
			case 'card': {
				sourceCounts.cards += 1;
				const value = parse(legacyCardSchema);
				if (value) cardRows.push({ row: row.index, value });
				break;
			}
			case 'transaction': {
				sourceCounts.transactions += 1;
				const value = parse(legacyTransactionSchema);
				if (value) transactionRows.push({ row: row.index, value });
				break;
			}
			default:
				sourceCounts.unknownRows += 1;
				report(
					'warning',
					row.index,
					`Unrecognised row type "${row.kind}" was ignored.`,
				);
		}
	}

	const settings = mapSettings(users, report);
	const exponent = currencyExponent(settings.currencyCode);
	const categories = mapCategories(categoryRows, exponent, report);
	const cards = mapCards(cardRows, report);
	const { transactions, rawAccepted } = mapTransactions(
		transactionRows,
		exponent,
		categories,
		cards,
		importedAt,
		report,
	);

	return {
		settings,
		categories,
		cards,
		transactions,
		issues,
		rawAcceptedTransactions: rawAccepted,
		sourceCounts,
	};
}

type Reporter = (
	severity: LegacyIssueSeverity,
	row: number | null,
	message: string,
) => void;

function mapSettings(
	users: z.infer<typeof legacyUserSchema>[],
	report: Reporter,
): UserSettings {
	if (users.length === 0) {
		report(
			'warning',
			null,
			'The backup has no profile. Default preferences will be used.',
		);
		return { ...DEFAULT_SETTINGS };
	}
	if (users.length > 1)
		report(
			'warning',
			null,
			'The backup has several profiles; the first one was used, as in the original app.',
		);
	const user = users[0];
	const currencyCode = user.primaryCurrency.toUpperCase();
	if (!findCurrency(currencyCode)) {
		throw new LegacyBackupFormatError(
			`The backup uses an unsupported currency (${user.primaryCurrency}).`,
		);
	}
	if (user.pin)
		report(
			'info',
			null,
			'Your old PIN was not imported. You will set a new PIN on this device.',
		);

	let monthlyBudgetMinor: number | null = null;
	if (user.monthlyBudget != null && user.monthlyBudget > 0) {
		const parsed = legacyDoubleToMinor(
			user.monthlyBudget,
			currencyExponent(currencyCode),
		);
		monthlyBudgetMinor = parsed.minor > 0 ? parsed.minor : null;
		if (parsed.wasRounded)
			report(
				'warning',
				null,
				'Monthly budget was rounded to the currency precision.',
			);
	}
	const rawPercent = user.budgetAlertLimitPercent ?? 80;
	const budgetAlertPercent = Math.min(
		100,
		Math.max(1, Math.round(rawPercent)),
	);
	if (budgetAlertPercent !== rawPercent) {
		report(
			'warning',
			null,
			`Budget alert threshold ${rawPercent}% was adjusted to ${budgetAlertPercent}%.`,
		);
	}
	return {
		...DEFAULT_SETTINGS,
		name: user.name.trim(),
		currencyCode,
		onboardingCompleted: true,
		monthlyBudgetMinor,
		budgetAlertPercent,
		budgetAlertsEnabled: user.budgetAlertsEnabled ?? true,
	};
}

function mapCategories(
	rows: { row: number; value: z.infer<typeof legacyCategorySchema> }[],
	exponent: number,
	report: Reporter,
): Category[] {
	const seen = new Set<string>();
	const categories: Category[] = [];
	rows.forEach(({ row, value }, index) => {
		if (seen.has(value.id)) {
			report(
				'warning',
				row,
				`Duplicate category "${value.name}" (id ${value.id}) was skipped.`,
			);
			return;
		}
		seen.add(value.id);
		const icon = iconForLegacyCodepoint(value.iconCode);
		if (!icon)
			report(
				'info',
				row,
				`Category "${value.name}" uses an icon without an equivalent; a generic icon was used.`,
			);
		let budgetLimitMinor: number | null = null;
		if (value.budgetLimit != null && value.budgetLimit >= 0) {
			budgetLimitMinor = legacyDoubleToMinor(
				value.budgetLimit,
				exponent,
			).minor;
		}
		categories.push({
			id: value.id,
			name: value.name.trim() || 'Untitled category',
			icon: icon ?? 'tag',
			color: argbToHex(value.colorValue),
			budgetLimitMinor,
			legacyIconCode: value.iconCode,
			sortOrder: index,
			archivedAt: null,
		});
	});
	return categories;
}

function mapCards(
	rows: { row: number; value: z.infer<typeof legacyCardSchema> }[],
	report: Reporter,
): PaymentCard[] {
	const seen = new Set<string>();
	const cards: PaymentCard[] = [];
	for (const { row, value } of rows) {
		if (seen.has(value.id)) {
			report('warning', row, `Duplicate card ${value.id} was skipped.`);
			continue;
		}
		const fromMasked =
			value.maskedNumber?.replace(/\D/g, '').slice(-4) ?? '';
		const lastFour = /^\d{4}$/.test(value.lastFourDigits)
			? value.lastFourDigits
			: fromMasked;
		if (!/^\d{4}$/.test(lastFour)) {
			report(
				'rejected',
				row,
				`Card from ${value.bankName || 'unknown bank'} has no valid last four digits and was skipped.`,
			);
			continue;
		}
		seen.add(value.id);
		cards.push({
			id: value.id,
			bankName: value.bankName.trim() || 'Card',
			holderName: value.cardHolderName.trim(),
			lastFour,
			network: LEGACY_CARD_NETWORKS[value.cardType ?? 4] ?? 'other',
			color: argbToHex(value.colorValue),
		});
	}
	return cards;
}

function mapTransactions(
	rows: { row: number; value: z.infer<typeof legacyTransactionSchema> }[],
	exponent: number,
	categories: Category[],
	cards: PaymentCard[],
	importedAt: string,
	report: Reporter,
): { transactions: Transaction[]; rawAccepted: LegacyRawTransaction[] } {
	const categoryIds = new Set(categories.map((category) => category.id));
	const cardIds = new Set(cards.map((card) => card.id));
	const usedIds = new Set<string>();
	const transactions: Transaction[] = [];
	const rawAccepted: LegacyRawTransaction[] = [];
	let missingReceipts = 0;

	for (const { row, value } of rows) {
		const type = LEGACY_TRANSACTION_TYPES[value.type ?? 0];
		if (!type) {
			report(
				'rejected',
				row,
				`Transaction ${value.id} has an unknown type and was skipped.`,
			);
			continue;
		}
		let amountMinor: number;
		try {
			const parsed = legacyDoubleToMinor(value.amount, exponent);
			amountMinor = parsed.minor;
			if (parsed.wasRounded)
				report(
					'warning',
					row,
					`Transaction ${value.id} amount ${value.amount} was rounded to the currency precision.`,
				);
		} catch (error) {
			if (
				error instanceof InvalidAmountError ||
				error instanceof MoneyOverflowError
			) {
				report(
					'rejected',
					row,
					`Transaction ${value.id} has an unusable amount and was skipped.`,
				);
				continue;
			}
			throw error;
		}
		if (amountMinor <= 0) {
			report(
				'rejected',
				row,
				`Transaction ${value.id} has a zero or negative amount (${value.amount}) and was skipped.`,
			);
			continue;
		}
		let occurredAt: string;
		try {
			occurredAt = normalizeIsoToLocalDateTime(value.date);
		} catch (error) {
			if (!(error instanceof InvalidDateError)) throw error;
			report(
				'rejected',
				row,
				`Transaction ${value.id} has an invalid date and was skipped.`,
			);
			continue;
		}

		let categoryId = value.categoryId;
		if (!categoryIds.has(categoryId)) {
			const recoveredId = categoryId || 'legacy-uncategorised';
			if (!categoryIds.has(recoveredId)) {
				categories.push({
					id: recoveredId,
					name: 'Recovered category',
					icon: 'tag',
					color: '#697381',
					budgetLimitMinor: null,
					legacyIconCode: null,
					sortOrder: categories.length,
					archivedAt: null,
				});
				categoryIds.add(recoveredId);
				report(
					'warning',
					row,
					`Some transactions referenced a deleted category; they were placed in "Recovered category".`,
				);
			}
			categoryId = recoveredId;
		}

		let cardId = value.cardId ?? null;
		if (cardId && !cardIds.has(cardId)) {
			report(
				'warning',
				row,
				`Transaction ${value.id} referenced a card that no longer exists; the card link was removed.`,
			);
			cardId = null;
		}

		let id = value.id;
		if (usedIds.has(id)) {
			let suffix = 2;
			while (usedIds.has(`${value.id}-${suffix}`)) suffix += 1;
			id = `${value.id}-${suffix}`;
			report(
				'warning',
				row,
				`Duplicate transaction id ${value.id} was kept as ${id}.`,
			);
		}
		usedIds.add(id);

		if (value.imagePath) missingReceipts += 1;

		const frequency = value.isRecurring
			? LEGACY_FREQUENCIES[value.frequency ?? -1]
			: undefined;
		if (value.isRecurring && !frequency) {
			report(
				'warning',
				row,
				`Transaction ${value.id} was marked recurring without a valid frequency; it was imported as one-off.`,
			);
		}
		const recurrence = frequency
			? {
					frequency,
					day:
						frequency === 'daily'
							? null
							: clampOrNull(
									value.recurringDay,
									1,
									frequency === 'weekly' ? 7 : 31,
								),
					month:
						frequency === 'yearly'
							? clampOrNull(value.recurringMonth, 1, 12)
							: null,
				}
			: null;
		if (
			recurrence &&
			recurrence.day !== (value.recurringDay ?? null) &&
			frequency !== 'daily'
		) {
			report(
				'warning',
				row,
				`Transaction ${value.id} had an out-of-range repeat day that was corrected.`,
			);
		}

		transactions.push({
			id,
			type,
			amountMinor,
			categoryId,
			cardId,
			accountId: MAIN_ACCOUNT_ID,
			occurredAt,
			note: (value.note ?? '').trim(),
			receiptFile: null,
			recurrence,
			recurrenceSourceId: null,
			occurrenceDate: null,
			createdAt: importedAt,
			updatedAt: importedAt,
		});
		rawAccepted.push({ type, amount: value.amount, occurredAt });
	}

	if (missingReceipts > 0) {
		report(
			'warning',
			null,
			`${missingReceipts} receipt photo${missingReceipts === 1 ? ' is' : 's are'} not included in old-format backups and could not be transferred. The transactions themselves were imported.`,
		);
	}
	return { transactions, rawAccepted };
}

function clampOrNull(
	value: number | null | undefined,
	min: number,
	max: number,
): number | null {
	if (value == null) return null;
	return Math.min(max, Math.max(min, value));
}
