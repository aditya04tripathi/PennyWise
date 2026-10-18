import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/use-theme';

export function PrivacyOverlay() {
	const theme = useTheme();
	return (
		<View
			pointerEvents='none'
			importantForAccessibility='no-hide-descendants'
			style={[
				StyleSheet.absoluteFill,
				{
					backgroundColor: theme.colors.background,
					alignItems: 'center',
					justifyContent: 'center',
					gap: theme.spacing.sm,
				},
			]}>
			<Icon name='lock' size={32} color={theme.colors.brandPrimary} />
			<AppText variant='heading2'>PennyWise</AppText>
		</View>
	);
}
