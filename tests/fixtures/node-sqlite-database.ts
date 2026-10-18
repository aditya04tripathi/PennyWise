import { DatabaseSync } from 'node:sqlite';

import type {
	SqlDatabase,
	SqlExecutor,
	SqlValue,
} from '@/data/database/sql-database';

export function createInMemoryDatabase(): SqlDatabase {
	const native = new DatabaseSync(':memory:');
	let queue: Promise<unknown> = Promise.resolve();

	const executor: SqlExecutor = {
		async run(sql, params: readonly SqlValue[] = []) {
			const result = native.prepare(sql).run(...(params as SqlValue[]));
			return { changes: Number(result.changes) };
		},
		async all<T>(sql: string, params: readonly SqlValue[] = []) {
			return native.prepare(sql).all(...(params as SqlValue[])) as T[];
		},
		async get<T>(sql: string, params: readonly SqlValue[] = []) {
			return (
				(native.prepare(sql).get(...(params as SqlValue[])) as
					T | undefined) ?? null
			);
		},
		async exec(sql) {
			native.exec(sql);
		},
	};

	return {
		...executor,
		transaction<T>(work: (tx: SqlExecutor) => Promise<T>) {
			const next = queue.then(async () => {
				native.exec('BEGIN IMMEDIATE');
				try {
					const result = await work(executor);
					native.exec('COMMIT');
					return result;
				} catch (error) {
					native.exec('ROLLBACK');
					throw error;
				}
			});
			queue = next.catch(() => undefined);
			return next;
		},
		async close() {
			native.close();
		},
	};
}
