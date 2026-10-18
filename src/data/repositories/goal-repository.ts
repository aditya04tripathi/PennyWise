import type { GoalContribution, SavingsGoal } from '@/domain/entities';

import type { SqlExecutor } from '../database/sql-database';

interface GoalRow {
	id: string;
	name: string;
	target_minor: number;
	target_date: string | null;
	color: string;
	created_at: string;
	archived_at: string | null;
}

interface ContributionRow {
	id: string;
	goal_id: string;
	amount_minor: number;
	occurred_at: string;
}

function toGoal(row: GoalRow): SavingsGoal {
	return {
		id: row.id,
		name: row.name,
		targetMinor: row.target_minor,
		targetDate: row.target_date,
		color: row.color,
		createdAt: row.created_at,
		archivedAt: row.archived_at,
	};
}

function toContribution(row: ContributionRow): GoalContribution {
	return {
		id: row.id,
		goalId: row.goal_id,
		amountMinor: row.amount_minor,
		occurredAt: row.occurred_at,
	};
}

export async function listGoals(
	db: SqlExecutor,
	includeArchived = false,
): Promise<SavingsGoal[]> {
	const rows = await db.all<GoalRow>(
		`SELECT * FROM savings_goals ${includeArchived ? '' : 'WHERE archived_at IS NULL'} ORDER BY created_at`,
	);
	return rows.map(toGoal);
}

export async function upsertGoal(
	db: SqlExecutor,
	goal: SavingsGoal,
): Promise<void> {
	await db.run(
		`INSERT INTO savings_goals (id, name, target_minor, target_date, color, created_at, archived_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, target_minor = excluded.target_minor,
       target_date = excluded.target_date, color = excluded.color, archived_at = excluded.archived_at`,
		[
			goal.id,
			goal.name,
			goal.targetMinor,
			goal.targetDate,
			goal.color,
			goal.createdAt,
			goal.archivedAt,
		],
	);
}

export async function deleteGoal(db: SqlExecutor, id: string): Promise<void> {
	await db.run('DELETE FROM savings_goals WHERE id = ?', [id]);
}

export async function insertContribution(
	db: SqlExecutor,
	contribution: GoalContribution,
): Promise<void> {
	await db.run(
		'INSERT INTO goal_contributions (id, goal_id, amount_minor, occurred_at) VALUES (?, ?, ?, ?)',
		[
			contribution.id,
			contribution.goalId,
			contribution.amountMinor,
			contribution.occurredAt,
		],
	);
}

export async function listContributions(
	db: SqlExecutor,
	goalId: string | null = null,
): Promise<GoalContribution[]> {
	const rows = goalId
		? await db.all<ContributionRow>(
				'SELECT * FROM goal_contributions WHERE goal_id = ? ORDER BY occurred_at DESC',
				[goalId],
			)
		: await db.all<ContributionRow>(
				'SELECT * FROM goal_contributions ORDER BY occurred_at',
			);
	return rows.map(toContribution);
}

export async function savedTotalsByGoal(
	db: SqlExecutor,
): Promise<Map<string, number>> {
	const rows = await db.all<{ goal_id: string; total: number }>(
		'SELECT goal_id, SUM(amount_minor) AS total FROM goal_contributions GROUP BY goal_id',
	);
	return new Map(rows.map((row) => [row.goal_id, row.total]));
}
