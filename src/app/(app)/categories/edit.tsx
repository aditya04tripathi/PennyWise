import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CategoryBadge } from '@/components/finance/category-badge';
import { showMessage, userFacingError } from '@/components/feedback/confirm';
import { LoadingState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/surface';
import { TextField } from '@/components/ui/text-field';
import {
	CATEGORY_ICONS,
	type Category,
	type CategoryIcon,
} from '@/domain/entities';
import { currencyExponent } from '@/domain/money/currency';
import { formatMoneyInput } from '@/domain/money/format';
import { parseAmountInput } from '@/domain/validation/amount-input';
import {
	saveCategory,
	validateCategoryName,
} from '@/features/catalog/catalog-service';
import { useIsPro } from '@/features/pro/pro-store';
import { useCategories, useSettings } from '@/hooks/use-app-data';
import { useTheme } from '@/theme/use-theme';

const CATEGORY_COLORS = [
	'#B7791F',
	'#2B6CB0',
	'#B83280',
	'#176B57',
	'#5A6778',
	'#C05621',
	'#6B46C1',
	'#2C7A7B',
	'#C53030',
	'#4A5568',
] as const;

export default function CategoryEditScreen() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	const query = useCategories(true);
	if (query.status === 'loading') return <LoadingState />;
	const existing = id ? (query.byId.get(id) ?? null) : null;
	return <CategoryForm existing={existing} />;
}

function CategoryForm({ existing }: { existing: Category | null }) {
	const theme = useTheme();
	const [name, setName] = useState(existing?.name ?? '');
	const [icon, setIcon] = useState<CategoryIcon>(existing?.icon ?? 'tag');
	const [color, setColor] = useState(existing?.color ?? CATEGORY_COLORS[0]);
	const { currencyCode } = useSettings();
	const isPro = useIsPro();
	const [limit, setLimit] = useState(
		existing?.budgetLimitMinor
			? formatMoneyInput(existing.budgetLimitMinor, currencyCode)
			: '',
	);
	const [error, setError] = useState<string | undefined>();
	const [limitError, setLimitError] = useState<string | undefined>();
	const [saving, setSaving] = useState(false);

	const save = async () => {
		const validation = validateCategoryName(name);
		const parsedLimit = parseAmountInput(
			limit,
			currencyExponent(currencyCode),
		);
		setError(validation ?? undefined);
		setLimitError(parsedLimit.error);
		if (validation || parsedLimit.error) return;
		setSaving(true);
		try {
			await saveCategory(
				{ name, icon, color, budgetLimitMinor: parsedLimit.minor },
				existing,
			);
			router.back();
		} catch (saveError) {
			showMessage('Not saved', userFacingError(saveError));
		} finally {
			setSaving(false);
		}
	};

	const preview: Category = {
		id: 'preview',
		name,
		icon,
		color,
		budgetLimitMinor: null,
		legacyIconCode: null,
		sortOrder: 0,
		archivedAt: null,
	};

	return (
		<Screen>
			<View style={{ alignItems: 'center' }}>
				<CategoryBadge category={preview} size={64} />
			</View>
			<TextField
				label='Name'
				value={name}
				onChangeText={(text) => {
					setName(text);
					setError(undefined);
				}}
				maxLength={40}
				error={error}
				autoFocus={!existing}
			/>
			{isPro || existing?.budgetLimitMinor ? (
				<TextField
					label='Monthly limit (optional)'
					value={limit}
					onChangeText={setLimit}
					keyboardType='decimal-pad'
					placeholder='No limit'
					error={limitError}
					hint='Planning shows progress against this limit, and budget alerts include it when they are on.'
				/>
			) : (
				<Button
					label='Monthly limits come with PennyWise Pro'
					variant='ghost'
					icon='spark'
					onPress={() => router.push('/pro')}
				/>
			)}
			<Section title='Icon'>
				<View
					style={{
						flexDirection: 'row',
						flexWrap: 'wrap',
						gap: theme.spacing.xs,
					}}
					accessibilityRole='radiogroup'>
					{CATEGORY_ICONS.map((option) => (
						<Pressable
							key={option}
							accessibilityRole='radio'
							accessibilityLabel={option}
							accessibilityState={{ selected: icon === option }}
							onPress={() => setIcon(option)}
							style={{
								width: 48,
								height: 48,
								borderRadius: theme.radii.md,
								alignItems: 'center',
								justifyContent: 'center',
								borderWidth: icon === option ? 2 : 1,
								borderColor:
									icon === option
										? theme.colors.brandPrimary
										: theme.colors.border,
								backgroundColor: theme.colors.surface,
							}}>
							<Icon
								name={option}
								size={20}
								color={theme.colors.textPrimary}
							/>
						</Pressable>
					))}
				</View>
			</Section>
			<Section title='Colour'>
				<View
					style={{
						flexDirection: 'row',
						flexWrap: 'wrap',
						gap: theme.spacing.xs,
					}}
					accessibilityRole='radiogroup'>
					{CATEGORY_COLORS.map((option, index) => (
						<Pressable
							key={option}
							accessibilityRole='radio'
							accessibilityLabel={`Colour ${index + 1}`}
							accessibilityState={{ selected: color === option }}
							onPress={() => setColor(option)}
							style={{
								width: 44,
								height: 44,
								borderRadius: 22,
								backgroundColor: option,
								alignItems: 'center',
								justifyContent: 'center',
								borderWidth: 3,
								borderColor:
									color === option
										? theme.colors.textPrimary
										: 'transparent',
							}}>
							{color === option ? (
								<Icon name='check' size={16} color='#FFFFFF' />
							) : null}
						</Pressable>
					))}
				</View>
			</Section>
			<Button
				label={existing ? 'Save changes' : 'Add category'}
				onPress={save}
				loading={saving}
				fullWidth
			/>
		</Screen>
	);
}
