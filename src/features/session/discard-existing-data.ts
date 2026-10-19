import type { DatabaseOpenFailure } from '@/data/database/open-encrypted-database';

const DISCARDABLE: ReadonlySet<DatabaseOpenFailure> = new Set([
	'key-mismatch',
	'migration-failed',
	'unreadable',
]);

export function isDiscardableDatabaseFailure(
	failure: DatabaseOpenFailure,
): boolean {
	return DISCARDABLE.has(failure);
}
