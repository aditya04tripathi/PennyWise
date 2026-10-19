import Constants from 'expo-constants';

import { Screen } from '@/components/ui/screen';
import { Section, Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { useSession } from '@/features/session/session-store';
import { useTheme } from '@/theme/use-theme';

export default function AboutScreen() {
	const theme = useTheme();
	const encrypted = useSession((state) => state.encrypted);
	const points = [
		'Your transactions, accounts and receipts stay on this device. PennyWise has no account and does not upload that data to its own servers.',
		encrypted
			? 'The database is encrypted with SQLCipher. Its key is generated on this device and kept in the system keychain, available only while the device is unlocked.'
			: 'This is a development build running without database encryption. Release builds refuse to store data unencrypted.',
		'Your PIN is never stored. Only a salted, slow hash is kept in the keychain, and repeated wrong attempts pause entry.',
		'Backups are encrypted with AES-256-GCM using a key derived from your password. CSV exports are not encrypted.',
		'Card entries store only the issuer, a label and the last four digits. PennyWise never asks for full card numbers or security codes.',
		'The free version shows ads from Google. PennyWise Pro removes them. PennyWise does not include an analytics SDK.',
		'Pro purchases are handled by the App Store or Google Play. RevenueCat receives an anonymous ID and the purchase receipt so PennyWise can tell whether Pro is unlocked. Your transactions are not included.',
	];
	return (
		<Screen>
			<Section title='Privacy'>
				<Surface style={{ gap: theme.spacing.sm }}>
					{points.map((point) => (
						<AppText key={point} variant='body'>
							{point}
						</AppText>
					))}
				</Surface>
			</Section>
			<Section title='About'>
				<Surface style={{ gap: theme.spacing.xxs }}>
					<AppText variant='body'>
						PennyWise {Constants.expoConfig?.version}
					</AppText>
					<AppText variant='bodySmall' tone='textSecondary'>
						Offline personal finance tracker.
					</AppText>
				</Surface>
			</Section>
		</Screen>
	);
}
