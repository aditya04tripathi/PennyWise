import type { Category, CategoryIcon } from '@/domain/entities';

import type { SqlExecutor } from '../database/sql-database';

interface CategoryRow {
	id: string;
	name: string;
	icon: CategoryIcon;
	color: string;
	budget_limit_minor: number | null;
	legacy_icon_code: number | null;
	sort_order: number;
	archived_at: string | null;
}

function toCategory(row: CategoryRow): Category {
	return {
		id: row.id,
		name: row.name,
		icon: row.icon,
		color: row.color,
		budgetLimitMinor: row.budget_limit_minor,
		legacyIconCode: row.legacy_icon_code,
		sortOrder: row.sort_order,
		archivedAt: row.archived_at,
	};
}

export async function listCategories(
	db: SqlExecutor,
	includeArchived = false,
): Promise<Category[]> {
	const rows = await db.all<CategoryRow>(
		`SELECT * FROM categories ${includeArchived ? '' : 'WHERE archived_at IS NULL'} ORDER BY sort_order, name COLLATE NOCASE`,
	);
	return rows.map(toCategory);
}

export async function upsertCategory(
	db: SqlExecutor,
	category: Category,
): Promise<void> {
	await db.run(
		`INSERT INTO categories (id, name, icon, color, budget_limit_minor, legacy_icon_code, sort_order, archived_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, icon = excluded.icon, color = excluded.color,
       budget_limit_minor = excluded.budget_limit_minor, sort_order = excluded.sort_order, archived_at = excluded.archived_at`,
		[
			category.id,
			category.name.trim(),
			category.icon,
			category.color,
			category.budgetLimitMinor,
			category.legacyIconCode,
			category.sortOrder,
			category.archivedAt,
		],
	);
}

export async function countCategoryUsage(
	db: SqlExecutor,
	categoryId: string,
): Promise<number> {
	const row = await db.get<{ total: number }>(
		'SELECT COUNT(*) AS total FROM transactions WHERE category_id = ?',
		[categoryId],
	);
	return row?.total ?? 0;
}

export async function reassignCategoryTransactions(
	db: SqlExecutor,
	fromId: string,
	toId: string,
	updatedAt: string,
): Promise<number> {
	const result = await db.run(
		'UPDATE transactions SET category_id = ?, updated_at = ? WHERE category_id = ?',
		[toId, updatedAt, fromId],
	);
	return result.changes;
}

export async function deleteUnusedCategory(
	db: SqlExecutor,
	categoryId: string,
): Promise<void> {
	await db.run('DELETE FROM categories WHERE id = ?', [categoryId]);
}

export async function setCategoryArchived(
	db: SqlExecutor,
	categoryId: string,
	archivedAt: string | null,
): Promise<void> {
	await db.run('UPDATE categories SET archived_at = ? WHERE id = ?', [
		archivedAt,
		categoryId,
	]);
}

export async function findCategory(
	db: SqlExecutor,
	categoryId: string,
): Promise<Category | null> {
	const row = await db.get<CategoryRow>(
		'SELECT * FROM categories WHERE id = ?',
		[categoryId],
	);
	return row ? toCategory(row) : null;
}
