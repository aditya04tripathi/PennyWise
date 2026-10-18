import {
	deleteGoal,
	insertContribution,
	listGoals,
	savedTotalsByGoal,
	upsertGoal,
} from '@/data/repositories/goal-repository';
import type { SqlExecutor } from '@/data/database/sql-database';
import { toLocalDateTime } from '@/domain/dates';
import type { GoalContribution, SavingsGoal } from '@/domain/entities';
import type { MinorUnits } from '@/domain/money/money';
import { secureRandomId } from '@/lib/crypto/random';

import { requireDatabase, useSession } from '../session/session-store';

export interface GoalProgress {
	goal: SavingsGoal;
	savedMinor: MinorUnits;
}

export async function loadGoalProgress(
	db: SqlExecutor,
): Promise<GoalProgress[]> {
	const [goals, totals] = await Promise.all([
		listGoals(db),
		savedTotalsByGoal(db),
	]);
	return goals.map((goal) => ({
		goal,
		savedMinor: totals.get(goal.id) ?? 0,
	}));
}

export interface GoalInput {
	name: string;
	targetMinor: MinorUnits;
	targetDate: string | null;
	color: string;
}

export function validateGoalInput(
	input: Pick<GoalInput, 'name'>,
): string | null {
	const trimmed = input.name.trim();
	if (!trimmed) return 'Enter a name';
	if (trimmed.length > 40) return 'Keep the name under 40 characters';
	return null;
}

export async function saveGoal(
	input: GoalInput,
	existing: SavingsGoal | null,
): Promise<SavingsGoal> {
	const error = validateGoalInput(input);
	if (error) throw new Error(error);
	if (input.targetMinor <= 0) throw new Error('Enter a target above zero');
	const goal: SavingsGoal = {
		id: existing?.id ?? secureRandomId(),
		name: input.name.trim(),
		targetMinor: input.targetMinor,
		targetDate: input.targetDate,
		color: input.color,
		createdAt: existing?.createdAt ?? toLocalDateTime(new Date()),
		archivedAt: existing?.archivedAt ?? null,
	};
	await upsertGoal(requireDatabase(), goal);
	useSession.getState().notifyDataChanged();
	return goal;
}

export async function removeGoal(goalId: string): Promise<void> {
	await deleteGoal(requireDatabase(), goalId);
	useSession.getState().notifyDataChanged();
}

export async function addContribution(
	goalId: string,
	amountMinor: MinorUnits,
): Promise<GoalContribution> {
	if (!Number.isSafeInteger(amountMinor) || amountMinor === 0)
		throw new Error('Enter an amount');
	const contribution: GoalContribution = {
		id: secureRandomId(),
		goalId,
		amountMinor,
		occurredAt: toLocalDateTime(new Date()),
	};
	await insertContribution(requireDatabase(), contribution);
	useSession.getState().notifyDataChanged();
	return contribution;
}
