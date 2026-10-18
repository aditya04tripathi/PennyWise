export type SqlValue = string | number | null;

export interface SqlExecutor {
	run(
		sql: string,
		params?: readonly SqlValue[],
	): Promise<{ changes: number }>;
	all<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
	get<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null>;
	exec(sql: string): Promise<void>;
}

export interface SqlDatabase extends SqlExecutor {
	transaction<T>(work: (executor: SqlExecutor) => Promise<T>): Promise<T>;
	close(): Promise<void>;
}
