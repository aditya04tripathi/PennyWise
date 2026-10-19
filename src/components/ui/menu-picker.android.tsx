import { MenuView } from '@expo/ui/community/menu';
import { View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

import { Icon } from './icon';
import { selectionHaptic } from './selection-haptic';
import { AppText } from './text';

export function MenuPicker<T extends string | number>({
	label,
	value,
	onChange,
	options,
}: {
	label: string;
	value: T;
	onChange: (value: T) => void;
	options: readonly { value: T; label: string }[];
}) {
	const theme = useTheme();
	const selected =
		options.find((option) => option.value === value)?.label ?? '';

	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: theme.spacing.sm,
				minHeight: theme.layout.rowHeight,
				paddingHorizontal: theme.spacing.md,
				paddingVertical: theme.spacing.xxs,
			}}>
			<AppText variant='body' style={{ flexShrink: 0 }}>
				{label}
			</AppText>
			<MenuView
				actions={options.map((option) => ({
					id: String(option.value),
					title: option.label,
					state: option.value === value ? 'on' : 'off',
				}))}
				onPressAction={({ nativeEvent }) => {
					const next = options.find(
						(option) => String(option.value) === nativeEvent.event,
					);
					if (!next || next.value === value) return;
					selectionHaptic();
					onChange(next.value);
				}}>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: 2,
						maxWidth: 220,
						minHeight: 36,
						paddingLeft: theme.spacing.sm,
						paddingRight: theme.spacing.xxs,
						borderRadius: theme.radii.sm,
						borderCurve: 'continuous',
						backgroundColor: theme.colors.surfaceElevated,
					}}>
					<AppText
						variant='body'
						numberOfLines={1}
						style={{ flexShrink: 1 }}>
						{selected}
					</AppText>
					<Icon
						name='chevronUpDown'
						size={18}
						color={theme.colors.textSecondary}
					/>
				</View>
			</MenuView>
		</View>
	);
}
