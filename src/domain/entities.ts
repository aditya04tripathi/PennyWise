import type { MinorUnits } from './money/money';

export type TransactionType = 'income' | 'expense';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Recurrence {
	frequency: RecurringFrequency;
	day: number | null;
	month: number | null;
}

export interface Transaction {
	id: string;
	type: TransactionType;
	amountMinor: MinorUnits;
	categoryId: string;
	cardId: string | null;
	accountId: string;
	occurredAt: string;
	note: string;
	receiptFile: string | null;
	recurrence: Recurrence | null;
	recurrenceSourceId: string | null;
	occurrenceDate: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Category {
	id: string;
	name: string;
	icon: CategoryIcon;
	color: string;
	budgetLimitMinor: MinorUnits | null;
	legacyIconCode: number | null;
	sortOrder: number;
	archivedAt: string | null;
}

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';

export interface PaymentCard {
	id: string;
	bankName: string;
	holderName: string;
	lastFour: string;
	network: CardNetwork;
	color: string;
}

export type AppearancePreference = 'system' | 'light' | 'dark';

export interface UserSettings {
	name: string;
	currencyCode: string;
	onboardingCompleted: boolean;
	monthlyBudgetMinor: MinorUnits | null;
	budgetAlertPercent: number;
	budgetAlertsEnabled: boolean;
	appearance: AppearancePreference;
	autoLockSeconds: number;
	hideAmounts: boolean;
}

export const CATEGORY_ICONS = [
	'tag',
	'food',
	'transport',
	'shopping',
	'income',
	'housing',
	'utilities',
	'entertainment',
	'fitness',
	'health',
	'education',
	'travel',
	'pets',
	'gifts',
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const DEFAULT_SETTINGS: UserSettings = {
	name: '',
	currencyCode: 'USD',
	onboardingCompleted: false,
	monthlyBudgetMinor: null,
	budgetAlertPercent: 80,
	budgetAlertsEnabled: true,
	appearance: 'system',
	autoLockSeconds: 0,
	hideAmounts: false,
};

export const MAIN_ACCOUNT_ID = 'main';

export type AccountKind = 'cash' | 'checking' | 'savings' | 'credit' | 'other';

export interface Account {
	id: string;
	name: string;
	kind: AccountKind;
	color: string;
	openingBalanceMinor: MinorUnits;
	sortOrder: number;
	archivedAt: string | null;
}

export interface Transfer {
	id: string;
	fromAccountId: string;
	toAccountId: string;
	amountMinor: MinorUnits;
	occurredAt: string;
	note: string;
	createdAt: string;
}

export interface SavingsGoal {
	id: string;
	name: string;
	targetMinor: MinorUnits;
	targetDate: string | null;
	color: string;
	createdAt: string;
	archivedAt: string | null;
}

export interface GoalContribution {
	id: string;
	goalId: string;
	amountMinor: MinorUnits;
	occurredAt: string;
}
