import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
	confirmAction,
	showMessage,
	userFacingError,
} from '@/components/feedback/confirm';
import { LoadingState } from '@/components/feedback/states';
import { GoalCard } from '@/components/finance/goal-card';
import { ColorSwatches } from '@/components/forms/color-swatches';
import { DateTimeField } from '@/components/forms/date-time-field';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { listContributions } from '@/data/repositories/goal-repository';
import { addDays, localDateOf, toLocalDateTime } from '@/domain/dates';
import type { SavingsGoal } from '@/domain/entities';
import { currencyExponent } from '@/domain/money/currency';
import { formatMoneyInput } from '@/domain/money/format';
import { parseAmountInput } from '@/domain/validation/amount-input';
import {
	addContribution,
	removeGoal,
	saveGoal,
	validateGoalInput,
	type GoalProgress,
} from '@/features/goals/goal-service';
import { useGoals, useMoneyFormatter, useSettings } from '@/hooks/use-app-data';
import { useLedgerQuery } from '@/hooks/use-ledger-query';
import { formatShortDate } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

const GOAL_COLORS = [
	'#176B57',
	'#2B6CB0',
	'#6B46C1',
	'#B83280',
	'#B7791F',
	'#9C4221',
] as const;

export default function GoalEditScreen() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	const query = useGoals();
	if (query.status === 'loading') return <LoadingState />;
	const progress = id
		? (query.goals.find((entry) => entry.goal.id === id) ?? null)
		: null;
	return (
		<Screen>
			{progress ? <Contributions progress={progress} /> : null}
			<GoalForm existing={progress?.goal ?? null} />
		</Screen>
	);
}

function Contributions({ progress }: { progress: GoalProgress }) {
	const theme = useTheme();
	const formatAmount = useMoneyFormatter();
	const { currencyCode } = useSettings();
	const [amount, setAmount] = useState('');
	const [error, setError] = useState<string | undefined>();
	const history = useLedgerQuery(
		(db) => listContributions(db, progress.goal.id),
		[progress.goal.id],
	);

	const record = async (direction: 1 | -1) => {
		const parsed = parseAmountInput(amount, currencyExponent(currencyCode));
		if (parsed.error || parsed.minor === null) {
			setError(parsed.error ?? 'Enter an amount');
			return;
		}
		if (direction === -1 && parsed.minor > progress.savedMinor) {
			setError('You cannot withdraw more than you have saved');
			return;
		}
		setError(undefined);
		try {
			await addContribution(progress.goal.id, parsed.minor * direction);
			setAmount('');
		} catch (recordError) {
			showMessage('Not saved', userFacingError(recordError));
		}
	};

	return (
		<>
			<GoalCard progress={progress} />
			<TextField
				label='Amount'
				value={amount}
				onChangeText={setAmount}
				keyboardType='decimal-pad'
				placeholder='0'
				error={error}
			/>
			<View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
				<View style={{ flex: 1 }}>
					<Button
						label='Add to goal'
						icon='add'
						onPress={() => record(1)}
						fullWidth
					/>
				</View>
				<View style={{ flex: 1 }}>
					<Button
						label='Withdraw'
						variant='secondary'
						onPress={() => record(-1)}
						fullWidth
					/>
				</View>
			</View>
			{(history.data ?? []).length > 0 ? (
				<Section title='History'>
					<Surface padded={false}>
						{(history.data ?? []).map((entry, index) => (
							<View key={entry.id}>
								{index > 0 ? <Divider inset={16} /> : null}
								<ListRow
									title={
										entry.amountMinor > 0
											? 'Added'
											: 'Withdrawn'
									}
									subtitle={formatShortDate(
										localDateOf(entry.occurredAt),
									)}
									value={formatAmount(
										Math.abs(entry.amountMinor),
									)}
								/>
							</View>
						))}
					</Surface>
				</Section>
			) : null}
		</>
	);
}

function GoalForm({ existing }: { existing: SavingsGoal | null }) {
	const { currencyCode } = useSettings();
	const exponent = currencyExponent(currencyCode);
	const [name, setName] = useState(existing?.name ?? '');
	const [target, setTarget] = useState(
		existing ? formatMoneyInput(existing.targetMinor, currencyCode) : '',
	);
	const [targetDate, setTargetDate] = useState<string | null>(
		existing?.targetDate ?? null,
	);
	const [color, setColor] = useState(existing?.color ?? GOAL_COLORS[0]);
	const [errors, setErrors] = useState<{ name?: string; target?: string }>(
		{},
	);
	const [saving, setSaving] = useState(false);

	const save = async () => {
		const nameError = validateGoalInput({ name }) ?? undefined;
		const parsed = parseAmountInput(target, exponent);
		const targetError =
			parsed.error ??
			(parsed.minor === null ? 'Enter a target' : undefined);
		setErrors({ name: nameError, target: targetError });
		if (nameError || targetError || parsed.minor === null) return;
		setSaving(true);
		try {
			await saveGoal(
				{ name, targetMinor: parsed.minor, targetDate, color },
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
		const confirmed = await confirmAction({
			title: `Delete ${existing.name}?`,
			message:
				'The goal and its contribution history will be deleted. Your transactions and balances are not affected.',
			confirmLabel: 'Delete',
			destructive: true,
		});
		if (!confirmed) return;
		await removeGoal(existing.id);
		router.back();
	};

	return (
		<Section title={existing ? 'Goal details' : undefined}>
			<TextField
				label='Name'
				value={name}
				onChangeText={setName}
				maxLength={40}
				error={errors.name}
				autoFocus={!existing}
			/>
			<TextField
				label='Target amount'
				value={target}
				onChangeText={setTarget}
				keyboardType='decimal-pad'
				placeholder='0'
				error={errors.target}
			/>
			{targetDate ? (
				<>
					<DateTimeField
						label='Target date'
						mode='date'
						value={`${targetDate}T00:00:00.000`}
						onChange={(value) => setTargetDate(localDateOf(value))}
					/>
					<Button
						label='Remove target date'
						variant='ghost'
						onPress={() => setTargetDate(null)}
					/>
				</>
			) : (
				<Button
					label='Add a target date'
					variant='ghost'
					icon='calendar'
					onPress={() =>
						setTargetDate(
							localDateOf(
								toLocalDateTime(addDays(new Date(), 90)),
							),
						)
					}
				/>
			)}
			<ColorSwatches
				colors={GOAL_COLORS}
				value={color}
				onChange={setColor}
			/>
			<Button
				label={existing ? 'Save changes' : 'Add goal'}
				onPress={save}
				loading={saving}
				fullWidth
			/>
			{existing ? (
				<Button
					label='Delete goal'
					variant='destructive'
					icon='delete'
					onPress={() =>
						remove().catch((error) =>
							showMessage('Not deleted', userFacingError(error)),
						)
					}
					fullWidth
				/>
			) : null}
			{existing ? null : (
				<AppText variant='caption' tone='textTertiary' align='center'>
					Goals track money you set aside. They don&apos;t move money
					between accounts.
				</AppText>
			)}
		</Section>
	);
}
