import { migrateDatabase } from '@/data/database/migrations';
import {
	insertTransfer,
	upsertAccount,
} from '@/data/repositories/account-repository';
import { upsertCard } from '@/data/repositories/card-repository';
import { upsertCategory } from '@/data/repositories/category-repository';
import {
	insertContribution,
	upsertGoal,
} from '@/data/repositories/goal-repository';
import { insertTransaction } from '@/data/repositories/transaction-repository';
import { removeDevelopmentSeed } from '@/features/session/remove-development-seed';
import { createInMemoryDatabase } from '@tests/fixtures/node-sqlite-database';

describe('removeDevelopmentSeed', () => {
	it('deletes seeded rows and keeps transactions the user added', async () => {
		const database = createInMemoryDatabase();
		await migrateDatabase(database);
		await upsertCategory(database, {
			id: '1',
			name: 'Food',
			icon: 'tag',
			color: '#B7791F',
			budgetLimitMinor: 65_000,
			legacyIconCode: null,
			sortOrder: 0,
			archivedAt: null,
		});
		await upsertCategory(database, {
			id: '7',
			name: 'Entertainment',
			icon: 'tag',
			color: '#6B46C1',
			budgetLimitMinor: 12_000,
			legacyIconCode: null,
			sortOrder: 6,
			archivedAt: null,
		});
		await upsertAccount(database, {
			id: 'main',
			name: 'Everyday checking',
			kind: 'checking',
			color: '#176B57',
			openingBalanceMinor: 420_000,
			sortOrder: 0,
			archivedAt: null,
		});
		await upsertAccount(database, {
			id: 'seed-acct-savings',
			name: 'High-yield savings',
			kind: 'savings',
			color: '#2B6CB0',
			openingBalanceMinor: 800_000,
			sortOrder: 1,
			archivedAt: null,
		});
		await upsertCard(database, {
			id: 'seed-card-visa',
			bankName: 'Everyday',
			holderName: 'Alex',
			lastFour: '4242',
			network: 'visa',
			color: '#1F2937',
		});
		await insertTransaction(database, {
			id: 'seed-tx-0001',
			type: 'expense',
			amountMinor: 1_099,
			categoryId: '7',
			cardId: 'seed-card-visa',
			accountId: 'main',
			occurredAt: '2026-01-04T07:00:00.000',
			note: 'Spotify',
			receiptFile: null,
			recurrence: null,
			recurrenceSourceId: null,
			occurrenceDate: null,
			createdAt: '2026-01-04T07:00:00.000',
			updatedAt: '2026-01-04T07:00:00.000',
		});
		await insertTransaction(database, {
			id: 'user-lunch',
			type: 'expense',
			amountMinor: 1_200,
			categoryId: '1',
			cardId: null,
			accountId: 'main',
			occurredAt: '2026-10-02T12:00:00.000',
			note: 'Lunch',
			receiptFile: null,
			recurrence: null,
			recurrenceSourceId: null,
			occurrenceDate: null,
			createdAt: '2026-10-02T12:00:00.000',
			updatedAt: '2026-10-02T12:00:00.000',
		});
		await insertTransfer(database, {
			id: 'seed-transfer-save-1',
			fromAccountId: 'main',
			toAccountId: 'seed-acct-savings',
			amountMinor: 20_000,
			occurredAt: '2026-01-03T09:00:00.000',
			note: '',
			createdAt: '2026-01-03T09:00:00.000',
		});
		await upsertGoal(database, {
			id: 'seed-goal-emergency',
			name: 'Emergency fund',
			targetMinor: 1_000_000,
			targetDate: '2026-12-31',
			color: '#176B57',
			createdAt: '2026-01-02T09:00:00.000',
			archivedAt: null,
		});
		await insertContribution(database, {
			id: 'seed-contrib-emergency-1',
			goalId: 'seed-goal-emergency',
			amountMinor: 20_000,
			occurredAt: '2026-01-03T09:05:00.000',
		});

		await removeDevelopmentSeed(database);

		const transactions = await database.all<{ id: string }>(
			'SELECT id FROM transactions ORDER BY id',
		);
		const categories = await database.all<{
			id: string;
			budget_limit_minor: number | null;
		}>('SELECT id, budget_limit_minor FROM categories ORDER BY id');
		const accounts = await database.all<{
			id: string;
			name: string;
			opening_balance_minor: number;
		}>('SELECT id, name, opening_balance_minor FROM accounts ORDER BY id');
		const cards = await database.get<{ count: number }>(
			'SELECT COUNT(*) AS count FROM payment_cards',
		);
		const goals = await database.get<{ count: number }>(
			'SELECT COUNT(*) AS count FROM savings_goals',
		);

		expect(transactions.map((row) => row.id)).toEqual(['user-lunch']);
		expect(categories).toEqual([
			{ id: '1', budget_limit_minor: null },
		]);
		expect(accounts).toEqual([
			{
				id: 'main',
				name: 'Main account',
				opening_balance_minor: 0,
			},
		]);
		expect(cards?.count).toBe(0);
		expect(goals?.count).toBe(0);
	});
});
