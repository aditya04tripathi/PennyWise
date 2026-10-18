import { useCallback, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { showMessage, userFacingError } from '@/components/feedback/confirm';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { Surface } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import type { BackupPayload } from '@/data/exporters/backup-format';
import type { RestoreSummary } from '@/data/exporters/backup-snapshot';
import {
	DuplicateImportError,
	ImportVerificationError,
	type LegacyImportResult,
	type ReconciliationCheck,
} from '@/data/importers/legacy/apply-legacy-import';
import type { LegacyImportIssue } from '@/data/importers/legacy/parse-legacy-backup';
import { formatMoney } from '@/domain/money/format';
import { useTheme } from '@/theme/use-theme';

import {
	applyLegacyImport,
	applyRestore,
	detectBackup,
	pickBackupFile,
	prepareLegacyImport,
	prepareRestore,
	type DetectedBackup,
	type LegacyImportPreview,
} from './backup-service';

type FlowState =
	| { step: 'idle' }
	| { step: 'password'; backup: DetectedBackup; error?: string }
	| {
			step: 'legacy-preview';
			preview: LegacyImportPreview;
			allowRepeat: boolean;
	  }
	| {
			step: 'restore-preview';
			payload: BackupPayload;
			summary: RestoreSummary;
	  }
	| {
			step: 'legacy-done';
			result: LegacyImportResult;
			issues: LegacyImportIssue[];
	  }
	| { step: 'restore-done'; summary: RestoreSummary };

export function useBackupFlow({
	hasExistingData,
	onCompleted,
}: {
	hasExistingData: boolean;
	onCompleted?: () => void;
}): {
	start: () => Promise<void>;
	busy: boolean;
	element: ReactNode;
} {
	const [state, setState] = useState<FlowState>({ step: 'idle' });
	const [busy, setBusy] = useState(false);
	const [password, setPassword] = useState('');
	const close = useCallback(() => {
		setPassword('');
		setState({ step: 'idle' });
	}, []);

	const preparePreview = async (
		backup: DetectedBackup,
		secret: string | null,
	) => {
		if (backup.kind === 'pennywise-2') {
			const { payload, summary } = await prepareRestore(
				backup,
				secret ?? '',
			);
			setState({ step: 'restore-preview', payload, summary });
		} else {
			setState({
				step: 'legacy-preview',
				preview: await prepareLegacyImport(backup, secret),
				allowRepeat: false,
			});
		}
		setPassword('');
	};

	const start = async () => {
		setBusy(true);
		try {
			const file = await pickBackupFile();
			if (!file) return;
			const backup = detectBackup(file);
			if (backup.kind === 'unrecognised') {
				showMessage(
					'Unsupported file',
					'Choose a backup exported from PennyWise 1 or PennyWise 2.',
				);
			} else if (backup.kind === 'legacy-plain') {
				await preparePreview(backup, null);
			} else {
				setState({ step: 'password', backup });
			}
		} catch (error) {
			showMessage('Could not read the backup', userFacingError(error));
		} finally {
			setBusy(false);
		}
	};

	const submitPassword = async () => {
		if (state.step !== 'password') return;
		setBusy(true);
		try {
			await preparePreview(state.backup, password);
		} catch (error) {
			setState({
				...state,
				error: userFacingError(
					error,
					'The password is incorrect or the file is damaged.',
				),
			});
		} finally {
			setBusy(false);
		}
	};

	const confirmLegacy = async () => {
		if (state.step !== 'legacy-preview') return;
		setBusy(true);
		try {
			const result = await applyLegacyImport(
				state.preview,
				state.allowRepeat,
			);
			setState({
				step: 'legacy-done',
				result,
				issues: state.preview.snapshot.issues,
			});
		} catch (error) {
			if (error instanceof DuplicateImportError) {
				setState({ ...state, allowRepeat: true });
				showMessage(
					'Already imported',
					'This exact backup was imported before. Tap Replace again to import it anyway; your current data will be replaced.',
				);
			} else if (error instanceof ImportVerificationError) {
				showMessage(
					'Import stopped',
					'The imported data did not match the backup, so nothing was changed.',
				);
			} else {
				showMessage('Import failed', userFacingError(error));
			}
		} finally {
			setBusy(false);
		}
	};

	const confirmRestore = async () => {
		if (state.step !== 'restore-preview') return;
		setBusy(true);
		try {
			setState({
				step: 'restore-done',
				summary: await applyRestore(state.payload),
			});
		} catch (error) {
			showMessage(
				'Restore failed',
				userFacingError(
					error,
					'The backup could not be restored. Your data was not changed.',
				),
			);
		} finally {
			setBusy(false);
		}
	};

	const finish = () => {
		close();
		onCompleted?.();
	};

	const replaceWarning = hasExistingData
		? 'This replaces everything currently in PennyWise on this device. Export a backup first if you want to keep it.'
		: null;

	const element = (
		<>
			<Sheet
				visible={state.step === 'password'}
				title='Backup password'
				onClose={close}
				footer={
					<Button
						label='Unlock backup'
						onPress={submitPassword}
						loading={busy}
						disabled={!password}
						fullWidth
					/>
				}>
				<AppText variant='body' tone='textSecondary'>
					Enter the password you chose when this backup was created.
					It never leaves your device.
				</AppText>
				<TextField
					label='Password'
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					autoFocus
					autoCapitalize='none'
					autoCorrect={false}
					textContentType='password'
					onSubmitEditing={submitPassword}
					error={state.step === 'password' ? state.error : undefined}
				/>
			</Sheet>

			<Sheet
				visible={state.step === 'legacy-preview'}
				title='Import from PennyWise 1'
				onClose={close}
				footer={
					<Button
						label={
							hasExistingData ? 'Replace and import' : 'Import'
						}
						variant={hasExistingData ? 'destructive' : 'primary'}
						onPress={confirmLegacy}
						loading={busy}
						fullWidth
					/>
				}>
				{state.step === 'legacy-preview' ? (
					<LegacyPreview
						preview={state.preview}
						warning={replaceWarning}
					/>
				) : null}
			</Sheet>

			<Sheet
				visible={state.step === 'restore-preview'}
				title='Restore backup'
				onClose={close}
				footer={
					<Button
						label={
							hasExistingData ? 'Replace and restore' : 'Restore'
						}
						variant={hasExistingData ? 'destructive' : 'primary'}
						onPress={confirmRestore}
						loading={busy}
						fullWidth
					/>
				}>
				{state.step === 'restore-preview' ? (
					<>
						<SummaryCard
							rows={summaryRows(
								state.summary,
								state.payload.settings.currencyCode,
							)}
						/>
						{replaceWarning ? (
							<Warning text={replaceWarning} />
						) : null}
					</>
				) : null}
			</Sheet>

			<Sheet
				visible={
					state.step === 'legacy-done' ||
					state.step === 'restore-done'
				}
				title='Done'
				onClose={finish}
				footer={<Button label='Continue' onPress={finish} fullWidth />}>
				{state.step === 'legacy-done' ? (
					<Reconciliation
						checks={state.result.checks}
						result={state.result}
						issues={state.issues}
					/>
				) : null}
				{state.step === 'restore-done' ? (
					<AppText variant='bodyLarge'>
						Restored {state.summary.transactions} transactions,{' '}
						{state.summary.categories} categories and{' '}
						{state.summary.cards} cards. Every count was verified
						after writing.
					</AppText>
				) : null}
			</Sheet>
		</>
	);

	return { start, busy, element };
}

function summaryRows(
	summary: RestoreSummary,
	currencyCode: string,
): [string, string][] {
	return [
		['Transactions', String(summary.transactions)],
		['Categories', String(summary.categories)],
		['Cards', String(summary.cards)],
		['Total income', formatMoney(summary.incomeMinor, currencyCode)],
		['Total expenses', formatMoney(summary.expenseMinor, currencyCode)],
	];
}

function LegacyPreview({
	preview,
	warning,
}: {
	preview: LegacyImportPreview;
	warning: string | null;
}) {
	const { snapshot } = preview;
	const rejected = snapshot.issues.filter(
		(issue) => issue.severity === 'rejected',
	).length;
	return (
		<>
			<SummaryCard
				rows={[
					[
						'Transactions',
						`${snapshot.transactions.length} of ${snapshot.sourceCounts.transactions}`,
					],
					['Categories', String(snapshot.categories.length)],
					['Cards', String(snapshot.cards.length)],
					['Currency', snapshot.settings.currencyCode],
				]}
			/>
			{rejected > 0 ? (
				<Warning
					text={`${rejected} rows could not be imported. They are listed below.`}
				/>
			) : null}
			{warning ? <Warning text={warning} /> : null}
			<IssueList issues={snapshot.issues} />
		</>
	);
}

function Reconciliation({
	checks,
	result,
	issues,
}: {
	checks: ReconciliationCheck[];
	result: LegacyImportResult;
	issues: LegacyImportIssue[];
}) {
	const theme = useTheme();
	return (
		<>
			<AppText variant='bodyLarge'>
				Your PennyWise 1 data was imported and checked against the
				backup.
			</AppText>
			<Surface style={{ gap: theme.spacing.xs }}>
				{checks.map((check) => (
					<View
						key={check.label}
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: theme.spacing.xs,
						}}
						accessible
						accessibilityLabel={`${check.label}, ${check.passed ? 'matched' : 'did not match'}`}>
						<Icon
							name={check.passed ? 'check' : 'warning'}
							size={14}
							color={
								check.passed
									? theme.colors.positive
									: theme.colors.negative
							}
						/>
						<AppText variant='body' style={{ flex: 1 }}>
							{check.label}
						</AppText>
					</View>
				))}
			</Surface>
			{result.legacyDisplayedBalanceMinor !== result.exactBalanceMinor ? (
				<Warning text='PennyWise 1 showed a balance affected by floating-point rounding. PennyWise 2 shows the exact total of your transactions, so the figures can differ by a few cents.' />
			) : null}
			<IssueList issues={issues} />
		</>
	);
}

