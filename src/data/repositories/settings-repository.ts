import type { AppearancePreference, UserSettings } from '@/domain/entities';

import type { SqlExecutor } from '../database/sql-database';

interface SettingsRow {
	name: string;
	currency_code: string;
	onboarding_completed: number;
	monthly_budget_minor: number | null;
	budget_alert_percent: number;
	budget_alerts_enabled: number;
	appearance: AppearancePreference;
	auto_lock_seconds: number;
	hide_amounts: number;
}

export async function loadSettings(db: SqlExecutor): Promise<UserSettings> {
	const row = await db.get<SettingsRow>(
		'SELECT * FROM settings WHERE id = 1',
	);
	if (!row) throw new Error('Settings row is missing');
	return {
		name: row.name,
		currencyCode: row.currency_code,
		onboardingCompleted: row.onboarding_completed === 1,
		monthlyBudgetMinor: row.monthly_budget_minor,
		budgetAlertPercent: row.budget_alert_percent,
		budgetAlertsEnabled: row.budget_alerts_enabled === 1,
		appearance: row.appearance,
		autoLockSeconds: row.auto_lock_seconds,
		hideAmounts: row.hide_amounts === 1,
	};
}

export async function saveSettings(
	db: SqlExecutor,
	settings: UserSettings,
): Promise<void> {
	await db.run(
		`UPDATE settings SET name = ?, currency_code = ?, onboarding_completed = ?, monthly_budget_minor = ?,
      budget_alert_percent = ?, budget_alerts_enabled = ?, appearance = ?, auto_lock_seconds = ?, hide_amounts = ?
     WHERE id = 1`,
		[
			settings.name.trim(),
			settings.currencyCode,
			settings.onboardingCompleted ? 1 : 0,
			settings.monthlyBudgetMinor,
			Math.round(settings.budgetAlertPercent),
			settings.budgetAlertsEnabled ? 1 : 0,
			settings.appearance,
			settings.autoLockSeconds,
			settings.hideAmounts ? 1 : 0,
		],
	);
}

export async function sentBudgetAlerts(
	db: SqlExecutor,
	monthKey: string,
): Promise<('threshold' | 'exceeded')[]> {
	const rows = await db.all<{ level: 'threshold' | 'exceeded' }>(
		'SELECT level FROM budget_alert_log WHERE month_key = ?',
		[monthKey],
	);
	return rows.map((row) => row.level);
}

export async function recordBudgetAlert(
	db: SqlExecutor,
	monthKey: string,
	level: 'threshold' | 'exceeded',
	sentAt: string,
): Promise<void> {
	await db.run(
		'INSERT OR IGNORE INTO budget_alert_log (month_key, level, sent_at) VALUES (?, ?, ?)',
		[monthKey, level, sentAt],
	);
}

export async function sentCategoryBudgetAlerts(
	db: SqlExecutor,
	monthKey: string,
	categoryId: string,
): Promise<('threshold' | 'exceeded')[]> {
	const rows = await db.all<{ level: 'threshold' | 'exceeded' }>(
		'SELECT level FROM category_budget_alert_log WHERE month_key = ? AND category_id = ?',
		[monthKey, categoryId],
	);
	return rows.map((row) => row.level);
}

export async function recordCategoryBudgetAlert(
	db: SqlExecutor,
	monthKey: string,
	categoryId: string,
	level: 'threshold' | 'exceeded',
	sentAt: string,
): Promise<void> {
	await db.run(
		'INSERT OR IGNORE INTO category_budget_alert_log (month_key, category_id, level, sent_at) VALUES (?, ?, ?, ?)',
		[monthKey, categoryId, level, sentAt],
	);
}
