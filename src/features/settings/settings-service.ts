import {
	loadSettings,
	saveSettings,
} from '@/data/repositories/settings-repository';
import { toLocalDateTime } from '@/domain/dates';
import type { UserSettings } from '@/domain/entities';
import { currencyExponent } from '@/domain/money/currency';
import { divideMinorRounded } from '@/domain/money/money';

import { requireDatabase, useSession } from '../session/session-store';

export async function updateSettings(
	changes: Partial<UserSettings>,
): Promise<UserSettings> {
	const database = requireDatabase();
	const current = await loadSettings(database);
	const next = { ...current, ...changes, currencyCode: current.currencyCode };
	await saveSettings(database, next);
	useSession.getState().setSettings(next);
	return next;
}

export interface CurrencyChangePreview {
	from: string;
	to: string;
	exponentChange: number;
	affectedTransactions: number;
	roundedTransactions: number;
}

export async function previewCurrencyChange(
	to: string,
): Promise<CurrencyChangePreview> {
	const database = requireDatabase();
	const settings = await loadSettings(database);
	const exponentChange =
		currencyExponent(to) - currencyExponent(settings.currencyCode);
	const affected = await database.get<{ total: number }>(
		'SELECT COUNT(*) AS total FROM transactions',
	);
	let rounded = 0;
	if (exponentChange < 0) {
		const factor = 10 ** -exponentChange;
		const row = await database.get<{ total: number }>(
			'SELECT COUNT(*) AS total FROM transactions WHERE amount_minor % ? != 0',
			[factor],
		);
		rounded = row?.total ?? 0;
	}
	return {
		from: settings.currencyCode,
		to,
		exponentChange,
		affectedTransactions: exponentChange === 0 ? 0 : (affected?.total ?? 0),
		roundedTransactions: rounded,
	};
}

function rescale(minor: number, exponentChange: number): number {
	if (exponentChange === 0) return minor;
	if (exponentChange > 0) {
		const scaled = minor * 10 ** exponentChange;
		if (!Number.isSafeInteger(scaled))
			throw new Error('Amount too large to convert');
		return scaled;
	}
	return divideMinorRounded(minor, 10 ** -exponentChange);
}

export async function changeCurrency(to: string): Promise<UserSettings> {
	const database = requireDatabase();
	const preview = await previewCurrencyChange(to);
	const now = toLocalDateTime(new Date());
	const next = await database.transaction(async (db) => {
		const settings = await loadSettings(db);
		if (preview.exponentChange !== 0) {
			const rows = await db.all<{ id: string; amount_minor: number }>(
				'SELECT id, amount_minor FROM transactions',
			);
			for (const row of rows) {
				const amount = Math.max(
					1,
					rescale(row.amount_minor, preview.exponentChange),
				);
				await db.run(
					'UPDATE transactions SET amount_minor = ?, updated_at = ? WHERE id = ?',
					[amount, now, row.id],
				);
			}
			const categories = await db.all<{
				id: string;
				budget_limit_minor: number;
			}>(
				'SELECT id, budget_limit_minor FROM categories WHERE budget_limit_minor IS NOT NULL',
			);
			for (const category of categories) {
				await db.run(
					'UPDATE categories SET budget_limit_minor = ? WHERE id = ?',
					[
						rescale(
							category.budget_limit_minor,
							preview.exponentChange,
						),
						category.id,
					],
				);
			}
		}
		const updated: UserSettings = {
			...settings,
			currencyCode: to,
			monthlyBudgetMinor:
				settings.monthlyBudgetMinor === null
					? null
					: Math.max(
							1,
							rescale(
								settings.monthlyBudgetMinor,
								preview.exponentChange,
							),
						),
		};
		await saveSettings(db, updated);
		return updated;
	});
	useSession.getState().setSettings(next);
	useSession.getState().notifyDataChanged();
	return next;
}
