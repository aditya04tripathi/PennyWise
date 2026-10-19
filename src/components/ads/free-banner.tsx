import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { bannerUnitId, prepareAds } from '@/features/ads/ad-service';
import { useIsPro } from '@/features/pro/pro-store';
import {
	resumeAutoLock,
	suspendAutoLock,
} from '@/features/security/use-app-lock';
import { useTheme } from '@/theme/use-theme';

const BANNER_HEIGHT = 50;

export function FreeBanner() {
	const isPro = useIsPro();
	const unitId = bannerUnitId();
	const theme = useTheme();
	const [ready, setReady] = useState(false);
	const [hidden, setHidden] = useState(false);

	useEffect(() => {
		if (isPro || !unitId) return;
		let cancelled = false;
		prepareAds().then((allowed) => {
			if (!cancelled && allowed) setReady(true);
		});
		return () => {
			cancelled = true;
		};
	}, [isPro, unitId]);

	if (isPro || !unitId || !ready || hidden) return null;

	return (
		<View
			style={{
				width: '100%',
				maxHeight: BANNER_HEIGHT,
				height: BANNER_HEIGHT,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: theme.colors.background,
			}}>
			<BannerAd
				unitId={unitId}
				size={BannerAdSize.BANNER}
				requestOptions={{ requestNonPersonalizedAdsOnly: true }}
				onAdFailedToLoad={() => setHidden(true)}
				onAdOpened={suspendAutoLock}
				onAdClosed={resumeAutoLock}
			/>
		</View>
	);
}
