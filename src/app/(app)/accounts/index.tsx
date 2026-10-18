import { router, Stack } from 'expo-router';
import { useMemo } from 'react';

import {
	confirmAction,
	showMessage,
	userFacingError,
} from '@/components/feedback/confirm';
import { ErrorState, LoadingState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { ListRow, type ListRowProps } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { listTransfers } from '@/data/repositories/account-repository';
import type { Transfer } from '@/domain/entities';
import { sumMinor } from '@/domain/money/money';
import {
	ACCOUNT_KIND_LABELS,
	removeTransfer,
} from '@/features/accounts/account-service';
import { useAccounts, useMoneyFormatter } from '@/hooks/use-app-data';
import { useLedgerQuery } from '@/hooks/use-ledger-query';
import { localDateOf } from '@/domain/dates';
import { formatShortDate } from '@/lib/format-date';

const RECENT_TRANSFER_LIMIT = 20;

export default function AccountsScreen() {
	const formatAmount = useMoneyFormatter();
	const accounts = useAccounts();
	const transfers = useLedgerQuery((db) => listTransfers(db), []);
	const recentTransfers = useMemo(
		() =>
			[...(transfers.data ?? [])]
				.reverse()
				.slice(0, RECENT_TRANSFER_LIMIT),
		[transfers.data],
	);
	const totalMinor = sumMinor(
		accounts.accounts.map((entry) => entry.balanceMinor),
	);

	const deleteTransfer = async (transfer: Transfer) => {
		const confirmed = await confirmAction({
			title: 'Delete transfer?',
			message: `${formatAmount(transfer.amountMinor, { reveal: true })} will move back to the source account.`,
			confirmLabel: 'Delete',
			destructive: true,
		});
		if (!confirmed) return;
		try {
			await removeTransfer(transfer.id);
		} catch (error) {
			showMessage('Not deleted', userFacingError(error));
		}
	};

	if (accounts.status === 'loading') return <LoadingState />;
	if (accounts.status === 'error')
		return (
			<ErrorState
				message='Accounts could not be loaded.'
				onRetry={accounts.reload}
			/>
		);

	return (
		<>
			<Stack.Screen
				options={{
					headerRight: () => (
						<Button
							label='Add'
							variant='ghost'
							compact
							onPress={() => router.push('/accounts/edit')}
						/>
					),
				}}
			/>
			<Screen>
				<Surface>
					<AppText variant='label' tone='textSecondary'>
						Total across accounts
					</AppText>
					<AppText variant='display' numeric>
						{formatAmount(totalMinor)}
					</AppText>
				</Surface>
				<Section title='Accounts'>
					<Surface padded={false}>
						{accounts.accounts.map((entry, index) => (
							<ListRowWithDivider
								key={entry.account.id}
								showDivider={index > 0}
								title={entry.account.name}
								subtitle={
									ACCOUNT_KIND_LABELS[entry.account.kind]
								}
								value={formatAmount(entry.balanceMinor)}
								iconColor={entry.account.color}
								onPress={() =>
									router.push({
										pathname: '/accounts/edit',
										params: { id: entry.account.id },
									})
								}
							/>
						))}
					</Surface>
				</Section>
				{accounts.accounts.length > 1 ? (
					<Button
						label='Transfer between accounts'
						icon='transfer'
						variant='secondary'
						onPress={() => router.push('/accounts/transfer')}
						fullWidth
					/>
				) : (
					<AppText variant='bodySmall' tone='textSecondary'>
						Add a second account to move money between accounts.
						Transfers are not counted as income or spending.
					</AppText>
				)}
				{recentTransfers.length > 0 ? (
					<Section title='Recent transfers'>
						<Surface padded={false}>
							{recentTransfers.map((transfer, index) => (
								<ListRowWithDivider
									key={transfer.id}
									showDivider={index > 0}
									title={`${accounts.byId.get(transfer.fromAccountId)?.name ?? 'Account'} → ${accounts.byId.get(transfer.toAccountId)?.name ?? 'Account'}`}
									subtitle={[
										formatShortDate(
											localDateOf(transfer.occurredAt),
										),
										transfer.note,
									]
										.filter(Boolean)
										.join(' · ')}
									value={formatAmount(transfer.amountMinor)}
									accessibilityHint='Delete this transfer'
									onPress={() => deleteTransfer(transfer)}
								/>
							))}
						</Surface>
					</Section>
				) : null}
			</Screen>
		</>
	);
}

function ListRowWithDivider({
	showDivider,
	...props
}: ListRowProps & { showDivider: boolean }) {
	return (
		<>
			{showDivider ? <Divider inset={16} /> : null}
			<ListRow {...props} icon={props.icon ?? 'account'} />
		</>
	);
}
