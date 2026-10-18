import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { showMessage, userFacingError } from '@/components/feedback/confirm';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { currencyExponent } from '@/domain/money/currency';
import { formatMoneyInput } from '@/domain/money/format';
import { parseAmountInput } from '@/domain/validation/amount-input';
import {
	notificationPermission,
	requestNotificationPermission,
	type NotificationPermission,
} from '@/features/notifications/local-notifications';
import { updateSettings } from '@/features/settings/settings-service';
import { useSettings } from '@/hooks/use-app-data';
import { useTheme } from '@/theme/use-theme';

const THRESHOLDS = [50, 75, 80, 90, 100] as const;

export default function BudgetScreen() {
	const theme = useTheme();
	const settings = useSettings();
	const exponent = currencyExponent(settings.currencyCode);
	const [amount, setAmount] = useState(
		settings.monthlyBudgetMinor
			? formatMoneyInput(
					settings.monthlyBudgetMinor,
					settings.currencyCode,
				)
			: '',
	);
	const [threshold, setThreshold] = useState(settings.budgetAlertPercent);
	const [alerts, setAlerts] = useState(settings.budgetAlertsEnabled);
	const [permission, setPermission] = useState<NotificationPermission | null>(
		null,
	);
	const [error, setError] = useState<string | undefined>();
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		notificationPermission().then(setPermission, () =>
			setPermission('undetermined'),
		);
	}, []);

	const toggleAlerts = async (enabled: boolean) => {
		setAlerts(enabled);
		if (enabled && permission !== 'granted')
			setPermission(await requestNotificationPermission());
	};

	const save = async () => {
		const parsed = parseAmountInput(amount, exponent);
		if (parsed.error) {
			setError(parsed.error);
			return;
		}
		setSaving(true);
		try {
			await updateSettings({
				monthlyBudgetMinor: parsed.minor,
				budgetAlertPercent: threshold,
				budgetAlertsEnabled: alerts,
			});
			router.back();
		} catch (saveError) {
			showMessage('Not saved', userFacingError(saveError));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Screen>
			<TextField
				label={`Monthly budget (${settings.currencyCode})`}
				value={amount}
				onChangeText={(text) => {
					setAmount(text);
					setError(undefined);
				}}
				keyboardType='decimal-pad'
				placeholder='No budget'
				error={error}
				hint='Total spending you want to stay under each calendar month.'
			/>
			<Section title='Alert me at'>
				<View
					style={{
						flexDirection: 'row',
						flexWrap: 'wrap',
						gap: theme.spacing.xs,
					}}>
					{THRESHOLDS.map((value) => (
						<Chip
							key={value}
							label={`${value}%`}
							selected={threshold === value}
							onPress={() => setThreshold(value)}
						/>
					))}
				</View>
			</Section>
			<Surface padded={false}>
				<ListRow
					icon='notifications'
					title='Budget notifications'
					subtitle='One alert at your threshold and one if you go over, each month.'
					toggle={{ value: alerts, onChange: toggleAlerts }}
				/>
			</Surface>
			{alerts && permission === 'denied' ? (
				<AppText variant='bodySmall' tone='warning'>
					Notifications are turned off for PennyWise in your device
					settings, so alerts cannot be shown. Your budget still
					appears on the overview.
				</AppText>
			) : null}
			<Button label='Save' onPress={save} loading={saving} fullWidth />
		</Screen>
	);
}
