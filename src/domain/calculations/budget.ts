import { addMinor, type MinorUnits } from '../money/money';

export type BudgetState = 'unset' | 'within' | 'approaching' | 'exceeded';

export interface BudgetStatus {
	state: BudgetState;
	budgetMinor: MinorUnits | null;
	spentMinor: MinorUnits;
	remainingMinor: MinorUnits | null;
	usedBasisPoints: number | null;
}

export function evaluateBudget(
	spentMinor: MinorUnits,
	budgetMinor: MinorUnits | null,
	alertPercent: number,
): BudgetStatus {
	if (budgetMinor === null || budgetMinor <= 0) {
		return {
			state: 'unset',
			budgetMinor: null,
			spentMinor,
			remainingMinor: null,
			usedBasisPoints: null,
		};
	}
	const usedBasisPoints = Math.floor((spentMinor * 10_000) / budgetMinor);
	const state: BudgetState =
		spentMinor > budgetMinor
			? 'exceeded'
			: reachedThreshold(spentMinor, budgetMinor, alertPercent)
				? 'approaching'
				: 'within';
	return {
		state,
		budgetMinor,
		spentMinor,
		remainingMinor: addMinor(budgetMinor, -spentMinor),
		usedBasisPoints,
	};
}

function reachedThreshold(
	spentMinor: MinorUnits,
	budgetMinor: MinorUnits,
	alertPercent: number,
): boolean {
	return spentMinor * 100 >= budgetMinor * alertPercent;
}

export type BudgetAlertLevel = 'threshold' | 'exceeded';

export function budgetAlertToSend(
	previousSpentMinor: MinorUnits,
	currentSpentMinor: MinorUnits,
	budgetMinor: MinorUnits | null,
	alertPercent: number,
	alreadySent: readonly BudgetAlertLevel[],
): BudgetAlertLevel | null {
	if (budgetMinor === null || budgetMinor <= 0) return null;
	const crossedExceeded =
		previousSpentMinor <= budgetMinor && currentSpentMinor > budgetMinor;
	if (crossedExceeded && !alreadySent.includes('exceeded')) return 'exceeded';
	const crossedThreshold =
		!reachedThreshold(previousSpentMinor, budgetMinor, alertPercent) &&
		reachedThreshold(currentSpentMinor, budgetMinor, alertPercent);
	if (
		crossedThreshold &&
		!alreadySent.includes('threshold') &&
		currentSpentMinor <= budgetMinor
	)
		return 'threshold';
	return null;
}
