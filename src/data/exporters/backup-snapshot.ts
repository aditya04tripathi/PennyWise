import { sumMinor } from '@/domain/money/money';

import { LATEST_SCHEMA_VERSION } from '../database/migrations';
import { clearLedgerData } from '../database/clear-ledger';
import type { SqlDatabase, SqlExecutor } from '../database/sql-database';
import {
	insertTransfer,
	listAccounts,
	listTransfers,
	upsertAccount,
} from '../repositories/account-repository';
import { listCards, upsertCard } from '../repositories/card-repository';
import {
	insertContribution,
	listContributions,
	listGoals,
	upsertGoal,
} from '../repositories/goal-repository';
import {
	listCategories,
	upsertCategory,
} from '../repositories/category-repository';
import {
	loadSettings,
	saveSettings,
} from '../repositories/settings-repository';
import {
	insertTransaction,
	queryTransactions,
} from '../repositories/transaction-repository';
import {
	BACKUP_FORMAT,
	BACKUP_VERSION,
	BackupFormatError,
	type BackupPayload,
} from './backup-format';

export async function collectBackupPayload(
	db: SqlExecutor,
	exportedAt: string,
	readReceipt: (file: string) => Promise<string | null>,
): Promise<{ payload: BackupPayload; missingReceipts: string[] }> {
	const [
		settings,
		categories,
		cards,
		accounts,
		transfers,
		goals,
		goalContributions,
	] = await Promise.all([
		loadSettings(db),
		listCategories(db, true),
		listCards(db),
		listAccounts(db, true),
		listTransfers(db),
		listGoals(db, true),
		listContributions(db),
	]);
	const transactions = await queryTransactions(db, {
		limit: Number.MAX_SAFE_INTEGER,
		offset: 0,
		sort: 'date-asc',
	});
	const referenced = [
		...new Set(
			transactions
				.map((tx) => tx.receiptFile)
				.filter((file): file is string => file !== null),
		),
	];
	const receipts: BackupPayload['receipts'] = [];
	const missingReceipts: string[] = [];
	for (const file of referenced) {
		const base64 = await readReceipt(file);
		if (base64 === null) missingReceipts.push(file);
		else receipts.push({ file, base64 });
	}
	const missing = new Set(missingReceipts);
	const payload: BackupPayload = {
		format: BACKUP_FORMAT,
		version: BACKUP_VERSION,
		schemaVersion: LATEST_SCHEMA_VERSION,
		exportedAt,
		counts: {
			categories: categories.length,
			cards: cards.length,
			transactions: transactions.length,
			receipts: receipts.length,
		},
		settings,
		categories,
		cards,
		transactions: transactions.map((tx) =>
			tx.receiptFile && missing.has(tx.receiptFile)
				? { ...tx, receiptFile: null }
				: tx,
		),
		receipts,
		accounts,
		transfers,
		goals,
		goalContributions,
	};
	return { payload, missingReceipts };
}

export interface RestoreSummary {
	transactions: number;
	categories: number;
	cards: number;
	incomeMinor: number;
	expenseMinor: number;
}

export function summarizePayload(payload: BackupPayload): RestoreSummary {
	return {
		transactions: payload.transactions.length,
		categories: payload.categories.length,
		cards: payload.cards.length,
		incomeMinor: sumMinor(
			payload.transactions
				.filter((tx) => tx.type === 'income')
				.map((tx) => tx.amountMinor),
		),
		expenseMinor: sumMinor(
			payload.transactions
				.filter((tx) => tx.type === 'expense')
				.map((tx) => tx.amountMinor),
		),
	};
}

export async function replaceWithBackup(
	database: SqlDatabase,
	payload: BackupPayload,
): Promise<RestoreSummary> {
	if (payload.schemaVersion > LATEST_SCHEMA_VERSION) {
		throw new BackupFormatError(
			'This backup was made by a newer version of PennyWise. Update the app and try again.',
		);
	}
	const expected = summarizePayload(payload);
	return database.transaction(async (db) => {
		await clearLedgerData(db);
		await saveSettings(db, payload.settings);
		for (const category of payload.categories)
			await upsertCategory(db, category);
		for (const card of payload.cards) await upsertCard(db, card);
		for (const account of payload.accounts)
			await upsertAccount(db, account);
		const sources = payload.transactions.filter(
			(tx) => tx.recurrenceSourceId === null,
		);
		const occurrences = payload.transactions.filter(
			(tx) => tx.recurrenceSourceId !== null,
		);
		for (const transaction of [...sources, ...occurrences])
			await insertTransaction(db, transaction);
		for (const transfer of payload.transfers)
			await insertTransfer(db, transfer);
		for (const goal of payload.goals) await upsertGoal(db, goal);
		for (const contribution of payload.goalContributions)
			await insertContribution(db, contribution);
		const transferCount = await db.get<{ total: number }>(
			'SELECT COUNT(*) AS total FROM transfers',
		);
		const contributionCount = await db.get<{ total: number }>(
			'SELECT COUNT(*) AS total FROM goal_contributions',
		);
		if (
			(transferCount?.total ?? 0) !== payload.transfers.length ||
			(contributionCount?.total ?? 0) !== payload.goalContributions.length
		) {
			throw new BackupFormatError(
				'Restored data did not match the backup. Nothing was changed.',
			);
		}

		const totals = await db.get<{
			count: number;
			income: number | null;
			expense: number | null;
		}>(
			`SELECT COUNT(*) AS count,
         SUM(CASE WHEN type = 'income' THEN amount_minor END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount_minor END) AS expense
       FROM transactions`,
		);
		const actual: RestoreSummary = {
			transactions: totals?.count ?? 0,
			categories: (await listCategories(db, true)).length,
			cards: (await listCards(db)).length,
			incomeMinor: totals?.income ?? 0,
			expenseMinor: totals?.expense ?? 0,
		};
		if (JSON.stringify(actual) !== JSON.stringify(expected)) {
			throw new BackupFormatError(
				'Restored data did not match the backup. Nothing was changed.',
			);
		}
		return actual;
	});
}
