import {
	LATEST_SCHEMA_VERSION,
	migrateDatabase,
	NewerSchemaError,
	SchemaMigrationError,
} from '@/data/database/migrations';
import type { SqlDatabase } from '@/data/database/sql-database';
import {
	countCategoryUsage,
	deleteUnusedCategory,
	reassignCategoryTransactions,
	upsertCategory,
} from '@/data/repositories/category-repository';
import { deleteCard, upsertCard } from '@/data/repositories/card-repository';
import {
	findTransaction,
	insertTransaction,
	queryTransactions,
	totalsBetween,
	updateTransaction,
} from '@/data/repositories/transaction-repository';
import type { Category, Transaction } from '@/domain/entities';
import { createInMemoryDatabase } from '@tests/fixtures/node-sqlite-database';

const category = (id: string, name: string): Category => ({
	id,
	name,
	icon: 'tag',
	color: '#176B57',
	budgetLimitMinor: null,
	legacyIconCode: null,
	sortOrder: 0,
	archivedAt: null,
});

const transaction = (overrides: Partial<Transaction>): Transaction => ({
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

describe('schema migrations', () => {
	it('is idempotent and records the version', async () => {
		const database = createInMemoryDatabase();
		expect(await migrateDatabase(database)).toBe(LATEST_SCHEMA_VERSION);
		expect(await migrateDatabase(database)).toBe(LATEST_SCHEMA_VERSION);
		await database.close();
	});

	it('refuses databases from a newer app version', async () => {
		const database = createInMemoryDatabase();
		await database.exec('PRAGMA user_version = 999;');
		await expect(migrateDatabase(database)).rejects.toBeInstanceOf(
			NewerSchemaError,
		);
		await database.close();
	});

	it('rolls back a failing migration and keeps the previous version', async () => {
		const database = createInMemoryDatabase();
		await migrateDatabase(database);
		await expect(
			migrateDatabase(database, [
				{ version: 1, name: 'initial', sql: '' },
				{ version: 2, name: 'accounts', sql: '' },
				{
					version: 3,
					name: 'broken',
					sql: 'CREATE TABLE extra (id TEXT); INSERT INTO missing VALUES (1);',
				},
			]),
		).rejects.toBeInstanceOf(SchemaMigrationError);
		expect(
			await database.get<{ user_version: number }>(
				'PRAGMA user_version;',
			),
		).toEqual({ user_version: 2 });
		expect(
			await database.get(
				"SELECT name FROM sqlite_master WHERE name = 'extra'",
			),
		).toBeNull();
		await database.close();
	});
});

describe('repositories', () => {
	let database: SqlDatabase;

	beforeEach(async () => {
		database = createInMemoryDatabase();
		await migrateDatabase(database);
		await upsertCategory(database, category('food', 'Food'));
		await upsertCategory(database, category('misc', 'Misc'));
	});

	afterEach(() => database.close());

	it('enforces foreign keys and positive amounts', async () => {
		await expect(
			insertTransaction(database, transaction({ categoryId: 'nope' })),
		).rejects.toThrow(/FOREIGN KEY/);
		await expect(
			insertTransaction(database, transaction({ amountMinor: 0 })),
		).rejects.toThrow(/CHECK/);
	});

	it('prevents deleting a category that still has history, and supports reassignment', async () => {
		await insertTransaction(database, transaction({ id: 'a' }));
		await expect(deleteUnusedCategory(database, 'food')).rejects.toThrow(
			/FOREIGN KEY/,
		);
		expect(
			await reassignCategoryTransactions(
				database,
				'food',
				'misc',
				'2026-10-11T00:00:00.000',
			),
		).toBe(1);
		await deleteUnusedCategory(database, 'food');
		expect(await countCategoryUsage(database, 'misc')).toBe(1);
	});

	it('unlinks transactions when a card is removed', async () => {
		await upsertCard(database, {
			id: 'c',
			bankName: 'Bank',
			holderName: 'A B',
			lastFour: '1234',
			network: 'visa',
			color: '#000000',
		});
		await insertTransaction(
			database,
			transaction({ id: 'a', cardId: 'c' }),
		);
		await deleteCard(database, 'c');
		expect((await findTransaction(database, 'a'))?.cardId).toBeNull();
	});

	it('rejects card numbers beyond last four digits', async () => {
		await expect(
			upsertCard(database, {
				id: 'c',
				bankName: 'Bank',
				holderName: 'A',
				lastFour: '4242424242424242',
				network: 'visa',
				color: '#000',
			}),
		).rejects.toThrow(/CHECK/);
	});

	it('filters, sorts and paginates', async () => {
		await insertTransaction(
			database,
			transaction({
				id: 'a',
				amountMinor: 500,
				note: 'Coffee 100%',
				occurredAt: '2026-10-01T08:00:00.000',
			}),
		);
		await insertTransaction(
			database,
			transaction({
				id: 'b',
				amountMinor: 2500,
				note: 'Groceries',
				occurredAt: '2026-10-05T08:00:00.000',
			}),
		);
		await insertTransaction(
			database,
			transaction({
				id: 'c',
				type: 'income',
				amountMinor: 90000,
				categoryId: 'misc',
				note: 'Salary',
				occurredAt: '2026-10-07T08:00:00.000',
			}),
		);

		const ids = async (
			query: Partial<Parameters<typeof queryTransactions>[1]>,
		) =>
			(
				await queryTransactions(database, {
					limit: 10,
					offset: 0,
					...query,
				})
			).map((tx) => tx.id);

		expect(await ids({})).toEqual(['c', 'b', 'a']);
		expect(await ids({ search: '100%' })).toEqual(['a']);
		expect(await ids({ search: '%' })).toEqual(['a']);
		expect(await ids({ type: 'expense', sort: 'amount-desc' })).toEqual([
			'b',
			'a',
		]);
		expect(
			await ids({ fromDate: '2026-10-02', toDate: '2026-10-05' }),
		).toEqual(['b']);
		expect(
			await ids({ minAmountMinor: 1000, maxAmountMinor: 3000 }),
		).toEqual(['b']);
		expect(await ids({ limit: 1, offset: 1 })).toEqual(['b']);
		expect(
			await totalsBetween(database, '2026-10-01', '2026-10-31T99'),
		).toEqual({ incomeMinor: 90000, expenseMinor: 3000, count: 3 });
	});

	it('updates while preserving creation metadata', async () => {
		await insertTransaction(database, transaction({ id: 'a' }));
		await updateTransaction(
			database,
			transaction({
				id: 'a',
				amountMinor: 1999,
				createdAt: 'ignored',
				updatedAt: '2026-10-12T00:00:00.000',
			}),
		);
		expect(await findTransaction(database, 'a')).toMatchObject({
			amountMinor: 1999,
			createdAt: '2026-10-10T12:00:00.000',
			updatedAt: '2026-10-12T00:00:00.000',
		});
		await expect(
			updateTransaction(database, transaction({ id: 'missing' })),
		).rejects.toThrow('no longer exists');
	});

	it('prevents posting the same recurring occurrence twice', async () => {
		await insertTransaction(
			database,
			transaction({
				id: 'rent',
				recurrence: { frequency: 'monthly', day: 1, month: null },
			}),
		);
		await insertTransaction(
			database,
			transaction({
				id: 'rent-nov',
				recurrenceSourceId: 'rent',
				occurrenceDate: '2026-11-01',
			}),
		);
		await expect(
			insertTransaction(
				database,
				transaction({
					id: 'rent-nov-2',
					recurrenceSourceId: 'rent',
					occurrenceDate: '2026-11-01',
				}),
			),
		).rejects.toThrow(/UNIQUE/);
	});
});
