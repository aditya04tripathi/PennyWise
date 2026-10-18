import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import type { CardNetwork, PaymentCard } from '@/domain/entities';
import { useTheme } from '@/theme/use-theme';

export const NETWORK_LABELS: Record<CardNetwork, string> = {
	visa: 'Visa',
	mastercard: 'Mastercard',
	amex: 'American Express',
	discover: 'Discover',
	other: 'Card',
};

export function CardTile({
	card,
}: {
	card: Pick<
		PaymentCard,
		'bankName' | 'holderName' | 'lastFour' | 'network' | 'color'
	>;
}) {
	const theme = useTheme();
	return (
		<View
			accessible
			accessibilityLabel={`${card.bankName} ${NETWORK_LABELS[card.network]} ending in ${card.lastFour.split('').join(' ')}`}
			style={{
				aspectRatio: 1.586,
				borderRadius: theme.radii.xl,
				borderCurve: 'continuous',
				backgroundColor: card.color,
				padding: theme.spacing.lg,
				justifyContent: 'space-between',
			}}>
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
				}}>
				<AppText
					variant='heading3'
					style={{ color: '#FFFFFF' }}
					numberOfLines={1}>
					{card.bankName || 'Bank'}
				</AppText>
				<AppText variant='label' style={{ color: '#FFFFFFCC' }}>
					{NETWORK_LABELS[card.network]}
				</AppText>
			</View>
			<View style={{ gap: 4 }}>
				<AppText
					variant='heading2'
					numeric
					style={{ color: '#FFFFFF', letterSpacing: 2 }}>
					•••• {card.lastFour || '····'}
				</AppText>
				{card.holderName ? (
					<AppText
						variant='bodySmall'
						style={{ color: '#FFFFFFCC' }}
						numberOfLines={1}>
						{card.holderName}
					</AppText>
				) : null}
			</View>
		</View>
	);
}
