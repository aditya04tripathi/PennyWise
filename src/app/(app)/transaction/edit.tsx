import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { CategoryBadge } from '@/components/finance/category-badge';
import { DateTimeField } from '@/components/forms/date-time-field';
import { showMessage, userFacingError } from '@/components/feedback/confirm';
import { LoadingState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { findTransaction } from '@/data/repositories/transaction-repository';
import {
	localDateOf,
	parseLocalDateTime,
	toLocalDateTime,
} from '@/domain/dates';
import {
	MAIN_ACCOUNT_ID,
	type RecurringFrequency,
	type Transaction,
	type TransactionType,
} from '@/domain/entities';
import { formatMoneyInput } from '@/domain/money/format';
import { describeRecurrence } from '@/domain/recurrence';
import type { TransactionDraftErrors } from '@/domain/validation/transaction-draft';
import {
	storeReceipt,
	deleteReceiptFiles,
} from '@/features/receipts/receipt-files';
import { withAutoLockSuspended } from '@/features/security/use-app-lock';
import { requireDatabase } from '@/features/session/session-store';
import { saveTransactionDraft } from '@/features/transactions/transaction-service';
import {
	useAccounts,
	useCards,
	useCategories,
	useSettings,
} from '@/hooks/use-app-data';
import { useReceiptImage } from '@/hooks/use-receipt-image';
import { useTheme } from '@/theme/use-theme';

type RepeatOption = 'none' | RecurringFrequency;

function defaultOccurredAt(date: string | undefined): string {
	const now = new Date();
	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return toLocalDateTime(now);
	return `${date}${toLocalDateTime(now).slice(10)}`;
}

export default function TransactionEditScreen() {
	const params = useLocalSearchParams<{
		id?: string;
		date?: string;
		type?: TransactionType;
	}>();
	const [existing, setExisting] = useState<Transaction | null | undefined>(
		params.id ? undefined : null,
	);

	useEffect(() => {
		if (!params.id) return;
		findTransaction(requireDatabase(), params.id).then(setExisting, () =>
			setExisting(null),
		);
	}, [params.id]);

	if (existing === undefined) return <LoadingState />;
	return (
		<TransactionForm
			existing={existing}
			initialDate={params.date}
			initialType={params.type}
		/>
	);
}

function TransactionForm({
	existing,
	initialDate,
	initialType,
}: {
	existing: Transaction | null;
	initialDate?: string;
	initialType?: TransactionType;
}) {
	const theme = useTheme();
	const settings = useSettings();
	const { categories } = useCategories(true);
	const { cards } = useCards();
	const { accounts } = useAccounts();
	const [type, setType] = useState<TransactionType>(
		existing?.type ?? (initialType === 'income' ? 'income' : 'expense'),
	);
	const [amountText, setAmountText] = useState(
		existing
			? formatMoneyInput(existing.amountMinor, settings.currencyCode)
			: '',
	);
	const [note, setNote] = useState(existing?.note ?? '');
	const [categoryId, setCategoryId] = useState<string | null>(
		existing?.categoryId ?? null,
	);
	const [cardId, setCardId] = useState<string | null>(
		existing?.cardId ?? null,
	);
	const [accountId, setAccountId] = useState(
		existing?.accountId ?? MAIN_ACCOUNT_ID,
	);
	const [occurredAt, setOccurredAt] = useState(
		existing?.occurredAt ?? defaultOccurredAt(initialDate),
	);
	const [repeat, setRepeat] = useState<RepeatOption>(
		existing?.recurrence?.frequency ?? 'none',
	);
	const [receiptFile, setReceiptFile] = useState<string | null>(
		existing?.receiptFile ?? null,
	);
	const receiptImage = useReceiptImage(receiptFile);
	const [errors, setErrors] = useState<TransactionDraftErrors>({});
	const [saving, setSaving] = useState(false);
	const pickedReceipts = useRef<string[]>([]);
	const saved = useRef(false);

	useEffect(
		() => () => {
			if (!saved.current) deleteReceiptFiles(pickedReceipts.current);
		},
		[],
	);

	const visibleCategories = categories.filter(
		(category) => !category.archivedAt || category.id === categoryId,
	);
	const isOccurrence = existing?.recurrenceSourceId != null;
	const occurredDate = parseLocalDateTime(occurredAt);
	const recurrence =
		repeat === 'none'
			? null
			: {
					frequency: repeat,
					day:
						repeat === 'weekly'
							? occurredDate.getDay() === 0
								? 7
								: occurredDate.getDay()
							: repeat === 'daily'
								? null
								: occurredDate.getDate(),
					month:
						repeat === 'yearly'
							? occurredDate.getMonth() + 1
							: null,
				};

	const pickReceipt = async (source: 'camera' | 'library') => {
		try {
			const options: ImagePicker.ImagePickerOptions = {
				mediaTypes: ['images'],
				quality: 0.7,
				allowsEditing: false,
				exif: false,
			};
			const result = await withAutoLockSuspended(async () => {
				if (source === 'camera') {
					const permission =
						await ImagePicker.requestCameraPermissionsAsync();
					if (!permission.granted) {
						showMessage(
							'Camera access needed',
							'Allow camera access in Settings to photograph receipts.',
						);
						return null;
					}
					return ImagePicker.launchCameraAsync(options);
				}
				return ImagePicker.launchImageLibraryAsync(options);
			});
			const asset =
				result && !result.canceled ? result.assets[0] : undefined;
			if (!asset) return;
			const stored = await storeReceipt(asset.uri);
			pickedReceipts.current.push(stored);
			setReceiptFile(stored);
		} catch (error) {
			showMessage('Receipt not attached', userFacingError(error));
		}
	};

	const save = async () => {
		setSaving(true);
		try {
			const result = await saveTransactionDraft(
				{
					amountText,
					type,
					categoryId,
					cardId,
					accountId,
					occurredAt,
					note,
					receiptFile,
					recurrence: isOccurrence ? null : recurrence,
				},
				existing?.id ?? null,
			);
			if (!result.ok) {
				setErrors(result.errors);
				return;
			}
			saved.current = true;
			deleteReceiptFiles(
				pickedReceipts.current.filter((file) => file !== receiptFile),
			);
			router.back();
		} catch (error) {
			showMessage('Not saved', userFacingError(error));
		} finally {
			setSaving(false);
		}
	};

	const receiptPreview =
		receiptImage.status === 'ready' ? receiptImage.uri : null;

	return (
		<>
			<Stack.Screen
				options={{
					title: existing ? 'Edit transaction' : 'New transaction',
					headerRight: () => (
						<Button
							label='Save'
							variant='ghost'
							compact
							onPress={save}
							loading={saving}
						/>
					),
				}}
			/>
			<Screen>
				<SegmentedControl
					accessibilityLabel='Transaction type'
					value={type}
					onChange={setType}
					options={[
						{ value: 'expense', label: 'Expense' },
						{ value: 'income', label: 'Income' },
					]}
				/>
				<TextField
					label={`Amount (${settings.currencyCode})`}
					value={amountText}
					onChangeText={(text) => {
						setAmountText(text);
						if (errors.amount)
							setErrors({ ...errors, amount: undefined });
					}}
					keyboardType='decimal-pad'
					placeholder='0.00'
					autoFocus={!existing}
					error={errors.amount}
					style={{
						fontSize: 28,
						fontWeight: '600',
						fontVariant: ['tabular-nums'],
					}}
				/>
				<TextField
					label='Description'
					value={note}
					onChangeText={(text) => {
						setNote(text);
						if (errors.note)
							setErrors({ ...errors, note: undefined });
					}}
					placeholder='What was it for?'
					maxLength={500}
					error={errors.note}
				/>

				<Section title='Category'>
					<View
						style={{
							flexDirection: 'row',
							flexWrap: 'wrap',
							gap: theme.spacing.xs,
						}}
						accessibilityRole='radiogroup'>
						{visibleCategories.map((category) => (
							<Chip
								key={category.id}
								label={category.name}
								selected={categoryId === category.id}
								leading={
									<CategoryBadge
										category={category}
										size={20}
									/>
								}
								onPress={() => {
									setCategoryId(category.id);
									if (errors.category)
										setErrors({
											...errors,
											category: undefined,
										});
								}}
							/>
						))}
						<Chip
							label='Manage…'
							selected={false}
							onPress={() => router.push('/categories')}
						/>
					</View>
					{errors.category ? (
						<AppText
							variant='bodySmall'
							tone='negative'
							accessibilityRole='alert'>
							{errors.category}
						</AppText>
					) : null}
				</Section>

				<Surface>
					<DateTimeField
						label='Date'
						value={occurredAt}
						onChange={setOccurredAt}
					/>
					{occurredAt > toLocalDateTime(new Date()) ? (
						<AppText variant='bodySmall' tone='textSecondary'>
							Future-dated transactions are shown as scheduled and
							are not counted in your balance until then.
						</AppText>
					) : null}
				</Surface>

				{!isOccurrence ? (
					<Section title='Repeat'>
						<View
							style={{
								flexDirection: 'row',
								flexWrap: 'wrap',
								gap: theme.spacing.xs,
							}}>
							{(
								[
									'none',
									'daily',
									'weekly',
									'monthly',
									'yearly',
								] as const
							).map((option) => (
								<Chip
									key={option}
									label={
										option === 'none'
											? 'Never'
											: option[0]!.toUpperCase() +
												option.slice(1)
									}
									selected={repeat === option}
									onPress={() => setRepeat(option)}
								/>
							))}
						</View>
						{recurrence ? (
							<AppText variant='bodySmall' tone='textSecondary'>
								{describeRecurrence(recurrence)}, starting{' '}
								{localDateOf(occurredAt)}. Each occurrence is
								added only when you confirm it under Recurring.
							</AppText>
						) : null}
						{errors.recurrence ? (
							<AppText variant='bodySmall' tone='negative'>
								{errors.recurrence}
							</AppText>
						) : null}
					</Section>
				) : null}

				{accounts.length > 1 ? (
					<Section title='Account'>
						<View
							style={{
								flexDirection: 'row',
								flexWrap: 'wrap',
								gap: theme.spacing.xs,
							}}>
							{accounts.map(({ account }) => (
								<Chip
									key={account.id}
									label={account.name}
									selected={accountId === account.id}
									onPress={() => setAccountId(account.id)}
								/>
							))}
						</View>
					</Section>
				) : null}

				{cards.length > 0 ? (
					<Section title='Card (optional)'>
						<View
							style={{
								flexDirection: 'row',
								flexWrap: 'wrap',
								gap: theme.spacing.xs,
							}}>
							<Chip
								label='None'
								selected={cardId === null}
								onPress={() => setCardId(null)}
							/>
							{cards.map((card) => (
								<Chip
									key={card.id}
									label={`${card.bankName} ·${card.lastFour}`}
									selected={cardId === card.id}
									onPress={() => setCardId(card.id)}
								/>
							))}
						</View>
					</Section>
				) : null}

				<Section title='Receipt'>
					{receiptPreview ? (
						<View style={{ gap: theme.spacing.xs }}>
							<Image
								source={{ uri: receiptPreview }}
								style={{
									width: '100%',
									height: 220,
									borderRadius: theme.radii.md,
								}}
								contentFit='cover'
								accessibilityLabel='Attached receipt'
							/>
							<Button
								label='Remove receipt'
								variant='destructive'
								compact
								icon='delete'
								onPress={() => setReceiptFile(null)}
							/>
						</View>
					) : (
						<View
							style={{
								flexDirection: 'row',
								gap: theme.spacing.xs,
							}}>
							<Button
								label='Take photo'
								icon='camera'
								variant='secondary'
								compact
								onPress={() => pickReceipt('camera')}
							/>
							<Button
								label='Choose photo'
								icon='photo'
								variant='secondary'
								compact
								onPress={() => pickReceipt('library')}
							/>
						</View>
					)}
				</Section>

				<Button
					label={existing ? 'Save changes' : 'Add transaction'}
					onPress={save}
					loading={saving}
					fullWidth
				/>
			</Screen>
		</>
	);
}
