import * as SecureStore from 'expo-secure-store';
import Purchases, {
	LOG_LEVEL,
	PURCHASES_ERROR_CODE,
	type CustomerInfo,
	type PurchasesPackage,
} from 'react-native-purchases';

import { useProStore } from './pro-store';

export const PRO_ENTITLEMENT_ID =
	process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? 'pro';

const API_KEY =
	process.env.EXPO_OS === 'ios'
		? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
		: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

const ENTITLEMENT_KEY = 'pennywise.pro-entitlement.v1';
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
	keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export interface ProOffer {
	title: string;
	displayPrice: string;
}

export type PurchaseOutcome =
	| { kind: 'purchased' }
	| { kind: 'pending' }
	| { kind: 'cancelled' }
	| { kind: 'failed'; message: string };

let configured = false;

function isProActive(info: CustomerInfo): boolean {
	return info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

async function persistEntitlement(isPro: boolean): Promise<void> {
	useProStore.getState().setPro(isPro);
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
	Purchases.setLogLevel(LOG_LEVEL.ERROR).catch(() => undefined);
	Purchases.configure({ apiKey: API_KEY });
	Purchases.addCustomerInfoUpdateListener((info) => {
		persistEntitlement(isProActive(info)).catch(() => undefined);
	});
	configured = true;
	useProStore.getState().setStore('available');
	return true;
}

async function proPackage(): Promise<PurchasesPackage | null> {
	const offerings = await Purchases.getOfferings();
	const current = offerings.current;
	if (!current) return null;
	return current.lifetime ?? current.availablePackages[0] ?? null;
}

export async function loadCachedEntitlement(): Promise<void> {
	const cached = await SecureStore.getItemAsync(
		ENTITLEMENT_KEY,
		SECURE_STORE_OPTIONS,
	).catch(() => null);
	useProStore.getState().setPro(cached === 'true');
}

export async function syncEntitlementWithStore(): Promise<void> {
	if (!configure()) return;
	await persistEntitlement(isProActive(await Purchases.getCustomerInfo()));
}

export async function loadProOffer(): Promise<ProOffer | null> {
	if (!configure()) return null;
	const pkg = await proPackage();
	return pkg
		? { title: pkg.product.title, displayPrice: pkg.product.priceString }
		: null;
}

function errorCode(error: unknown): string | null {
	return typeof error === 'object' && error !== null && 'code' in error
		? String((error as { code: unknown }).code)
		: null;
}

export async function buyPro(): Promise<PurchaseOutcome> {
	if (!configure())
		return {
			kind: 'failed',
			message: 'Purchases are not set up in this build.',
		};
	try {
		const pkg = await proPackage();
		if (!pkg)
			return {
				kind: 'failed',
				message: 'PennyWise Pro is not available right now.',
			};
		const { customerInfo } = await Purchases.purchasePackage(pkg);
		await persistEntitlement(isProActive(customerInfo));
		return isProActive(customerInfo)
			? { kind: 'purchased' }
			: { kind: 'failed', message: 'The purchase did not unlock Pro.' };
	} catch (error) {
		const code = errorCode(error);
		if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)
			return { kind: 'cancelled' };
		if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR)
			return { kind: 'pending' };
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
