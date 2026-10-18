import { useCallback, useMemo } from 'react';

import { listCards } from '@/data/repositories/card-repository';
import { listCategories } from '@/data/repositories/category-repository';
import type {
	Account,
	Category,
	PaymentCard,
	UserSettings,
} from '@/domain/entities';
import { formatMoney, type FormatMoneyOptions } from '@/domain/money/format';
import type { MinorUnits } from '@/domain/money/money';
import { loadAccountBalances } from '@/features/accounts/account-service';
import { loadGoalProgress } from '@/features/goals/goal-service';
import { useSession } from '@/features/session/session-store';

import { useLedgerQuery } from './use-ledger-query';

export const HIDDEN_AMOUNT = '••••';

export function useSettings(): UserSettings {
	const settings = useSession((state) => state.settings);
	if (!settings) throw new Error('Settings are not loaded');
	return settings;
}

export type MoneyFormatter = (
	minor: MinorUnits,
	options?: FormatMoneyOptions & { reveal?: boolean },
) => string;

export function useMoneyFormatter(): MoneyFormatter {
	const { currencyCode, hideAmounts } = useSettings();
	return useCallback(
		(minor, options = {}) =>
			hideAmounts && !options.reveal
				? HIDDEN_AMOUNT
				: formatMoney(minor, currencyCode, options),
		[currencyCode, hideAmounts],
	);
}

export function useCategories(includeArchived = false) {
	const query = useLedgerQuery(
		(db) => listCategories(db, includeArchived),
		[includeArchived],
	);
	const byId = useMemo(
		() =>
			new Map<string, Category>(
				(query.data ?? []).map((category) => [category.id, category]),
			),
		[query.data],
	);
	return { ...query, categories: query.data ?? [], byId };
}

export function useCards() {
	const query = useLedgerQuery((db) => listCards(db), []);
	const byId = useMemo(
		() =>
			new Map<string, PaymentCard>(
				(query.data ?? []).map((card) => [card.id, card]),
			),
		[query.data],
	);
	return { ...query, cards: query.data ?? [], byId };
}

export function useAccounts() {
	const query = useLedgerQuery(
		(db) => loadAccountBalances(db, new Date()),
		[],
	);
	const byId = useMemo(
		() =>
			new Map<string, Account>(
				(query.data ?? []).map((entry) => [
					entry.account.id,
					entry.account,
				]),
			),
		[query.data],
	);
	return { ...query, accounts: query.data ?? [], byId };
}

export function useGoals() {
	const query = useLedgerQuery((db) => loadGoalProgress(db), []);
	return { ...query, goals: query.data ?? [] };
}
