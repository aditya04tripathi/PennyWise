export interface ProIntroOffer {
	price: number;
	priceString: string;
	periodUnit: string;
	periodNumberOfUnits: number;
	cycles: number;
}

export interface ProPlanSource {
	identifier: string;
	title: string;
	displayPrice: string;
	packageType?: string;
	price?: number;
	pricePerMonth?: number | null;
	pricePerMonthString?: string | null;
	introPrice?: ProIntroOffer | null;
}

export type ProBillingPeriod = 'monthly' | 'yearly';

export interface ProPlan {
	identifier: string;
	title: string;
	displayPrice: string;
	packageType: string;
	price: number | null;
	pricePerMonth: number | null;
	pricePerMonthString: string | null;
	introPrice: ProIntroOffer | null;
	billingPeriod: ProBillingPeriod | null;
}

const PERIOD_UNITS: Record<string, { one: string; many: string }> = {
	DAY: { one: 'day', many: 'days' },
	WEEK: { one: 'week', many: 'weeks' },
	MONTH: { one: 'month', many: 'months' },
	YEAR: { one: 'year', many: 'years' },
};

export function billingPeriodOf(source: ProPlanSource): ProBillingPeriod | null {
	if (source.packageType === 'MONTHLY') return 'monthly';
	if (source.packageType === 'ANNUAL') return 'yearly';
	if (source.packageType && source.packageType !== 'CUSTOM' && source.packageType !== 'UNKNOWN')
		return null;
	if (source.identifier === 'monthly' || source.identifier === '$rc_monthly')
		return 'monthly';
	if (
		source.identifier === 'yearly' ||
		source.identifier === 'annual' ||
		source.identifier === '$rc_annual'
	)
		return 'yearly';
	return null;
}

export function selectProPlans(packages: readonly ProPlanSource[]): ProPlan[] {
	const seen = new Set<string>();
	const plans: ProPlan[] = [];
	for (const source of packages) {
		if (seen.has(source.identifier)) continue;
		seen.add(source.identifier);
		plans.push({
			identifier: source.identifier,
			title: source.title,
			displayPrice: source.displayPrice,
			packageType: source.packageType ?? 'UNKNOWN',
			price: source.price ?? null,
			pricePerMonth: source.pricePerMonth ?? null,
			pricePerMonthString: source.pricePerMonthString ?? null,
			introPrice: source.introPrice ?? null,
			billingPeriod: billingPeriodOf(source),
		});
	}
	return plans;
}

export function planPeriodLabel(plan: ProPlan): string {
	switch (plan.packageType) {
		case 'MONTHLY':
			return 'Monthly';
		case 'ANNUAL':
			return 'Yearly';
		case 'LIFETIME':
			return 'Lifetime';
		case 'WEEKLY':
			return 'Weekly';
		case 'TWO_MONTH':
			return 'Every 2 months';
		case 'THREE_MONTH':
			return 'Every 3 months';
		case 'SIX_MONTH':
			return 'Every 6 months';
		default:
			if (plan.billingPeriod === 'monthly') return 'Monthly';
			if (plan.billingPeriod === 'yearly') return 'Yearly';
			if (plan.identifier === 'lifetime' || plan.identifier === '$rc_lifetime')
				return 'Lifetime';
			return plan.title;
	}
}

export function describeIntroOffer(intro: ProIntroOffer): string | null {
	const names = PERIOD_UNITS[intro.periodUnit];
	const count = intro.periodNumberOfUnits * Math.max(intro.cycles, 1);
	if (!names || !Number.isFinite(count) || count <= 0) return null;
	const span =
		count === 1 ? `the first ${names.one}` : `the first ${count} ${names.many}`;
	if (intro.price === 0) return `Free for ${span}`;
	return `${intro.priceString} for ${span}`;
}

export function yearlySavingsPercent(
	monthlyPrice: number | null,
	yearlyPrice: number | null,
): number | null {
	if (monthlyPrice == null || yearlyPrice == null) return null;
	if (monthlyPrice <= 0 || yearlyPrice <= 0) return null;
	const payingMonthly = monthlyPrice * 12;
	if (yearlyPrice >= payingMonthly) return null;
	const percent = Math.round((1 - yearlyPrice / payingMonthly) * 100);
	return percent >= 1 ? percent : null;
}
