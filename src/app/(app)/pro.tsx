import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { showMessage } from '@/components/feedback/confirm';
import { ErrorState, LoadingState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import {
	describeIntroOffer,
	planPeriodLabel,
	yearlySavingsPercent,
	type ProBillingPeriod,
	type ProPlan,
} from '@/features/pro/plans';
import { useIsPro, useProStore } from '@/features/pro/pro-store';
import {
	loadProCustomer,
	loadProPlans,
	presentCustomerCenter,
	purchaseProPackage,
	restorePro,
	type ProCustomer,
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
		detail: 'Cash, current, savings and credit, with transfers between them.',
	},
	{
		icon: 'goal',
		title: 'Savings goals',
		detail: 'Set a target and record what you put aside.',
	},
	{
		icon: 'category',
		title: 'Category limits',
		detail: 'A monthly limit per category, with progress and alerts.',
	},
	{
		icon: 'spark',
		title: 'Insights',
		detail: 'Safe-to-spend per day, and repeating charges spotted from your history.',
	},
	{
		icon: 'close',
		title: 'No ads',
		detail: 'The banner on Home, Activity, Planning, Calendar and Settings goes away.',
	},
];

function planLabel(customer: ProCustomer): string {
	const name = customer.productIdentifier ?? 'PennyWise Pro';
	if (!customer.expiresAt) return `${name} · lifetime`;
	const date = new Date(customer.expiresAt).toLocaleDateString();
	return customer.willRenew
		? `${name} · renews ${date}`
		: `${name} · ends ${date}`;
}

function singleSubscription(plans: readonly ProPlan[]): ProPlan | null {
	const monthly = plans.filter((plan) => plan.billingPeriod === 'monthly');
	const yearly = plans.filter((plan) => plan.billingPeriod === 'yearly');
	if (monthly.length + yearly.length !== 1) return null;
	return monthly[0] ?? yearly[0] ?? null;
}

