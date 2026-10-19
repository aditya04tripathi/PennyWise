import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { CardTile, NETWORK_LABELS } from '@/components/finance/card-tile';
import { ColorSwatches } from '@/components/forms/color-swatches';
import {
	confirmAction,
	showMessage,
	userFacingError,
} from '@/components/feedback/confirm';
import { LoadingState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { MenuPicker } from '@/components/ui/menu-picker';
import { Screen } from '@/components/ui/screen';
import { Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import type { CardNetwork, PaymentCard } from '@/domain/entities';
import {
	cardUsage,
	removeCard,
	saveCard,
	validateCardInput,
	type CardInputErrors,
} from '@/features/catalog/catalog-service';
import { useCards } from '@/hooks/use-app-data';

const CARD_COLORS = [
	'#1F2937',
	'#176B57',
	'#2B6CB0',
	'#6B46C1',
	'#B83280',
	'#9C4221',
] as const;

export default function CardEditScreen() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	const query = useCards();
	if (query.status === 'loading') return <LoadingState />;
	return <CardForm existing={id ? (query.byId.get(id) ?? null) : null} />;
}

function CardForm({ existing }: { existing: PaymentCard | null }) {
	const [bankName, setBankName] = useState(existing?.bankName ?? '');
	const [holderName, setHolderName] = useState(existing?.holderName ?? '');
	const [lastFour, setLastFour] = useState(existing?.lastFour ?? '');
	const [network, setNetwork] = useState<CardNetwork>(
		existing?.network ?? 'visa',
	);
	const [color, setColor] = useState(existing?.color ?? CARD_COLORS[0]);
	const [errors, setErrors] = useState<CardInputErrors>({});
	const [saving, setSaving] = useState(false);

	const input = { bankName, holderName, lastFour, network, color };

	const save = async () => {
		const validation = validateCardInput(input);
		setErrors(validation);
		if (Object.keys(validation).length > 0) return;
		setSaving(true);
		try {
			await saveCard(input, existing?.id ?? null);
			router.back();
		} catch (error) {
			showMessage('Not saved', userFacingError(error));
		} finally {
			setSaving(false);
		}
	};

	const remove = async () => {
		if (!existing) return;
		const usage = await cardUsage(existing.id);
		const confirmed = await confirmAction({
			title: 'Remove card?',
			message:
				usage > 0
					? `${usage} transactions are linked to this card. They will be kept without a card.`
					: 'This card is not used by any transaction.',
			confirmLabel: 'Remove',
			destructive: true,
		});
		if (!confirmed) return;
		await removeCard(existing.id);
		router.back();
	};

	return (
		<Screen>
			<CardTile card={input} />
			<TextField
				label='Bank or issuer'
				value={bankName}
				onChangeText={setBankName}
				maxLength={40}
				error={errors.bankName}
				autoFocus={!existing}
			/>
			<TextField
				label='Name on card (optional)'
				value={holderName}
				onChangeText={setHolderName}
				maxLength={60}
				autoComplete='off'
			/>
			<TextField
				label='Last 4 digits'
				value={lastFour}
				onChangeText={(text) =>
					setLastFour(text.replace(/\D/g, '').slice(0, 4))
				}
				keyboardType='number-pad'
				maxLength={4}
				error={errors.lastFour}
				hint='PennyWise never stores full card numbers, expiry dates or security codes.'
				autoComplete='off'
				textContentType='none'
			/>
			<Surface padded={false}>
				<MenuPicker
					label='Network'
					value={network}
					onChange={setNetwork}
					options={(Object.keys(NETWORK_LABELS) as CardNetwork[]).map(
						(option) => ({
							value: option,
							label:
								option === 'other'
									? 'Other'
									: NETWORK_LABELS[option],
						}),
					)}
				/>
			</Surface>
			<Section title='Colour'>
				<ColorSwatches
					colors={CARD_COLORS}
					value={color}
					onChange={setColor}
				/>
			</Section>
			<Button
				label={existing ? 'Save changes' : 'Add card'}
				onPress={save}
				loading={saving}
				fullWidth
			/>
			{existing ? (
				<Button
					label='Remove card'
					variant='destructive'
					icon='delete'
					onPress={() =>
						remove().catch((error) =>
							showMessage('Not removed', userFacingError(error)),
						)
					}
					fullWidth
				/>
			) : null}
			<AppText variant='caption' tone='textTertiary' align='center'>
				Card details are for labelling only. PennyWise cannot make
				payments.
			</AppText>
		</Screen>
	);
}
