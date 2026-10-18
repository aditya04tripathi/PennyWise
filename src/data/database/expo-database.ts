import * as SQLite from 'expo-sqlite';

import type { SqlDatabase, SqlExecutor, SqlValue } from './sql-database';

type ExpoExecutorLike = Pick<
	SQLite.SQLiteDatabase,
	'runAsync' | 'getAllAsync' | 'getFirstAsync' | 'execAsync'
>;

function wrapExecutor(target: ExpoExecutorLike): SqlExecutor {
	return {
		async run(sql, params = []) {
			const result = await target.runAsync(sql, params as SqlValue[]);
			return { changes: result.changes };
		},
		all: (sql, params = []) =>
			target.getAllAsync(sql, params as SqlValue[]),
		get: (sql, params = []) =>
			target.getFirstAsync(sql, params as SqlValue[]),
		exec: (sql) => target.execAsync(sql),
	};
}

export function wrapExpoDatabase(database: SQLite.SQLiteDatabase): SqlDatabase {
	return {
		...wrapExecutor(database),
		async transaction(work) {
			let result: Awaited<ReturnType<typeof work>> | undefined;
			await database.withExclusiveTransactionAsync(async (txn) => {
				result = await work(wrapExecutor(txn));
			});
			return result as Awaited<ReturnType<typeof work>>;
		},
		close: () => database.closeAsync(),
	};
}
