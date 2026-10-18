import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/use-theme';

export function ColorSwatches({
	colors,
	value,
	onChange,
}: {
	colors: readonly string[];
	value: string;
	onChange: (color: string) => void;
}) {
	const theme = useTheme();
	return (
		<View
			accessibilityRole='radiogroup'
			style={{
				flexDirection: 'row',
				flexWrap: 'wrap',
				gap: theme.spacing.xs,
			}}>
			{colors.map((option, index) => (
				<Pressable
					key={option}
					accessibilityRole='radio'
					accessibilityLabel={`Colour ${index + 1}`}
					accessibilityState={{ selected: value === option }}
					onPress={() => onChange(option)}
					style={{
						width: 44,
						height: 44,
						borderRadius: 22,
						backgroundColor: option,
						alignItems: 'center',
						justifyContent: 'center',
						borderWidth: 3,
						borderColor:
							value === option
								? theme.colors.brandPrimary
								: 'transparent',
					}}>
					{value === option ? (
						<Icon name='check' size={16} color='#FFFFFF' />
					) : null}
				</Pressable>
			))}
		</View>
	);
}
