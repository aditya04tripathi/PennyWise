import {
	canAddAccount,
	canAddGoal,
	canSetCategoryLimit,
} from '@/domain/entitlements';

describe('entitlements', () => {
	it('allows the main account for free and more accounts with Pro', () => {
		expect(canAddAccount(false, 0)).toBe(true);
		expect(canAddAccount(false, 1)).toBe(false);
		expect(canAddAccount(true, 5)).toBe(true);
	});

	it('requires Pro for new goals', () => {
		expect(canAddGoal(false)).toBe(false);
		expect(canAddGoal(true)).toBe(true);
	});

	it('never locks existing category limits away', () => {
		expect(canSetCategoryLimit(false, null, null)).toBe(true);
		expect(canSetCategoryLimit(false, 5000, null)).toBe(true);
		expect(canSetCategoryLimit(false, 5000, 5000)).toBe(true);
		expect(canSetCategoryLimit(false, 5000, 6000)).toBe(false);
		expect(canSetCategoryLimit(false, null, 5000)).toBe(false);
		expect(canSetCategoryLimit(true, null, 5000)).toBe(true);
	});
});
