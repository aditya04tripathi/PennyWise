import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { isPosted } from '@/domain/calculations/ledger';
import type { Category, Transaction } from '@/domain/entities';
import type { MoneyFormatter } from '@/hooks/use-app-data';
import { formatTime } from '@/lib/format-date';
import { useTheme } from '@/theme/use-theme';

import { CategoryBadge } from './category-badge';

export interface TransactionRowProps {
	transaction: Transaction;
	category: Category | undefined;
	formatAmount: MoneyFormatter;
	now: string;
	onPress: (transaction: Transaction) => void;
}

export const TransactionRow = memo(function TransactionRow({
	transaction,
	category,
	formatAmount,
	now,
	onPress,
}: TransactionRowProps) {
	const theme = useTheme();
	const scheduled = !isPosted(transaction, now);
	const income = transaction.type === 'income';
	const amount = formatAmount(
		income ? transaction.amountMinor : -transaction.amountMinor,
		{ signDisplay: 'always' },
	);
	const meta = [
		category?.name ?? 'Unknown category',
		scheduled ? 'Scheduled' : formatTime(transaction.occurredAt),
	].join(' · ');

	return (
		<Pressable
			onPress={() => onPress(transaction)}
			accessibilityRole='button'
			accessibilityLabel={`${transaction.note}, ${income ? 'income' : 'expense'} ${amount}, ${meta}`}
			accessibilityHint='Opens transaction details'
			style={({ pressed }) => ({
				flexDirection: 'row',
				alignItems: 'center',
				gap: theme.spacing.sm,
				paddingVertical: theme.spacing.sm,
				paddingHorizontal: theme.spacing.md,
				backgroundColor: pressed
					? theme.colors.surfaceElevated
					: 'transparent',
				opacity: scheduled ? 0.72 : 1,
			})}>
			<CategoryBadge category={category} />
			<View style={{ flex: 1, gap: 2 }}>
				<AppText
					variant='body'
					numberOfLines={1}
					style={{ fontWeight: '500' }}>
					{transaction.note}
				</AppText>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: 4,
					}}>
					{transaction.recurrence ? (
						<Icon
							name='repeat'
							size={11}
							color={theme.colors.textTertiary}
						/>
					) : null}
					{transaction.receiptFile ? (
						<Icon
							name='attachment'
							size={11}
							color={theme.colors.textTertiary}
						/>
					) : null}
					<AppText
						variant='bodySmall'
						tone='textSecondary'
						numberOfLines={1}
						style={{ flexShrink: 1 }}>
						{meta}
					</AppText>
				</View>
			</View>
			<AppText
				variant='body'
				numeric
				tone={income ? 'positive' : 'textPrimary'}
				style={{ fontWeight: '600' }}>
				{amount}
			</AppText>
		</Pressable>
	);
});
