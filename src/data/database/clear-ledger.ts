import type { SqlExecutor } from './sql-database';

export async function clearLedgerData(db: SqlExecutor): Promise<void> {
	await db.run('DELETE FROM transfers');
	await db.run('DELETE FROM goal_contributions');
	await db.run('DELETE FROM savings_goals');
	await db.run('DELETE FROM transactions');
	await db.run('DELETE FROM payment_cards');
	await db.run('DELETE FROM categories');
	await db.run('DELETE FROM budget_alert_log');
	await db.run('DELETE FROM category_budget_alert_log');
	await db.run("DELETE FROM accounts WHERE id <> 'main'");
	await db.run(
		"INSERT OR IGNORE INTO accounts (id, name, kind, color, sort_order) VALUES ('main', 'Main account', 'checking', '#176B57', 0)",
	);
}
