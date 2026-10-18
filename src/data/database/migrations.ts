import type { SqlDatabase } from './sql-database';

export interface Migration {
	version: number;
	name: string;
	sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
	{
		version: 1,
		name: 'initial-ledger',
		sql: `
      CREATE TABLE settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL DEFAULT '',
        currency_code TEXT NOT NULL DEFAULT 'USD',
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        monthly_budget_minor INTEGER CHECK (monthly_budget_minor IS NULL OR monthly_budget_minor > 0),
        budget_alert_percent INTEGER NOT NULL DEFAULT 80 CHECK (budget_alert_percent BETWEEN 1 AND 100),
        budget_alerts_enabled INTEGER NOT NULL DEFAULT 1,
        appearance TEXT NOT NULL DEFAULT 'system' CHECK (appearance IN ('system', 'light', 'dark')),
        auto_lock_seconds INTEGER NOT NULL DEFAULT 0 CHECK (auto_lock_seconds >= 0),
        hide_amounts INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO settings (id) VALUES (1);

      CREATE TABLE categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        budget_limit_minor INTEGER CHECK (budget_limit_minor IS NULL OR budget_limit_minor >= 0),
        legacy_icon_code INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        archived_at TEXT
      );

      CREATE TABLE payment_cards (
        id TEXT PRIMARY KEY NOT NULL,
        bank_name TEXT NOT NULL,
        holder_name TEXT NOT NULL,
        last_four TEXT NOT NULL CHECK (length(last_four) = 4 AND last_four NOT GLOB '*[^0-9]*'),
        network TEXT NOT NULL CHECK (network IN ('visa', 'mastercard', 'amex', 'discover', 'other')),
        color TEXT NOT NULL
      );

      CREATE TABLE transactions (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        card_id TEXT REFERENCES payment_cards(id) ON DELETE SET NULL,
        occurred_at TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        receipt_file TEXT,
        recurrence_frequency TEXT CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        recurrence_day INTEGER CHECK (recurrence_day IS NULL OR recurrence_day BETWEEN 1 AND 31),
        recurrence_month INTEGER CHECK (recurrence_month IS NULL OR recurrence_month BETWEEN 1 AND 12),
        recurrence_source_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
        occurrence_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX transactions_occurred_at ON transactions (occurred_at DESC);
      CREATE INDEX transactions_category ON transactions (category_id, occurred_at);
      CREATE INDEX transactions_card ON transactions (card_id);
      CREATE INDEX transactions_recurring ON transactions (recurrence_frequency) WHERE recurrence_frequency IS NOT NULL;
      CREATE UNIQUE INDEX transactions_unique_occurrence
        ON transactions (recurrence_source_id, occurrence_date)
        WHERE recurrence_source_id IS NOT NULL;

      CREATE TABLE budget_alert_log (
        month_key TEXT NOT NULL,
        level TEXT NOT NULL CHECK (level IN ('threshold', 'exceeded')),
        sent_at TEXT NOT NULL,
        PRIMARY KEY (month_key, level)
      );

      CREATE TABLE import_batches (
        id TEXT PRIMARY KEY NOT NULL,
        source TEXT NOT NULL,
        strategy TEXT NOT NULL,
        content_sha256 TEXT NOT NULL,
        imported_at TEXT NOT NULL,
        report_json TEXT NOT NULL
      );
    `,
	},
	{
		version: 2,
		name: 'accounts-transfers-goals-category-budgets',
		sql: `
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        kind TEXT NOT NULL CHECK (kind IN ('cash', 'checking', 'savings', 'credit', 'other')),
        color TEXT NOT NULL,
        opening_balance_minor INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        archived_at TEXT
      );
      INSERT INTO accounts (id, name, kind, color, sort_order) VALUES ('main', 'Main account', 'checking', '#176B57', 0);

      ALTER TABLE transactions ADD COLUMN account_id TEXT NOT NULL DEFAULT 'main';
      CREATE INDEX transactions_account ON transactions (account_id, occurred_at);
      CREATE TRIGGER transactions_account_insert BEFORE INSERT ON transactions
        WHEN NOT EXISTS (SELECT 1 FROM accounts WHERE id = NEW.account_id)
        BEGIN SELECT RAISE(ABORT, 'FOREIGN KEY constraint failed: account'); END;
      CREATE TRIGGER transactions_account_update BEFORE UPDATE OF account_id ON transactions
        WHEN NOT EXISTS (SELECT 1 FROM accounts WHERE id = NEW.account_id)
        BEGIN SELECT RAISE(ABORT, 'FOREIGN KEY constraint failed: account'); END;
      CREATE TRIGGER accounts_delete_restrict BEFORE DELETE ON accounts
        WHEN EXISTS (SELECT 1 FROM transactions WHERE account_id = OLD.id)
        BEGIN SELECT RAISE(ABORT, 'FOREIGN KEY constraint failed: account in use'); END;

      CREATE TABLE transfers (
        id TEXT PRIMARY KEY NOT NULL,
        from_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
        to_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
        amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
        occurred_at TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        CHECK (from_account_id <> to_account_id)
      );
      CREATE INDEX transfers_occurred_at ON transfers (occurred_at DESC);

      CREATE TABLE savings_goals (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        target_minor INTEGER NOT NULL CHECK (target_minor > 0),
        target_date TEXT,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL,
        archived_at TEXT
      );

      CREATE TABLE goal_contributions (
        id TEXT PRIMARY KEY NOT NULL,
        goal_id TEXT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
        amount_minor INTEGER NOT NULL CHECK (amount_minor <> 0),
        occurred_at TEXT NOT NULL
      );
      CREATE INDEX goal_contributions_goal ON goal_contributions (goal_id, occurred_at);

      CREATE TABLE category_budget_alert_log (
        month_key TEXT NOT NULL,
        category_id TEXT NOT NULL,
        level TEXT NOT NULL CHECK (level IN ('threshold', 'exceeded')),
        sent_at TEXT NOT NULL,
        PRIMARY KEY (month_key, category_id, level)
      );
    `,
	},
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export class SchemaMigrationError extends Error {
	constructor(
		readonly version: number,
		cause: unknown,
	) {
		super(`Database upgrade to version ${version} failed`);
		this.name = 'SchemaMigrationError';
		this.cause = cause;
	}
}

export class NewerSchemaError extends Error {
	constructor(readonly found: number) {
		super(
			`This database was created by a newer version of PennyWise (schema ${found}).`,
		);
		this.name = 'NewerSchemaError';
	}
}

export async function migrateDatabase(
	database: SqlDatabase,
	migrations: readonly Migration[] = MIGRATIONS,
): Promise<number> {
	await database.exec('PRAGMA foreign_keys = ON;');
	const row = await database.get<{ user_version: number }>(
		'PRAGMA user_version;',
	);
	let current = row?.user_version ?? 0;
	const latest = migrations[migrations.length - 1]?.version ?? 0;
	if (current > latest) throw new NewerSchemaError(current);

	for (const migration of migrations) {
		if (migration.version <= current) continue;
		try {
			await database.transaction(async (executor) => {
				await executor.exec(migration.sql);
				await executor.exec(
					`PRAGMA user_version = ${migration.version};`,
				);
			});
		} catch (error) {
			throw new SchemaMigrationError(migration.version, error);
		}
		current = migration.version;
	}
	return current;
}