export default function ProScreen() {
	const theme = useTheme();
	const isPro = useIsPro();
	const store = useProStore((state) => state.store);
	const [plans, setPlans] = useState<ProPlan[]>([]);
	const [customer, setCustomer] = useState<ProCustomer | null>(null);
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
		'loading',
	);
	const [period, setPeriod] = useState<ProBillingPeriod>('yearly');
	const [busy, setBusy] = useState<string | null>(null);

	const load = useCallback(async () => {
		setStatus('loading');
		try {
			const [loadedPlans, loadedCustomer] = await Promise.all([
				isPro ? Promise.resolve([]) : loadProPlans(),
				isPro ? loadProCustomer() : Promise.resolve(null),
			]);
			setPlans(loadedPlans);
			setCustomer(loadedCustomer);
			setStatus('ready');
		} catch {
			setStatus('error');
		}
	}, [isPro]);

	useEffect(() => {
		load().catch(() => undefined);
	}, [load]);

	const monthly = plans.filter((plan) => plan.billingPeriod === 'monthly');
	const yearly = plans.filter((plan) => plan.billingPeriod === 'yearly');
	const canToggle = monthly.length === 1 && yearly.length === 1;
	const featured = canToggle
		? period === 'monthly'
			? monthly[0]
			: yearly[0]
		: singleSubscription(plans);
	const listed = featured
		? plans.filter((plan) => plan.identifier !== featured.identifier)
		: plans;
	const savings =
		canToggle && featured?.billingPeriod === 'yearly'
			? yearlySavingsPercent(monthly[0]?.price ?? null, yearly[0]?.price ?? null)
			: null;
	const intro = featured?.introPrice
		? describeIntroOffer(featured.introPrice)
		: null;

	const buy = async (packageIdentifier: string) => {
		setBusy(packageIdentifier);
		try {
			const outcome = await withAutoLockSuspended(() =>
				purchaseProPackage(packageIdentifier),
			);
			if (outcome.kind === 'purchased') router.back();
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

	const manage = async () => {
		setBusy('manage');
		try {
			await withAutoLockSuspended(presentCustomerCenter);
			await load();
		} catch {
			showMessage(
				'Could not open subscription settings',
				'Try again in a moment.',
			);
		} finally {
			setBusy(null);
		}
	};

	const purchaseLabel = featured
		? featured.billingPeriod === 'yearly'
			? 'Subscribe yearly'
			: featured.billingPeriod === 'monthly'
				? 'Subscribe monthly'
				: planPeriodLabel(featured) === 'Lifetime'
					? 'Buy lifetime'
					: 'Continue'
		: 'Continue';

	return (
		<Screen>
			<AppText variant='body' tone='textSecondary'>
				Everything from PennyWise 1 stays free, and anything you have
				already entered stays available.
			</AppText>
			<Surface padded={false}>
				{PRO_BENEFITS.map((benefit, index) => (
					<View key={benefit.title}>
						{index > 0 ? <Divider inset={60} /> : null}
						<ListRow
							icon={benefit.icon}
							title={benefit.title}
							subtitle={benefit.detail}
						/>
					</View>
				))}
			</Surface>

			{isPro ? (
				<>
					<AppText variant='bodyLarge' align='center' selectable>
						{customer ? planLabel(customer) : 'Pro is unlocked.'}
					</AppText>
					<Button
						label='Manage subscription'
						icon='settings'
						onPress={manage}
						loading={busy === 'manage'}
						disabled={busy !== null}
						fullWidth
					/>
				</>
			) : status === 'loading' ? (
				<LoadingState label='Loading plans' />
			) : status === 'error' ? (
				<ErrorState
					message='Plans could not be loaded.'
					onRetry={() => {
						load().catch(() => undefined);
					}}
				/>
			) : store === 'unavailable' ? (
				<AppText variant='body' tone='textSecondary' align='center'>
					Purchases are not set up in this build.
				</AppText>
			) : plans.length === 0 ? (
				<ErrorState
					message='Plans are not available right now.'
					onRetry={() => {
						load().catch(() => undefined);
					}}
				/>
			) : (
				<>
					{canToggle ? (
						<SegmentedControl<ProBillingPeriod>
							accessibilityLabel='Billing period'
							value={period}
							onChange={setPeriod}
							options={[
								{ value: 'monthly', label: 'Monthly' },
								{ value: 'yearly', label: 'Yearly' },
							]}
						/>
					) : null}
					{featured ? (
						<Surface style={{ gap: theme.spacing.xxs }}>
							<AppText variant='label' tone='textSecondary'>
								{planPeriodLabel(featured)}
							</AppText>
							<AppText variant='display' numeric selectable>
								{featured.displayPrice}
							</AppText>
							<AppText variant='body' tone='textSecondary'>
								{featured.billingPeriod === 'yearly'
									? featured.pricePerMonthString
										? `${featured.pricePerMonthString} a month, billed yearly`
										: 'Billed once a year'
									: featured.billingPeriod === 'monthly'
										? 'Billed every month'
										: featured.packageType === 'LIFETIME' ||
											  planPeriodLabel(featured) ===
													'Lifetime'
											? 'One payment, no renewal'
											: featured.title}
							</AppText>
							{intro ? (
								<AppText variant='body' selectable>
									{intro}
								</AppText>
							) : null}
							{savings ? (
								<AppText variant='body' tone='brandPrimary'>
									Save {savings}% compared with monthly
								</AppText>
							) : null}
						</Surface>
					) : null}
					{featured ? (
						<Button
							label={purchaseLabel}
							onPress={() => buy(featured.identifier)}
							loading={busy === featured.identifier}
							disabled={busy !== null}
							fullWidth
						/>
					) : null}
					{listed.length > 0 ? (
						<Section title={featured ? 'Also available' : 'Plans'}>
							<Surface padded={false}>
								{listed.map((plan, index) => {
									const offer = plan.introPrice
										? describeIntroOffer(plan.introPrice)
										: null;
									const lifetime =
										plan.packageType === 'LIFETIME' ||
										planPeriodLabel(plan) === 'Lifetime';
									return (
										<View key={plan.identifier}>
											{index > 0 ? <Divider /> : null}
											<ListRow
												title={planPeriodLabel(plan)}
												subtitle={
													offer ??
													(lifetime
														? 'One payment, no renewal'
														: undefined)
												}
												value={plan.displayPrice}
												onPress={() =>
													buy(plan.identifier)
												}
											/>
										</View>
									);
								})}
							</Surface>
						</Section>
					) : null}
					<Button
						label='Restore purchase'
						variant='ghost'
						onPress={restore}
						loading={busy === 'restore'}
						disabled={busy !== null}
					/>
				</>
			)}
			<AppText variant='caption' tone='textTertiary' align='center'>
				Payment is handled by the App Store or Google Play. PennyWise
				checks purchase status through RevenueCat, which receives an
				anonymous ID and your purchase receipt, never your financial
				data. Subscriptions renew until you cancel them in the store.
			</AppText>
		</Screen>
	);
}
