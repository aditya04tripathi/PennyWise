import { router } from 'expo-router';
import { useState } from 'react';

import { showMessage, userFacingError } from '@/components/feedback/confirm';
import { LoadingState } from '@/components/feedback/states';
import { DateTimeField } from '@/components/forms/date-time-field';
import { Button } from '@/components/ui/button';
import { MenuPicker } from '@/components/ui/menu-picker';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { TextField } from '@/components/ui/text-field';
import { toLocalDateTime } from '@/domain/dates';
import { currencyExponent } from '@/domain/money/currency';
import { parseAmountInput } from '@/domain/validation/amount-input';
import {
	saveTransfer,
	validateTransfer,
	type AccountWithBalance,
} from '@/features/accounts/account-service';
import {
	useAccounts,
	useMoneyFormatter,
	useSettings,
} from '@/hooks/use-app-data';

export default function TransferScreen() {
	const query = useAccounts();
	if (query.status === 'loading') return <LoadingState />;
	return <TransferForm accounts={query.accounts} />;
}

function TransferForm({
	accounts,
}: {
	accounts: readonly AccountWithBalance[];
}) {
	const { currencyCode } = useSettings();
	const formatAmount = useMoneyFormatter();
	const exponent = currencyExponent(currencyCode);
	const [fromAccountId, setFrom] = useState(accounts[0]?.account.id ?? '');
	const [toAccountId, setTo] = useState(accounts[1]?.account.id ?? '');
	const [amount, setAmount] = useState('');
	const [occurredAt, setOccurredAt] = useState(() =>
		toLocalDateTime(new Date()),
	);
	const [note, setNote] = useState('');
	const [error, setError] = useState<string | undefined>();
	const [saving, setSaving] = useState(false);

	const save = async () => {
		const parsed = parseAmountInput(amount, exponent);
		if (parsed.error || parsed.minor === null) {
			setError(parsed.error ?? 'Enter an amount');
			return;
		}
		const input = {
			fromAccountId,
			toAccountId,
			amountMinor: parsed.minor,
			occurredAt,
			note,
		};
		const validation = validateTransfer(input);
		setError(validation ?? undefined);
		if (validation) return;
		setSaving(true);
		try {
			await saveTransfer(input);
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
				label='Amount'
				value={amount}
				onChangeText={setAmount}
				keyboardType='decimal-pad'
				placeholder='0'
				error={error}
				autoFocus
			/>
			<Surface padded={false}>
				<MenuPicker
					label='From'
					value={fromAccountId}
					onChange={setFrom}
					options={accounts.map((entry) => ({
						value: entry.account.id,
						label: `${entry.account.name} · ${formatAmount(entry.balanceMinor)}`,
					}))}
				/>
			</Surface>
			<Surface padded={false}>
				<MenuPicker
					label='To'
					value={toAccountId}
					onChange={setTo}
					options={accounts.map((entry) => ({
						value: entry.account.id,
						label: `${entry.account.name} · ${formatAmount(entry.balanceMinor)}`,
					}))}
				/>
			</Surface>
			<DateTimeField
				label='Date'
				value={occurredAt}
				onChange={setOccurredAt}
			/>
			<TextField
				label='Note (optional)'
				value={note}
				onChangeText={setNote}
				maxLength={120}
			/>
			<Button
				label='Save transfer'
				icon='transfer'
				onPress={save}
				loading={saving}
				fullWidth
			/>
		</Screen>
	);
}
