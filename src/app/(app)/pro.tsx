import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { showMessage } from '@/components/feedback/confirm';
import { LoadingState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useIsPro } from '@/features/pro/pro-store';
import {
	buyPro,
	loadProOffer,
	restorePro,
	type ProOffer,
} from '@/features/pro/purchase-service';
import { withAutoLockSuspended } from '@/features/security/use-app-lock';
import { useTheme } from '@/theme/use-theme';

const PRO_BENEFITS: readonly {
	icon: IconName;
	title: string;
	detail: string;
}[] = [
	{
		icon: 'account',
		title: 'Multiple accounts',
		detail: 'Track cash, current, savings and credit accounts, with transfers between them.',
	},
	{
		icon: 'goal',
		title: 'Savings goals',
		detail: 'Set targets and record what you put aside.',
	},
	{
		icon: 'category',
		title: 'Category limits',
		detail: 'Monthly limits per category, with progress and alerts.',
	},
	{
		icon: 'spark',
		title: 'Insights',
		detail: 'Safe-to-spend per day and detection of repeating charges.',
	},
];

type OfferState =
	| { status: 'loading' }
	| { status: 'ready'; offer: ProOffer }
	| { status: 'unavailable' };

export default function ProScreen() {
	const theme = useTheme();
	const isPro = useIsPro();
	const [offer, setOffer] = useState<OfferState>({ status: 'loading' });
	const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadProOffer()
			.catch(() => null)
			.then((loaded) => {
				if (!cancelled)
					setOffer(
						loaded
							? { status: 'ready', offer: loaded }
							: { status: 'unavailable' },
					);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const buy = async () => {
		setBusy('buy');
		try {
			const outcome = await withAutoLockSuspended(buyPro);
			if (outcome.kind === 'purchased') router.back();
			else if (outcome.kind === 'pending')
				showMessage(
					'Purchase pending',
					'Pro unlocks as soon as the store confirms the payment.',
				);
			else if (outcome.kind === 'failed')
				showMessage('Purchase not completed', outcome.message);
		} finally {
			setBusy(null);
		}
	};

	const restore = async () => {
		setBusy('restore');
		try {
			const restored = await withAutoLockSuspended(restorePro);
			showMessage(
				restored ? 'Pro restored' : 'Nothing to restore',
				restored
					? 'Thanks for supporting PennyWise.'
					: 'No Pro purchase was found for this store account.',
			);
			if (restored) router.back();
		} catch {
			showMessage(
				'Restore failed',
				'The store could not be reached. Try again later.',
			);
		} finally {
			setBusy(null);
		}
	};

	return (
		<Screen>
			<View style={{ gap: theme.spacing.xs }}>
				<AppText variant='heading1'>PennyWise Pro</AppText>
				<AppText variant='body' tone='textSecondary'>
					One payment, yours for good. Everything from PennyWise 1
					stays free, and anything you have already entered stays
					available even without Pro.
				</AppText>
			</View>
			<Surface style={{ gap: theme.spacing.md }}>
				{PRO_BENEFITS.map((benefit) => (
					<View
						key={benefit.title}
						style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
						<Icon
							name={benefit.icon}
							size={20}
							color={theme.colors.brandPrimary}
						/>
						<View style={{ flex: 1, gap: 2 }}>
							<AppText variant='label'>{benefit.title}</AppText>
							<AppText variant='bodySmall' tone='textSecondary'>
								{benefit.detail}
							</AppText>
						</View>
					</View>
				))}
			</Surface>
			{isPro ? (
				<AppText variant='bodyLarge' align='center'>
					Pro is unlocked. Thank you.
				</AppText>
			) : offer.status === 'loading' ? (
				<LoadingState label='Loading price' />
			) : offer.status === 'ready' ? (
				<Button
					label={`Unlock Pro · ${offer.offer.displayPrice}`}
					onPress={buy}
					loading={busy === 'buy'}
					disabled={busy !== null}
					fullWidth
				/>
			) : (
				<AppText
					variant='bodySmall'
					tone='textSecondary'
					align='center'>
					The store is not available right now, or this build is not
					connected to the App Store or Google Play.
				</AppText>
			)}
			{isPro ? null : (
				<Button
					label='Restore purchase'
					variant='ghost'
					onPress={restore}
					loading={busy === 'restore'}
					disabled={busy !== null}
				/>
			)}
			<AppText variant='caption' tone='textTertiary' align='center'>
				Payment is handled by the App Store or Google Play. Purchase
				status is checked through RevenueCat, which receives an
				anonymous ID and your purchase receipt, never your financial
				data.
			</AppText>
		</Screen>
	);
}
