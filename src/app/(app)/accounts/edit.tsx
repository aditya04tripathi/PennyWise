import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
	confirmAction,
	showMessage,
	userFacingError,
} from '@/components/feedback/confirm';
import { LoadingState } from '@/components/feedback/states';
import { ColorSwatches } from '@/components/forms/color-swatches';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import {
	MAIN_ACCOUNT_ID,
	type Account,
	type AccountKind,
} from '@/domain/entities';
import { currencyExponent } from '@/domain/money/currency';
import { formatMoneyInput } from '@/domain/money/format';
import { parseAmountInput } from '@/domain/validation/amount-input';
import {
	ACCOUNT_KIND_LABELS,
	accountUsage,
	archiveAccount,
	removeAccount,
	saveAccount,
	validateAccountName,
} from '@/features/accounts/account-service';
import { useAccounts, useSettings } from '@/hooks/use-app-data';
import { useTheme } from '@/theme/use-theme';

const ACCOUNT_COLORS = [
	'#176B57',
	'#2B6CB0',
	'#6B46C1',
	'#B83280',
	'#B7791F',
	'#1F2937',
] as const;

export default function AccountEditScreen() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	const query = useAccounts();
	if (query.status === 'loading') return <LoadingState />;
	return <AccountForm existing={id ? (query.byId.get(id) ?? null) : null} />;
}

function AccountForm({ existing }: { existing: Account | null }) {
	const theme = useTheme();
	const { currencyCode } = useSettings();
	const exponent = currencyExponent(currencyCode);
	const [name, setName] = useState(existing?.name ?? '');
	const [kind, setKind] = useState<AccountKind>(existing?.kind ?? 'checking');
	const [color, setColor] = useState(existing?.color ?? ACCOUNT_COLORS[0]);
	const [opening, setOpening] = useState(
		existing?.openingBalanceMinor
			? formatMoneyInput(existing.openingBalanceMinor, currencyCode)
			: '',
	);
	const [errors, setErrors] = useState<{ name?: string; opening?: string }>(
		{},
	);
	const [saving, setSaving] = useState(false);
	const isMain = existing?.id === MAIN_ACCOUNT_ID;

	const save = async () => {
		const nameError = validateAccountName(name) ?? undefined;
		const parsed = parseAmountInput(opening, exponent, 'signed');
		setErrors({ name: nameError, opening: parsed.error });
		if (nameError || parsed.error) return;
		setSaving(true);
		try {
			await saveAccount(
				{ name, kind, color, openingBalanceMinor: parsed.minor ?? 0 },
				existing,
			);
			router.back();
		} catch (error) {
			showMessage('Not saved', userFacingError(error));
		} finally {
			setSaving(false);
		}
	};

	const remove = async () => {
		if (!existing) return;
		const usage = await accountUsage(existing.id);
		if (usage > 0) {
			const confirmed = await confirmAction({
				title: 'Archive account?',
				message: `${usage} transactions or transfers use this account, so it can't be deleted. Archiving hides it from pickers and keeps its history.`,
				confirmLabel: 'Archive',
			});
			if (!confirmed) return;
			await archiveAccount(existing);
		} else {
			const confirmed = await confirmAction({
				title: 'Delete account?',
				message: 'This account has no transactions or transfers.',
				confirmLabel: 'Delete',
				destructive: true,
			});
			if (!confirmed) return;
			await removeAccount(existing.id);
		}
		router.back();
	};

	return (
		<Screen>
			<TextField
				label='Name'
				value={name}
				onChangeText={setName}
				maxLength={40}
				error={errors.name}
				autoFocus={!existing}
			/>
			<Section title='Type'>
				<View
					style={{
						flexDirection: 'row',
						flexWrap: 'wrap',
						gap: theme.spacing.xs,
					}}>
					{(Object.keys(ACCOUNT_KIND_LABELS) as AccountKind[]).map(
						(option) => (
							<Chip
								key={option}
								label={ACCOUNT_KIND_LABELS[option]}
								selected={kind === option}
								onPress={() => setKind(option)}
							/>
						),
					)}
				</View>
			</Section>
			<TextField
				label='Opening balance'
				value={opening}
				onChangeText={setOpening}
				keyboardType='numbers-and-punctuation'
				placeholder='0'
				error={errors.opening}
				hint='The balance before your first recorded transaction. Use a minus sign for money owed, such as a credit card.'
			/>
			<Section title='Colour'>
				<ColorSwatches
					colors={ACCOUNT_COLORS}
					value={color}
					onChange={setColor}
				/>
			</Section>
			<Button
				label={existing ? 'Save changes' : 'Add account'}
				onPress={save}
				loading={saving}
				fullWidth
			/>
			{existing && !isMain ? (
				<Button
					label='Archive or delete'
					variant='destructive'
					icon='delete'
					onPress={() =>
						remove().catch((error) =>
							showMessage('Not changed', userFacingError(error)),
						)
					}
					fullWidth
				/>
			) : null}
			{isMain ? (
				<AppText variant='caption' tone='textTertiary' align='center'>
					The main account holds transactions imported from earlier
					versions and can&apos;t be removed.
				</AppText>
			) : null}
		</Screen>
	);
}
