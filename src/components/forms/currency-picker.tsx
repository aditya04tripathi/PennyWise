import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { LEGACY_CURRENCY_CODES, listCurrencies } from '@/domain/money/currency';
import { useTheme } from '@/theme/use-theme';

export function CurrencyPicker({
	visible,
	selected,
	onSelect,
	onClose,
}: {
	visible: boolean;
	selected: string;
	onSelect: (code: string) => void;
	onClose: () => void;
}) {
	const theme = useTheme();
	const [search, setSearch] = useState('');
	const currencies = useMemo(() => {
		const term = search.trim().toLowerCase();
		const all = [...listCurrencies()].sort((a, b) => {
			const aCommon = (
				LEGACY_CURRENCY_CODES as readonly string[]
			).includes(a.code)
				? 0
				: 1;
			const bCommon = (
				LEGACY_CURRENCY_CODES as readonly string[]
			).includes(b.code)
				? 0
				: 1;
			return aCommon - bCommon || a.code.localeCompare(b.code);
		});
		return term
			? all.filter(
					(currency) =>
						currency.code.toLowerCase().includes(term) ||
						currency.name.toLowerCase().includes(term),
				)
			: all;
	}, [search]);

	return (
		<Sheet visible={visible} title='Currency' onClose={onClose}>
			<TextField
				label='Search'
				value={search}
				onChangeText={setSearch}
				placeholder='Code or name'
				autoCorrect={false}
			/>
			{currencies.map((currency) => {
				const active = currency.code === selected;
				return (
					<Pressable
						key={currency.code}
						accessibilityRole='button'
						accessibilityState={{ selected: active }}
						accessibilityLabel={`${currency.name}, ${currency.code}`}
						onPress={() => onSelect(currency.code)}
						style={({ pressed }) => ({
							flexDirection: 'row',
							alignItems: 'center',
							alignSelf: 'stretch',
							gap: theme.spacing.sm,
							minHeight: Math.max(
								theme.layout.rowHeight,
								theme.layout.minTouchTarget,
							),
							paddingHorizontal: theme.spacing.xs,
							borderRadius: theme.radii.sm,
							backgroundColor: pressed
								? theme.colors.surfaceElevated
								: 'transparent',
						})}>
						<AppText variant='label' style={{ width: 48 }}>
							{currency.code}
						</AppText>
						<AppText
							variant='body'
							tone='textSecondary'
							numberOfLines={2}
							style={{ flex: 1, flexShrink: 1 }}>
							{currency.name}
						</AppText>
						{active ? (
							<Icon
								name='check'
								size={16}
								color={theme.colors.brandPrimary}
							/>
						) : null}
					</Pressable>
				);
			})}
		</Sheet>
	);
}
