import type { SqlDatabase } from '@/data/database/sql-database';

const SEEDED_CATEGORY_IDS = [
	'6',
	'7',
	'8',
	'9',
	'10',
	'11',
	'12',
	'13',
] as const;

export async function removeDevelopmentSeed(
	database: SqlDatabase,
): Promise<void> {
	await database.transaction(async (tx) => {
		await tx.run(`DELETE FROM goal_contributions WHERE id LIKE 'seed-%'`);
		await tx.run(`DELETE FROM savings_goals WHERE id LIKE 'seed-%'`);
		await tx.run(`DELETE FROM transactions WHERE id LIKE 'seed-%'`);
		await tx.run(`DELETE FROM transfers WHERE id LIKE 'seed-%'`);
		await tx.run(`DELETE FROM payment_cards WHERE id LIKE 'seed-%'`);
		await tx.run(
			`DELETE FROM accounts
			 WHERE id LIKE 'seed-%'
			   AND NOT EXISTS (SELECT 1 FROM transactions WHERE account_id = accounts.id)
			   AND NOT EXISTS (
			     SELECT 1 FROM transfers
			     WHERE from_account_id = accounts.id OR to_account_id = accounts.id
			   )`,
		);
		await tx.run(
			`UPDATE accounts
			 SET name = 'Main account', opening_balance_minor = 0
			 WHERE id = 'main'
			   AND name = 'Everyday checking'
			   AND opening_balance_minor = 420000`,
		);
		const placeholders = SEEDED_CATEGORY_IDS.map(() => '?').join(', ');
		await tx.run(
			`DELETE FROM categories
			 WHERE (id LIKE 'seed-%' OR id IN (${placeholders}))
			   AND NOT EXISTS (
			     SELECT 1 FROM transactions WHERE category_id = categories.id
			   )`,
			SEEDED_CATEGORY_IDS,
		);
		await tx.run(
			`UPDATE categories
			 SET budget_limit_minor = NULL
			 WHERE (id = '1' AND budget_limit_minor = 65000)
			    OR (id = '2' AND budget_limit_minor = 18000)
			    OR (id = '3' AND budget_limit_minor = 25000)
			    OR (id = '5' AND budget_limit_minor = 180000)`,
		);
		await tx.run(
			`UPDATE settings
			 SET name = '', monthly_budget_minor = NULL
			 WHERE id = 1
			   AND name = 'Alex'
			   AND monthly_budget_minor = 320000
			   AND budget_alert_percent = 80`,
		);
	});
}
