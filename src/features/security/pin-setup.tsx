import { useState } from 'react';
import { View } from 'react-native';

import { PinDots, PinPad } from '@/components/forms/pin-pad';
import { AppText } from '@/components/ui/text';
import { isWellFormedPin, PIN_LENGTH } from '@/domain/security/pin';
import { useTheme } from '@/theme/use-theme';

export function PinSetup({
	onComplete,
}: {
	onComplete: (pin: string) => Promise<void>;
}) {
	const theme = useTheme();
	const [first, setFirst] = useState<string | null>(null);
	const [value, setValue] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const handleChange = (next: string) => {
		if (next.length < PIN_LENGTH) {
			setValue(next);
			return;
		}
		setValue('');
		if (!isWellFormedPin(next)) {
			setError('Use digits only');
			return;
		}
		if (first === null) {
			setFirst(next);
			setError(null);
			return;
		}
		if (next !== first) {
			setError('PINs did not match. Start again.');
			setFirst(null);
			return;
		}
		setBusy(true);
		onComplete(next).finally(() => setBusy(false));
	};

	return (
		<View style={{ gap: theme.spacing.xl }}>
			<View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
				<AppText
					variant='heading2'
					align='center'
					accessibilityLiveRegion='polite'>
					{first === null
						? `Choose a ${PIN_LENGTH}-digit PIN`
						: 'Enter it again to confirm'}
				</AppText>
				<AppText
					variant='bodySmall'
					tone={error ? 'negative' : 'textSecondary'}
					align='center'
					accessibilityLiveRegion='polite'>
					{error ?? 'You will use this PIN to unlock PennyWise.'}
				</AppText>
			</View>
			<PinDots length={value.length} error={!!error} />
			<PinPad value={value} onChange={handleChange} disabled={busy} />
		</View>
	);
}
