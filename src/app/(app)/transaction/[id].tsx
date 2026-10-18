import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CategoryBadge } from '@/components/finance/category-badge';
import {
	confirmAction,
	showMessage,
	userFacingError,
} from '@/components/feedback/confirm';
import { EmptyState, LoadingState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Divider, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { findTransaction } from '@/data/repositories/transaction-repository';
import { isPosted } from '@/domain/calculations/ledger';
import { localDateOf, toLocalDateTime } from '@/domain/dates';
import { describeRecurrence } from '@/domain/recurrence';
import { removeTransaction } from '@/features/transactions/transaction-service';
import {
	useAccounts,
	useCards,
	useCategories,
	useMoneyFormatter,
} from '@/hooks/use-app-data';
import { useLedgerQuery } from '@/hooks/use-ledger-query';
import { useReceiptImage } from '@/hooks/use-receipt-image';
import { formatFullDay, formatTime } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

export default function TransactionDetailScreen() {
	const theme = useTheme();
	const { id } = useLocalSearchParams<{ id: string }>();
	const formatAmount = useMoneyFormatter();
	const { byId: categories } = useCategories(true);
	const { byId: cards } = useCards();
	const { accounts, byId: accountById } = useAccounts();
	const [deleting, setDeleting] = useState(false);
	const query = useLedgerQuery((db) => findTransaction(db, id), [id]);
	const receipt = useReceiptImage(query.data?.receiptFile ?? null);

	if (query.status === 'loading') return <LoadingState />;
	const transaction = query.data;
	if (!transaction)
		return (
			<EmptyState
				icon='activity'
				title='Transaction not found'
				message='It may have been deleted.'
				actionLabel='Go back'
				onAction={() => router.back()}
			/>
		);

	const category = categories.get(transaction.categoryId);
	const card = transaction.cardId ? cards.get(transaction.cardId) : undefined;
	const income = transaction.type === 'income';
	const scheduled = !isPosted(transaction, toLocalDateTime(new Date()));

	const remove = async () => {
		const confirmed = await confirmAction({
			title: 'Delete transaction?',
			message: transaction.recurrence
				? 'This also stops it from repeating. Occurrences you already recorded are kept.'
				: 'This cannot be undone.',
			confirmLabel: 'Delete',
			destructive: true,
		});
		if (!confirmed) return;
		setDeleting(true);
		try {
			await removeTransaction(transaction);
			router.back();
		} catch (error) {
			showMessage('Not deleted', userFacingError(error));
			setDeleting(false);
		}
	};

	return (
		<>
			<Stack.Screen
				options={{
					headerRight: () => (
						<Button
							label='Edit'
							variant='ghost'
							compact
							onPress={() =>
								router.push({
									pathname: '/transaction/edit',
									params: { id: transaction.id },
								})
							}
						/>
					),
				}}
			/>
			<Screen>
				<View
					style={{
						alignItems: 'center',
						gap: theme.spacing.sm,
						paddingVertical: theme.spacing.md,
					}}>
					<CategoryBadge category={category} size={56} />
					<AppText
						variant='display'
						numeric
						tone={income ? 'positive' : 'textPrimary'}
						align='center'>
						{formatAmount(
							income
								? transaction.amountMinor
								: -transaction.amountMinor,
							{ signDisplay: 'always' },
						)}
					</AppText>
					<AppText variant='heading3' align='center'>
						{transaction.note}
					</AppText>
					{scheduled ? (
						<AppText variant='bodySmall' tone='warning'>
							Scheduled · not yet counted in your balance
						</AppText>
					) : null}
				</View>
				<Surface padded={false}>
					<ListRow
						title='Type'
						value={income ? 'Income' : 'Expense'}
					/>
					<Divider inset={16} />
					<ListRow
						title='Category'
						value={
							category
								? `${category.name}${category.archivedAt ? ' (archived)' : ''}`
								: 'Unknown'
						}
					/>
					<Divider inset={16} />
					<ListRow
						title='Date'
						value={`${formatFullDay(localDateOf(transaction.occurredAt))}, ${formatTime(transaction.occurredAt)}`}
					/>
					{accounts.length > 1 ? (
						<>
							<Divider inset={16} />
							<ListRow
								title='Account'
								value={
									accountById.get(transaction.accountId)
										?.name ?? 'Archived account'
								}
							/>
						</>
					) : null}
					{card ? (
						<>
							<Divider inset={16} />
							<ListRow
								title='Card'
								value={`${card.bankName} ·${card.lastFour}`}
							/>
						</>
					) : null}
					{transaction.recurrence ? (
						<>
							<Divider inset={16} />
							<ListRow
								title='Repeats'
								value={describeRecurrence(
									transaction.recurrence,
								)}
								onPress={() => router.push('/recurring')}
							/>
						</>
					) : null}
					{transaction.recurrenceSourceId ? (
						<>
							<Divider inset={16} />
							<ListRow
								title='Recorded from'
								value='Recurring schedule'
							/>
						</>
					) : null}
				</Surface>
				{receipt.status === 'ready' ? (
					<Image
						source={{ uri: receipt.uri }}
						style={{
							width: '100%',
							aspectRatio: 3 / 4,
							borderRadius: theme.radii.lg,
						}}
						contentFit='contain'
						accessibilityLabel='Receipt photo'
					/>
				) : receipt.status === 'unavailable' ? (
					<AppText variant='bodySmall' tone='textSecondary'>
						The receipt photo for this transaction is missing from
						this device or could not be decrypted.
					</AppText>
				) : null}
				<Button
					label='Delete transaction'
					variant='destructive'
					icon='delete'
					onPress={remove}
					loading={deleting}
					fullWidth
				/>
			</Screen>
		</>
	);
}
