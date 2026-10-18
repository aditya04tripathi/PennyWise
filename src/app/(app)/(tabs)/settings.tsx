import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';

import {
	confirmAction,
	showMessage,
	userFacingError,
} from '@/components/feedback/confirm';
import { CurrencyPicker } from '@/components/forms/currency-picker';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { AppText } from '@/components/ui/text';
import type { AppearancePreference } from '@/domain/entities';
import { findCurrency } from '@/domain/money/currency';
import { eraseAllLocalData } from '@/features/session/bootstrap';
import { useSession } from '@/features/session/session-store';
import {
	changeCurrency,
	previewCurrencyChange,
	updateSettings,
} from '@/features/settings/settings-service';
import { useMoneyFormatter, useSettings } from '@/hooks/use-app-data';

export default function SettingsScreen() {
	const settings = useSettings();
	const security = useSession((state) => state.security);
	const formatAmount = useMoneyFormatter();
	const [pickingCurrency, setPickingCurrency] = useState(false);

	const selectCurrency = async (code: string) => {
		setPickingCurrency(false);
		if (code === settings.currencyCode) return;
		try {
			const preview = await previewCurrencyChange(code);
			const details =
				preview.exponentChange === 0
					? 'Amounts keep their values; only the currency label changes. Nothing is converted at an exchange rate.'
					: `${code} uses a different number of decimal places, so ${preview.affectedTransactions} amounts will be rewritten to keep the same value.${preview.roundedTransactions ? ` ${preview.roundedTransactions} of them will be rounded.` : ''} Nothing is converted at an exchange rate.`;
			const confirmed = await confirmAction({
				title: `Switch to ${code}?`,
				message: details,
				confirmLabel: 'Switch',
			});
			if (confirmed) await changeCurrency(code);
		} catch (error) {
			showMessage('Currency not changed', userFacingError(error));
		}
	};

	const eraseEverything = async () => {
		const confirmed = await confirmAction({
			title: 'Delete all data?',
			message:
				'Every transaction, category, card, receipt and setting on this device will be permanently deleted. Export a backup first if you want to keep anything.',
			confirmLabel: 'Delete everything',
			destructive: true,
		});
		if (!confirmed) return;
		const reallyConfirmed = await confirmAction({
			title: 'This cannot be undone',
			message: 'Are you absolutely sure?',
			confirmLabel: 'Delete',
			destructive: true,
		});
		if (reallyConfirmed) await eraseAllLocalData();
	};

	return (
		<Screen topInset title='Settings'>
			<Section title='Profile'>
				<Surface padded={false}>
					<ListRow
						icon='person'
						title='Name'
						value={settings.name || 'Not set'}
						onPress={() => router.push('/settings/profile')}
					/>
					<Divider inset={60} />
					<ListRow
						icon='currency'
						title='Currency'
						value={`${settings.currencyCode} · ${findCurrency(settings.currencyCode)?.name ?? ''}`}
						onPress={() => setPickingCurrency(true)}
					/>
				</Surface>
			</Section>

			<Section title='Money'>
				<Surface padded={false}>
					<ListRow
						icon='planning'
						title='Budget & alerts'
						value={
							settings.monthlyBudgetMinor
								? formatAmount(settings.monthlyBudgetMinor)
								: 'Not set'
						}
						onPress={() => router.push('/settings/budget')}
					/>
					<Divider inset={60} />
					<ListRow
						icon='account'
						title='Accounts'
						onPress={() => router.push('/accounts')}
					/>
					<Divider inset={60} />
					<ListRow
						icon='goal'
						title='Savings goals'
						onPress={() => router.push('/goals')}
					/>
					<Divider inset={60} />
					<ListRow
						icon='category'
						title='Categories'
						onPress={() => router.push('/categories')}
					/>
					<Divider inset={60} />
					<ListRow
						icon='card'
						title='Cards'
						onPress={() => router.push('/cards')}
					/>
					<Divider inset={60} />
					<ListRow
						icon='recurring'
						title='Recurring'
						onPress={() => router.push('/recurring')}
					/>
				</Surface>
			</Section>

			<Section title='Appearance'>
				<Surface>
					<SegmentedControl<AppearancePreference>
						accessibilityLabel='Appearance'
						value={settings.appearance}
						onChange={(appearance) =>
							updateSettings({ appearance })
						}
						options={[
							{ value: 'system', label: 'System' },
							{ value: 'light', label: 'Light' },
							{ value: 'dark', label: 'Dark' },
						]}
					/>
				</Surface>
				<Surface padded={false}>
					<ListRow
						icon='hidden'
						title='Hide amounts'
						subtitle='Show •••• instead of figures'
						toggle={{
							value: settings.hideAmounts,
							onChange: (hideAmounts) =>
								updateSettings({ hideAmounts }),
						}}
					/>
				</Surface>
			</Section>

			<Section title='Security & data'>
				<Surface padded={false}>
					<ListRow
						icon='lock'
						title='App lock'
						value={security.pinEnabled ? 'On' : 'Off'}
						onPress={() => router.push('/settings/security')}
					/>
					<Divider inset={60} />
					<ListRow
						icon='backup'
						title='Backup, restore & import'
						onPress={() => router.push('/settings/backup')}
					/>
					<Divider inset={60} />
					<ListRow
						icon='shield'
						title='Privacy & about'
						onPress={() => router.push('/settings/about')}
					/>
					<Divider inset={60} />
					<ListRow
						icon='delete'
						title='Delete all data'
						destructive
						onPress={eraseEverything}
					/>
				</Surface>
			</Section>

			<AppText variant='caption' tone='textTertiary' align='center'>
				PennyWise {Constants.expoConfig?.version ?? ''}
			</AppText>

			<CurrencyPicker
				visible={pickingCurrency}
				selected={settings.currencyCode}
				onClose={() => setPickingCurrency(false)}
				onSelect={selectCurrency}
			/>
		</Screen>
	);
}
