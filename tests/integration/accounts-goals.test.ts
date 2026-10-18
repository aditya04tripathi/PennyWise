import { migrateDatabase } from '@/data/database/migrations';
import {
	collectBackupPayload,
	replaceWithBackup,
} from '@/data/exporters/backup-snapshot';
import {
	accountActivityTotals,
	countAccountUsage,
	deleteUnusedAccount,
	insertTransfer,
	listAccounts,
	listTransfers,
	upsertAccount,
} from '@/data/repositories/account-repository';
import { upsertCategory } from '@/data/repositories/category-repository';
import {
	deleteGoal,
	insertContribution,
	listContributions,
	savedTotalsByGoal,
	upsertGoal,
} from '@/data/repositories/goal-repository';
import { insertTransaction } from '@/data/repositories/transaction-repository';
import type { Account, Transaction } from '@/domain/entities';
import { createInMemoryDatabase } from '@tests/fixtures/node-sqlite-database';

const savings: Account = {
	id: 'savings',
	name: 'Savings',
	kind: 'savings',
	color: '#3355AA',
	openingBalanceMinor: 50_000,
	sortOrder: 1,
	archivedAt: null,
};

const expense = (overrides: Partial<Transaction>): Transaction => ({
	id: 'tx',
	type: 'expense',
	amountMinor: 1000,
	categoryId: 'food',
	cardId: null,
	accountId: 'main',
	occurredAt: '2026-10-10T12:00:00.000',
	note: 'Lunch',
	receiptFile: null,
	recurrence: null,
	recurrenceSourceId: null,
	occurrenceDate: null,
	createdAt: '2026-10-10T12:00:00.000',
	updatedAt: '2026-10-10T12:00:00.000',
	...overrides,
});

async function preparedDatabase() {
	const database = createInMemoryDatabase();
	await migrateDatabase(database);
	await upsertCategory(database, {
		id: 'food',
		name: 'Food',
		icon: 'tag',
		color: '#176B57',
		budgetLimitMinor: 20_000,
		legacyIconCode: null,
		sortOrder: 0,
		archivedAt: null,
	});
	await upsertAccount(database, savings);
	return database;
}

describe('accounts and transfers', () => {
	it('ships a default main account and assigns existing transactions to it', async () => {
		const database = await preparedDatabase();
		await insertTransaction(database, expense({ id: 'a' }));
		expect((await listAccounts(database)).map((a) => a.id)).toEqual([
			'main',
			'savings',
		]);
		expect(await countAccountUsage(database, 'main')).toBe(1);
		await database.close();
	});

	it('rejects transactions for unknown accounts and protects used accounts', async () => {
		const database = await preparedDatabase();
		await expect(
			insertTransaction(
				database,
				expense({ id: 'x', accountId: 'nope' }),
			),
		).rejects.toThrow();
		await insertTransaction(
			database,
			expense({ id: 'b', accountId: 'savings' }),
		);
		await expect(
			database.run("DELETE FROM accounts WHERE id = 'savings'"),
		).rejects.toThrow();
		await expect(
			deleteUnusedAccount(database, 'savings'),
		).rejects.toThrow();
		await database.close();
	});

	it('computes per-account activity including transfers up to a date', async () => {
		const database = await preparedDatabase();
		await insertTransaction(
			database,
			expense({ id: 'i', type: 'income', amountMinor: 30_000 }),
		);
		await insertTransaction(
			database,
			expense({ id: 'e', amountMinor: 2_000 }),
		);
		await insertTransfer(database, {
			id: 't1',
			fromAccountId: 'main',
			toAccountId: 'savings',
			amountMinor: 10_000,
			occurredAt: '2026-10-11T08:00:00.000',
			note: '',
			createdAt: '2026-10-11T08:00:00.000',
		});
		await insertTransfer(database, {
			id: 'future',
			fromAccountId: 'main',
			toAccountId: 'savings',
			amountMinor: 1,
			occurredAt: '2026-12-01T08:00:00.000',
			note: '',
			createdAt: '2026-10-11T08:00:00.000',
		});
		const totals = await accountActivityTotals(
			database,
			'2026-10-31T23:59:59.999',
		);
		expect(totals.find((t) => t.accountId === 'main')).toEqual({
			accountId: 'main',
			incomeMinor: 30_000,
			expenseMinor: 2_000,
			transfersInMinor: 0,
			transfersOutMinor: 10_000,
		});
		expect(
			totals.find((t) => t.accountId === 'savings')?.transfersInMinor,
		).toBe(10_000);
		await expect(
			insertTransfer(database, {
				id: 'self',
				fromAccountId: 'main',
				toAccountId: 'main',
				amountMinor: 1,
				occurredAt: '2026-10-11T08:00:00.000',
				note: '',
				createdAt: '2026-10-11T08:00:00.000',
			}),
		).rejects.toThrow();
		await database.close();
	});
});

describe('savings goals', () => {
	it('totals contributions and cascades on delete', async () => {
		const database = await preparedDatabase();
		await upsertGoal(database, {
			id: 'trip',
			name: 'Trip',
			targetMinor: 100_000,
			targetDate: '2027-06-01',
			color: '#AA5533',
			createdAt: '2026-10-01T00:00:00.000',
			archivedAt: null,
		});
		await insertContribution(database, {
			id: 'c1',
			goalId: 'trip',
			amountMinor: 25_000,
			occurredAt: '2026-10-02T00:00:00.000',
		});
		await insertContribution(database, {
			id: 'c2',
			goalId: 'trip',
			amountMinor: -5_000,
			occurredAt: '2026-10-03T00:00:00.000',
		});
		expect((await savedTotalsByGoal(database)).get('trip')).toBe(20_000);
		await deleteGoal(database, 'trip');
		expect(await listContributions(database)).toEqual([]);
		await database.close();
	});
});

describe('backup with accounts, transfers and goals', () => {
	it('round trips the new tables', async () => {
		const source = await preparedDatabase();
		await insertTransaction(
			source,
			expense({ id: 's', accountId: 'savings' }),
		);
		await insertTransfer(source, {
			id: 't1',
			fromAccountId: 'main',
			toAccountId: 'savings',
			amountMinor: 500,
			occurredAt: '2026-10-11T08:00:00.000',
			note: 'Move',
			createdAt: '2026-10-11T08:00:00.000',
		});
		await upsertGoal(source, {
			id: 'trip',
			name: 'Trip',
			targetMinor: 100_000,
			targetDate: null,
			color: '#AA5533',
			createdAt: '2026-10-01T00:00:00.000',
			archivedAt: null,
		});
		await insertContribution(source, {
			id: 'c1',
			goalId: 'trip',
			amountMinor: 1_000,
			occurredAt: '2026-10-02T00:00:00.000',
		});
		const { payload } = await collectBackupPayload(
			source,
			'2026-10-19T10:00:00.000',
			async () => null,
		);
		const target = createInMemoryDatabase();
		await migrateDatabase(target);
		await replaceWithBackup(target, payload);
		expect(await listAccounts(target)).toEqual(await listAccounts(source));
		expect(await listTransfers(target)).toEqual(
			await listTransfers(source),
		);
		expect(await listContributions(target)).toEqual(
			await listContributions(source),
		);
		expect(await countAccountUsage(target, 'savings')).toBe(2);
		await source.close();
		await target.close();
	});
});
