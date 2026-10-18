import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

import { CardTile } from '@/components/finance/card-tile';
import {
	confirmAction,
	showMessage,
	userFacingError,
} from '@/components/feedback/confirm';
import {
	EmptyState,
	ErrorState,
	LoadingState,
} from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import type { PaymentCard } from '@/domain/entities';
import { cardUsage, removeCard } from '@/features/catalog/catalog-service';
import { useCards } from '@/hooks/use-app-data';

export default function CardsScreen() {
	const query = useCards();

	const remove = async (card: PaymentCard) => {
		try {
			const usage = await cardUsage(card.id);
			const confirmed = await confirmAction({
				title: `Remove ${card.bankName} ·${card.lastFour}?`,
				message:
					usage > 0
						? `${usage} transactions are linked to this card. They will be kept without a card.`
						: 'This card is not used by any transaction.',
				confirmLabel: 'Remove',
				destructive: true,
			});
			if (confirmed) await removeCard(card.id);
		} catch (error) {
			showMessage('Not removed', userFacingError(error));
		}
	};

	return (
		<>
			<Stack.Screen
				options={{
					headerRight: () => (
						<Button
							label='Add'
							variant='ghost'
							compact
							onPress={() => router.push('/cards/edit')}
						/>
					),
				}}
			/>
			<Screen>
				{query.status === 'loading' ? <LoadingState /> : null}
				{query.status === 'error' ? (
					<ErrorState
						message='Cards could not be loaded.'
						onRetry={query.reload}
					/>
				) : null}
				{query.status === 'success' && query.cards.length === 0 ? (
					<EmptyState
						icon='card'
						title='No cards'
						message='Add the cards you pay with to see which one each transaction used. Only the last four digits are stored.'
						actionLabel='Add card'
						onAction={() => router.push('/cards/edit')}
					/>
				) : null}
				{query.cards.map((card) => (
					<Pressable
						key={card.id}
						accessibilityRole='button'
						accessibilityHint='Edit card. Long press to remove.'
						onPress={() =>
							router.push({
								pathname: '/cards/edit',
								params: { id: card.id },
							})
						}
						onLongPress={() => remove(card)}>
						<CardTile card={card} />
					</Pressable>
				))}
				{query.cards.length > 0 ? (
					<AppText
						variant='bodySmall'
						tone='textSecondary'
						align='center'>
						Tap a card to edit it. Long press to remove it.
					</AppText>
				) : null}
			</Screen>
		</>
	);
}
