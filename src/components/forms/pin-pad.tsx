import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { PIN_LENGTH } from '@/domain/security/pin';
import { useTheme } from '@/theme/use-theme';

const KEYS = [
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'biometric',
	'0',
	'delete',
] as const;

export interface PinPadProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	onBiometric?: () => void;
}

export function PinDots({
	length,
	error,
}: {
	length: number;
	error?: boolean;
}) {
	const theme = useTheme();
	return (
		<View
			style={{
				flexDirection: 'row',
				gap: theme.spacing.md,
				justifyContent: 'center',
			}}
			accessibilityLabel={`${length} of ${PIN_LENGTH} digits entered`}>
			{Array.from({ length: PIN_LENGTH }, (_, index) => (
				<View
					key={index}
					style={{
						width: 14,
						height: 14,
						borderRadius: 7,
						borderWidth: 1.5,
						borderColor: error
							? theme.colors.negative
							: theme.colors.brandPrimary,
						backgroundColor:
							index < length
								? error
									? theme.colors.negative
									: theme.colors.brandPrimary
								: 'transparent',
					}}
				/>
			))}
		</View>
	);
}

export function PinPad({
	value,
	onChange,
	disabled,
	onBiometric,
}: PinPadProps) {
	const theme = useTheme();
	const press = (key: (typeof KEYS)[number]) => {
		if (disabled) return;
		if (process.env.EXPO_OS === 'ios')
			Haptics.selectionAsync().catch(() => undefined);
		if (key === 'delete') onChange(value.slice(0, -1));
		else if (key === 'biometric') onBiometric?.();
		else if (value.length < PIN_LENGTH) onChange(value + key);
	};

	return (
		<View
			style={{
				flexDirection: 'row',
				flexWrap: 'wrap',
				justifyContent: 'center',
				maxWidth: 300,
				alignSelf: 'center',
				rowGap: theme.spacing.sm,
			}}>
			{KEYS.map((key) => {
				if (key === 'biometric' && !onBiometric)
					return (
						<View
							key={key}
							style={{ width: '33.33%', height: 68 }}
						/>
					);
				const label =
					key === 'delete'
						? 'Delete digit'
						: key === 'biometric'
							? 'Unlock with biometrics'
							: key;
				return (
					<View
						key={key}
						style={{ width: '33.33%', alignItems: 'center' }}>
						<Pressable
							accessibilityRole='button'
							accessibilityLabel={label}
							disabled={disabled}
							onPress={() => press(key)}
							style={({ pressed }) => ({
								width: 68,
								height: 68,
								borderRadius: 34,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: pressed
									? theme.colors.surfaceElevated
									: key.length === 1
										? theme.colors.surface
										: 'transparent',
								opacity: disabled ? 0.4 : 1,
							})}>
							{key === 'delete' ? (
								<Icon
									name='chevronLeft'
									size={20}
									color={theme.colors.textPrimary}
								/>
							) : key === 'biometric' ? (
								<Icon
									name='biometric'
									size={24}
									color={theme.colors.brandPrimary}
								/>
							) : (
								<AppText variant='heading1' numeric>
									{key}
								</AppText>
							)}
						</Pressable>
					</View>
				);
			})}
		</View>
	);
}
