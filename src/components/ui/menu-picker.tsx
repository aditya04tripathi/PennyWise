import { Host, Picker } from '@expo/ui';
import { View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

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
	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: theme.spacing.sm,
				minHeight: theme.layout.rowHeight,
				paddingHorizontal: theme.spacing.md,
			}}>
			<AppText variant='body'>{label}</AppText>
			<Host matchContents colorScheme={theme.dark ? 'dark' : 'light'}>
				<Picker
					selectedValue={value}
					onValueChange={onChange}
					appearance='menu'>
					{options.map((option) => (
						<Picker.Item
							key={String(option.value)}
							label={option.label}
							value={option.value}
						/>
					))}
				</Picker>
			</Host>
		</View>
	);
}
