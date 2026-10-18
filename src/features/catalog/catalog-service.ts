import { toLocalDateTime } from '@/domain/dates';
import type {
	CardNetwork,
	Category,
	CategoryIcon,
	PaymentCard,
} from '@/domain/entities';
import {
	countCardUsage,
	deleteCard,
	upsertCard,
} from '@/data/repositories/card-repository';
import {
	countCategoryUsage,
	deleteUnusedCategory,
	listCategories,
	reassignCategoryTransactions,
	setCategoryArchived,
	upsertCategory,
} from '@/data/repositories/category-repository';
import type { MinorUnits } from '@/domain/money/money';
import { canSetCategoryLimit } from '@/domain/entitlements';
import { secureRandomId } from '@/lib/crypto/random';

import { useProStore } from '../pro/pro-store';
import { requireDatabase, useSession } from '../session/session-store';

export const DEFAULT_CATEGORIES: readonly Omit<Category, 'sortOrder'>[] = [
	{
		id: '1',
		name: 'Food',
		icon: 'food',
		color: '#B7791F',
		budgetLimitMinor: null,
		legacyIconCode: null,
		archivedAt: null,
	},
	{
		id: '2',
		name: 'Transport',
		icon: 'transport',
		color: '#2B6CB0',
		budgetLimitMinor: null,
		legacyIconCode: null,
		archivedAt: null,
	},
	{
		id: '3',
		name: 'Shopping',
		icon: 'shopping',
		color: '#B83280',
		budgetLimitMinor: null,
		legacyIconCode: null,
		archivedAt: null,
	},
	{
		id: '4',
		name: 'Income',
		icon: 'income',
		color: '#176B57',
		budgetLimitMinor: null,
		legacyIconCode: null,
		archivedAt: null,
	},
	{
		id: '5',
		name: 'Housing',
		icon: 'housing',
		color: '#5A6778',
		budgetLimitMinor: null,
		legacyIconCode: null,
		archivedAt: null,
	},
];

export async function ensureDefaultCategories(): Promise<void> {
	const database = requireDatabase();
	if ((await listCategories(database, true)).length > 0) return;
	await database.transaction(async (db) => {
		for (const [index, category] of DEFAULT_CATEGORIES.entries())
			await upsertCategory(db, { ...category, sortOrder: index });
	});
}

export interface CategoryInput {
	name: string;
	icon: CategoryIcon;
	color: string;
	budgetLimitMinor: MinorUnits | null;
}

export function validateCategoryName(name: string): string | null {
	const trimmed = name.trim();
	if (!trimmed) return 'Enter a name';
	if (trimmed.length > 40) return 'Keep the name under 40 characters';
	return null;
}

export async function saveCategory(
	input: CategoryInput,
	existing: Category | null,
): Promise<Category> {
	const error = validateCategoryName(input.name);
	if (error) throw new Error(error);
	if (
		!canSetCategoryLimit(
			useProStore.getState().isPro,
			existing?.budgetLimitMinor ?? null,
			input.budgetLimitMinor,
		)
	)
		throw new Error('PennyWise Pro is needed to set category limits.');
	const database = requireDatabase();
	const count = (await listCategories(database, true)).length;
	const category: Category = existing
		? {
				...existing,
				name: input.name.trim(),
				icon: input.icon,
				color: input.color,
				budgetLimitMinor: input.budgetLimitMinor,
			}
		: {
				id: secureRandomId(),
				name: input.name.trim(),
				icon: input.icon,
				color: input.color,
				budgetLimitMinor: input.budgetLimitMinor,
				legacyIconCode: null,
				sortOrder: count,
				archivedAt: null,
			};
	await upsertCategory(database, category);
	useSession.getState().notifyDataChanged();
	return category;
}

export async function categoryUsage(categoryId: string): Promise<number> {
	return countCategoryUsage(requireDatabase(), categoryId);
}

export async function archiveCategory(
	categoryId: string,
	archived: boolean,
): Promise<void> {
	await setCategoryArchived(
		requireDatabase(),
		categoryId,
		archived ? toLocalDateTime(new Date()) : null,
	);
	useSession.getState().notifyDataChanged();
}

export async function deleteCategory(
	categoryId: string,
	reassignTo: string | null,
): Promise<void> {
	const database = requireDatabase();
	await database.transaction(async (db) => {
		if (reassignTo)
			await reassignCategoryTransactions(
				db,
				categoryId,
				reassignTo,
				toLocalDateTime(new Date()),
			);
		await deleteUnusedCategory(db, categoryId);
	});
	useSession.getState().notifyDataChanged();
}

export interface CardInput {
	bankName: string;
	holderName: string;
	lastFour: string;
	network: CardNetwork;
	color: string;
}

export type CardInputErrors = Partial<Record<keyof CardInput, string>>;

export function validateCardInput(input: CardInput): CardInputErrors {
	const errors: CardInputErrors = {};
	if (!input.bankName.trim()) errors.bankName = 'Enter the bank or issuer';
	if (!/^\d{4}$/.test(input.lastFour))
		errors.lastFour = 'Enter exactly the last 4 digits';
	return errors;
}

export async function saveCard(
	input: CardInput,
	existingId: string | null,
): Promise<PaymentCard> {
	const errors = validateCardInput(input);
	if (Object.keys(errors).length > 0)
		throw new Error(Object.values(errors)[0]);
	const card: PaymentCard = {
		id: existingId ?? secureRandomId(),
		...input,
		bankName: input.bankName.trim(),
		holderName: input.holderName.trim(),
	};
	await upsertCard(requireDatabase(), card);
	useSession.getState().notifyDataChanged();
	return card;
}

export async function cardUsage(cardId: string): Promise<number> {
	return countCardUsage(requireDatabase(), cardId);
}

export async function removeCard(cardId: string): Promise<void> {
	await deleteCard(requireDatabase(), cardId);
	useSession.getState().notifyDataChanged();
}

export function networkFromLeadingDigits(digits: string): CardNetwork {
	if (/^4/.test(digits)) return 'visa';
	if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits))
		return 'mastercard';
	if (/^3[47]/.test(digits)) return 'amex';
	if (/^(6011|65|64[4-9]|622[1-9])/.test(digits)) return 'discover';
	return 'other';
}