function IssueList({ issues }: { issues: LegacyImportIssue[] }) {
	const theme = useTheme();
	if (issues.length === 0) return null;
	return (
		<Surface style={{ gap: theme.spacing.sm }}>
			<AppText variant='label' tone='textSecondary'>
				Notes
			</AppText>
			{issues.slice(0, 50).map((issue, index) => (
				<AppText
					key={index}
					variant='bodySmall'
					tone={
						issue.severity === 'rejected'
							? 'negative'
							: 'textSecondary'
					}>
					{issue.row !== null ? `Row ${issue.row}: ` : ''}
					{issue.message}
				</AppText>
			))}
			{issues.length > 50 ? (
				<AppText variant='bodySmall' tone='textTertiary'>
					and {issues.length - 50} more
				</AppText>
			) : null}
		</Surface>
	);
}

function SummaryCard({ rows }: { rows: [string, string][] }) {
	const theme = useTheme();
	return (
		<Surface style={{ gap: theme.spacing.xs }}>
			{rows.map(([label, value]) => (
				<View
					key={label}
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
					}}
					accessible
					accessibilityLabel={`${label}, ${value}`}>
					<AppText variant='body' tone='textSecondary'>
						{label}
					</AppText>
					<AppText
						variant='body'
						numeric
						style={{ fontWeight: '600' }}>
						{value}
					</AppText>
				</View>
			))}
		</Surface>
	);
}

function Warning({ text }: { text: string }) {
	const theme = useTheme();
	return (
		<View
			style={{
				flexDirection: 'row',
				gap: theme.spacing.xs,
				padding: theme.spacing.sm,
				borderRadius: theme.radii.md,
				backgroundColor: theme.colors.warningSoft,
			}}
			accessibilityRole='alert'>
			<Icon name='warning' size={16} color={theme.colors.warning} />
			<AppText variant='bodySmall' tone='warning' style={{ flex: 1 }}>
				{text}
			</AppText>
		</View>
	);
}
