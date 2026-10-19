import mobileAds, {
	AdsConsent,
	MaxAdContentRating,
	TestIds,
} from 'react-native-google-mobile-ads';

export function bannerUnitId(): string | null {
	if (__DEV__) return TestIds.BANNER;
	const configured =
		process.env.EXPO_OS === 'ios'
			? process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID
			: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID;
	return configured || null;
}

let preparation: Promise<boolean> | null = null;

export function prepareAds(): Promise<boolean> {
	preparation ??= AdsConsent.gatherConsent()
		.then(async (consent) => {
			if (!consent.canRequestAds) return false;
			await mobileAds().setRequestConfiguration({
				maxAdContentRating: MaxAdContentRating.PG,
				tagForChildDirectedTreatment: false,
				tagForUnderAgeOfConsent: false,
			});
			await mobileAds().initialize();
			return true;
		})
		.catch(() => false);
	return preparation;
}

export async function showAdPrivacyOptions(): Promise<void> {
	await AdsConsent.showPrivacyOptionsForm();
}
