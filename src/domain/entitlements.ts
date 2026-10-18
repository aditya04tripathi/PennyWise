export type ProFeature =
	'extra-accounts' | 'savings-goals' | 'category-limits' | 'insights';

export const FREE_ACCOUNT_LIMIT = 1;

export function canAddAccount(isPro: boolean, activeAccounts: number): boolean {
	return isPro || activeAccounts < FREE_ACCOUNT_LIMIT;
}

export function canAddGoal(isPro: boolean): boolean {
	return isPro;
}

export function canSetCategoryLimit(
	isPro: boolean,
	existingLimit: number | null,
	nextLimit: number | null,
): boolean {
	if (isPro || nextLimit === null) return true;
	return existingLimit !== null && existingLimit === nextLimit;
}
