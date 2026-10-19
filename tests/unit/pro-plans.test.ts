import {
	describeIntroOffer,
	selectProPlans,
	yearlySavingsPercent,
} from '@/features/pro/plans';

describe('selectProPlans', () => {
	it('keeps offering order and classifies default package types', () => {
		expect(
			selectProPlans([
				{
					identifier: '$rc_monthly',
					packageType: 'MONTHLY',
					title: 'PennyWise Pro (Monthly)',
					displayPrice: '$2.99',
					price: 2.99,
					pricePerMonth: 2.99,
					pricePerMonthString: '$2.99',
				},
				{
					identifier: '$rc_lifetime',
					packageType: 'LIFETIME',
					title: 'PennyWise Pro (Lifetime)',
					displayPrice: '$29.99',
					price: 29.99,
				},
				{
					identifier: '$rc_annual',
					packageType: 'ANNUAL',
					title: 'PennyWise Pro (Yearly)',
					displayPrice: '$19.99',
					price: 19.99,
					pricePerMonth: 1.67,
					pricePerMonthString: '$1.67',
				},
			]),
		).toEqual([
			{
				identifier: '$rc_monthly',
				title: 'PennyWise Pro (Monthly)',
				displayPrice: '$2.99',
				packageType: 'MONTHLY',
				price: 2.99,
				pricePerMonth: 2.99,
				pricePerMonthString: '$2.99',
				introPrice: null,
				billingPeriod: 'monthly',
			},
			{
				identifier: '$rc_lifetime',
				title: 'PennyWise Pro (Lifetime)',
				displayPrice: '$29.99',
				packageType: 'LIFETIME',
				price: 29.99,
				pricePerMonth: null,
				pricePerMonthString: null,
				introPrice: null,
				billingPeriod: null,
			},
			{
				identifier: '$rc_annual',
				title: 'PennyWise Pro (Yearly)',
				displayPrice: '$19.99',
				packageType: 'ANNUAL',
				price: 19.99,
				pricePerMonth: 1.67,
				pricePerMonthString: '$1.67',
				introPrice: null,
				billingPeriod: 'yearly',
			},
		]);
	});

	it('classifies the custom monthly, yearly and lifetime identifiers', () => {
		expect(
			selectProPlans([
				{
					identifier: 'monthly',
					packageType: 'CUSTOM',
					title: 'Monthly',
					displayPrice: '$2.99',
				},
				{
					identifier: 'yearly',
					packageType: 'CUSTOM',
					title: 'Yearly',
					displayPrice: '$19.99',
				},
				{
					identifier: 'lifetime',
					packageType: 'CUSTOM',
					title: 'Lifetime',
					displayPrice: '$29.99',
				},
			]).map((plan) => [plan.identifier, plan.billingPeriod]),
		).toEqual([
			['monthly', 'monthly'],
			['yearly', 'yearly'],
			['lifetime', null],
		]);
	});

	it('keeps every package in the offering, including ones with custom ids', () => {
		expect(
			selectProPlans([
				{
					identifier: 'coins',
					packageType: 'CUSTOM',
					title: 'Coins',
					displayPrice: '$0.99',
				},
			]).map((plan) => plan.identifier),
		).toEqual(['coins']);
	});

	it('drops a repeated package identifier', () => {
		expect(
			selectProPlans([
				{
					identifier: '$rc_monthly',
					packageType: 'MONTHLY',
					title: 'Monthly',
					displayPrice: '$2.99',
				},
				{
					identifier: '$rc_monthly',
					packageType: 'MONTHLY',
					title: 'Monthly again',
					displayPrice: '$3.99',
				},
			]),
		).toHaveLength(1);
	});
});

describe('intro offers and yearly savings', () => {
	it('describes a free trial from the store period', () => {
		expect(
			describeIntroOffer({
				price: 0,
				priceString: '$0.00',
				periodUnit: 'DAY',
				periodNumberOfUnits: 7,
				cycles: 1,
			}),
		).toBe('Free for the first 7 days');
	});

	it('describes a paid introductory period', () => {
		expect(
			describeIntroOffer({
				price: 0.99,
				priceString: '$0.99',
				periodUnit: 'MONTH',
				periodNumberOfUnits: 1,
				cycles: 1,
			}),
		).toBe('$0.99 for the first month');
	});

	it('returns the percent saved by yearly versus twelve monthly payments', () => {
		expect(yearlySavingsPercent(2.99, 19.99)).toBe(44);
		expect(yearlySavingsPercent(2, 24)).toBeNull();
		expect(yearlySavingsPercent(null, 19.99)).toBeNull();
	});
});
