import { useSyncExternalStore } from 'react';

import type { TransactionQuery } from '@/data/repositories/transaction-repository';

export type ActivitySort = NonNullable<TransactionQuery['sort']>;
export type ReceiptFilter = 'any' | 'with' | 'without';

export interface ActivityFilters {
	sort: ActivitySort;
	categoryId: string;
	accountId: string;
	cardId: string;
	receipt: ReceiptFilter;
}

export const SORT_LABELS: Record<ActivitySort, string> = {
	'date-desc': 'Newest first',
	'date-asc': 'Oldest first',
	'amount-desc': 'Largest amount',
	'amount-asc': 'Smallest amount',
};

const initialFilters: ActivityFilters = {
	sort: 'date-desc',
	categoryId: '',
	accountId: '',
	cardId: '',
	receipt: 'any',
};

let filters = initialFilters;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function useActivityFilters(): ActivityFilters {
	return useSyncExternalStore(subscribe, () => filters, () => filters);
}

export function updateActivityFilters(patch: Partial<ActivityFilters>): void {
	filters = { ...filters, ...patch };
	for (const listener of listeners) listener();
}

export function clearActivityFilters(): void {
	filters = initialFilters;
	for (const listener of listeners) listener();
}

export function activityFilterCount(value: ActivityFilters): number {
	return (
		(value.categoryId === '' ? 0 : 1) +
		(value.accountId === '' ? 0 : 1) +
		(value.cardId === '' ? 0 : 1) +
		(value.receipt === 'any' ? 0 : 1) +
		(value.sort === 'date-desc' ? 0 : 1)
	);
}

export function receiptQuery(receipt: ReceiptFilter): boolean | null {
	if (receipt === 'with') return true;
	if (receipt === 'without') return false;
	return null;
}
