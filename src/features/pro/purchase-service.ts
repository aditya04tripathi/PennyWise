import * as SecureStore from 'expo-secure-store';
import Purchases, {
	LOG_LEVEL,
	type CustomerInfo,
	type PurchasesOffering,
	type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { selectProPlans, type ProPlan } from './plans';
import { proAccessFromStoreResult } from './entitlement-resolution';
import { useProStore } from './pro-store';

export const PRO_ENTITLEMENT_ID =
	process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? 'penny_wise_pro';

export type { ProPlan };

const API_KEY =
	process.env.EXPO_OS === 'ios'
		? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
		: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

const ENTITLEMENT_KEY = 'pennywise.pro-entitlement.v1';
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
	keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export interface ProCustomer {
	isPro: boolean;
	productIdentifier: string | null;
	expiresAt: string | null;
	willRenew: boolean;
}

export type PurchaseOutcome =
	| { kind: 'purchased' }
	| { kind: 'cancelled' }
	| { kind: 'failed'; message: string };

let configured = false;

export function isProActive(info: CustomerInfo): boolean {
	return info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

function customerFrom(info: CustomerInfo): ProCustomer {
	const entitlement = info.entitlements.active[PRO_ENTITLEMENT_ID];
	return {
		isPro: entitlement !== undefined,
		productIdentifier: entitlement?.productIdentifier ?? null,
		expiresAt: entitlement?.expirationDate ?? null,
		willRenew: entitlement?.willRenew ?? false,
	};
}

async function persistEntitlement(isPro: boolean): Promise<void> {
	const store = useProStore.getState();
	store.setPro(isPro);
	store.setCachedGrant(isPro);
	if (isPro)
		await SecureStore.setItemAsync(
			ENTITLEMENT_KEY,
			'true',
			SECURE_STORE_OPTIONS,
		);
	else
		await SecureStore.deleteItemAsync(
			ENTITLEMENT_KEY,
			SECURE_STORE_OPTIONS,
		);
}

function configure(): boolean {
	if (configured) return true;
	if (!API_KEY) {
		useProStore.getState().setStore('unavailable');
		return false;
	}
	Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR).catch(
		() => undefined,
	);
	Purchases.configure({ apiKey: API_KEY });
	Purchases.addCustomerInfoUpdateListener((info) => {
		persistEntitlement(isProActive(info)).catch(() => undefined);
	});
	configured = true;
	useProStore.getState().setStore('available');
	return true;
}

async function currentOffering(): Promise<PurchasesOffering | null> {
	const offerings = await Purchases.getOfferings();
	return offerings.current;
}

export function plansInOffering(offering: PurchasesOffering): ProPlan[] {
	return selectProPlans(
		offering.availablePackages.map((pkg) => ({
			identifier: pkg.identifier,
			packageType: pkg.packageType,
			title: pkg.product.title,
			displayPrice: pkg.product.priceString,
			price: pkg.product.price,
			pricePerMonth: pkg.product.pricePerMonth,
			pricePerMonthString: pkg.product.pricePerMonthString,
			introPrice: pkg.product.introPrice
				? {
						price: pkg.product.introPrice.price,
						priceString: pkg.product.introPrice.priceString,
						periodUnit: pkg.product.introPrice.periodUnit,
						periodNumberOfUnits:
							pkg.product.introPrice.periodNumberOfUnits,
						cycles: pkg.product.introPrice.cycles,
					}
				: null,
		})),
	);
}

function packageFor(
	offering: PurchasesOffering,
	packageIdentifier: string,
): PurchasesPackage | null {
	return (
		offering.availablePackages.find(
			(pkg) => pkg.identifier === packageIdentifier,
		) ?? null
	);
}

export async function loadCachedEntitlement(): Promise<void> {
	const cached = await SecureStore.getItemAsync(
		ENTITLEMENT_KEY,
		SECURE_STORE_OPTIONS,
	).catch(() => null);
	useProStore.getState().setCachedGrant(cached === 'true');
}

export async function syncEntitlementWithStore(): Promise<void> {
	const cachedGrant = useProStore.getState().cachedGrant;
	if (!configure()) {
		useProStore
			.getState()
			.setPro(proAccessFromStoreResult(null, cachedGrant));
		return;
	}
	try {
		const active = isProActive(await Purchases.getCustomerInfo());
		await persistEntitlement(active);
	} catch {
		useProStore
			.getState()
			.setPro(proAccessFromStoreResult(null, cachedGrant));
	}
}

export async function loadProCustomer(): Promise<ProCustomer | null> {
	if (!configure()) return null;
	return customerFrom(await Purchases.getCustomerInfo());
}

export async function loadProPlans(): Promise<ProPlan[]> {
	if (!configure()) return [];
	const offering = await currentOffering();
	return offering ? plansInOffering(offering) : [];
}

function outcomeFromPaywall(result: PAYWALL_RESULT): PurchaseOutcome {
	if (
		result === PAYWALL_RESULT.PURCHASED ||
		result === PAYWALL_RESULT.RESTORED ||
		result === PAYWALL_RESULT.NOT_PRESENTED
	)
		return { kind: 'purchased' };
	if (result === PAYWALL_RESULT.CANCELLED) return { kind: 'cancelled' };
	return {
		kind: 'failed',
		message:
			'The paywall could not be shown. In RevenueCat, set a current offering that includes the lifetime, yearly and monthly packages, and attach a paywall to it.',
	};
}

export async function presentProPaywall(): Promise<PurchaseOutcome> {
	if (!configure())
		return {
			kind: 'failed',
			message: 'Purchases are not set up in this build.',
		};
	try {
		const result = await RevenueCatUI.presentPaywallIfNeeded({
			requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
		});
		const outcome = outcomeFromPaywall(result);
		if (outcome.kind === 'purchased') await syncEntitlementWithStore();
		return outcome;
	} catch {
		return {
			kind: 'failed',
			message: 'The store could not open the paywall.',
		};
	}
}

export async function purchaseProPackage(
	packageIdentifier: string,
): Promise<PurchaseOutcome> {
	if (!configure())
		return {
			kind: 'failed',
			message: 'Purchases are not set up in this build.',
		};
	try {
		const offering = await currentOffering();
		const pkg = offering ? packageFor(offering, packageIdentifier) : null;
		if (!pkg)
			return {
				kind: 'failed',
				message: 'That plan is not in the current offering.',
			};
		const { customerInfo } = await Purchases.purchasePackage(pkg);
		await persistEntitlement(isProActive(customerInfo));
		return isProActive(customerInfo)
			? { kind: 'purchased' }
			: {
					kind: 'failed',
					message: 'The purchase did not unlock PennyWise Pro.',
				};
	} catch (error) {
		const code =
			typeof error === 'object' && error !== null && 'code' in error
				? String((error as { code: unknown }).code)
				: null;
		if (code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)
			return { kind: 'cancelled' };
		return {
			kind: 'failed',
			message: 'The purchase could not be completed.',
		};
	}
}

export async function restorePro(): Promise<boolean> {
	if (!configure()) return false;
	const info = await Purchases.restorePurchases();
	await persistEntitlement(isProActive(info));
	return isProActive(info);
}

export async function presentCustomerCenter(): Promise<void> {
	if (!configure()) return;
	await RevenueCatUI.presentCustomerCenter({
		callbacks: {
			onRestoreCompleted: ({ customerInfo }) => {
				persistEntitlement(isProActive(customerInfo)).catch(
					() => undefined,
				);
			},
		},
	});
	await syncEntitlementWithStore();
}
