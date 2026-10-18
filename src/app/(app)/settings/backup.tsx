import { useState } from 'react';

import { showMessage, userFacingError } from '@/components/feedback/confirm';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { totalsBetween } from '@/data/repositories/transaction-repository';
import { useBackupFlow } from '@/features/backup/backup-flow';
import {
	exportEncryptedBackup,
	exportTransactionsCsv,
} from '@/features/backup/backup-service';
import { useLedgerQuery } from '@/hooks/use-ledger-query';

const MIN_PASSWORD_LENGTH = 8;

export default function BackupScreen() {
	const counts = useLedgerQuery(
		(db) => totalsBetween(db, '0000', '9999'),
		[],
	);
	const backup = useBackupFlow({
		hasExistingData: (counts.data?.count ?? 0) > 0,
	});
	const [exportOpen, setExportOpen] = useState(false);
	const [password, setPassword] = useState('');
	const [confirmation, setConfirmation] = useState('');
	const [exporting, setExporting] = useState(false);
	const [csvExporting, setCsvExporting] = useState(false);

	const passwordError =
		password && password.length < MIN_PASSWORD_LENGTH
			? `Use at least ${MIN_PASSWORD_LENGTH} characters`
			: undefined;
	const confirmationError =
		confirmation && confirmation !== password
			? 'Passwords do not match'
			: undefined;
	const canExport =
		password.length >= MIN_PASSWORD_LENGTH && password === confirmation;

	const closeExport = () => {
		setExportOpen(false);
		setPassword('');
		setConfirmation('');
	};

	const runExport = async () => {
		setExporting(true);
		try {
			const result = await exportEncryptedBackup(password);
			closeExport();
			showMessage(
				'Backup created',
				`${result.transactions} transactions and ${result.receipts} receipts were encrypted and verified.${result.missingReceipts ? ` ${result.missingReceipts} receipt photos were missing on this device and are not included.` : ''} Keep the password safe: it cannot be recovered.`,
			);
		} catch (error) {
			showMessage('Backup failed', userFacingError(error));
		} finally {
			setExporting(false);
		}
	};

	const runCsv = async () => {
		setCsvExporting(true);
		try {
			await exportTransactionsCsv({});
		} catch (error) {
			showMessage('Export failed', userFacingError(error));
		} finally {
			setCsvExporting(false);
		}
	};

	return (
		<Screen>
			<Section title='Back up'>
				<Surface padded={false}>
					<ListRow
						icon='export'
						title='Export encrypted backup'
						subtitle='All data and receipts, protected by a password'
						onPress={() => setExportOpen(true)}
					/>
					<Divider inset={60} />
					<ListRow
						icon='activity'
						title={
							csvExporting
								? 'Exporting…'
								: 'Export transactions as CSV'
						}
						subtitle='Unencrypted spreadsheet, for your own records'
						onPress={csvExporting ? undefined : runCsv}
					/>
				</Surface>
				<AppText variant='bodySmall' tone='textSecondary'>
					PennyWise has no cloud. Save backups somewhere safe, such as
					Files or another device. A CSV file is not encrypted.
				</AppText>
			</Section>

			<Section title='Restore'>
				<Surface padded={false}>
					<ListRow
						icon='import'
						title={
							backup.busy
								? 'Opening…'
								: 'Restore or import a backup'
						}
						subtitle='PennyWise 2 backups and PennyWise 1 exports'
						onPress={backup.busy ? undefined : backup.start}
					/>
				</Surface>
				<AppText variant='bodySmall' tone='textSecondary'>
					You will see what the file contains before anything is
					changed. Restoring replaces the data currently on this
					device.
				</AppText>
			</Section>

			<Sheet
				visible={exportOpen}
				title='Encrypted backup'
				onClose={closeExport}
				footer={
					<Button
						label='Create backup'
						onPress={runExport}
						loading={exporting}
						disabled={!canExport}
						fullWidth
					/>
				}>
				<AppText variant='body' tone='textSecondary'>
					Choose a password for this backup. You will need it to
					restore. PennyWise cannot recover a forgotten password.
				</AppText>
				<TextField
					label='Password'
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					autoCapitalize='none'
					autoCorrect={false}
					textContentType='newPassword'
					error={passwordError}
				/>
				<TextField
					label='Confirm password'
					value={confirmation}
					onChangeText={setConfirmation}
					secureTextEntry
					autoCapitalize='none'
					autoCorrect={false}
					textContentType='newPassword'
					error={confirmationError}
				/>
			</Sheet>
			{backup.element}
		</Screen>
	);
}
