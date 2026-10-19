import { isDiscardableDatabaseFailure } from '@/features/session/discard-existing-data';
import type { DatabaseOpenFailure } from '@/data/database/open-encrypted-database';

const failures: DatabaseOpenFailure[] = [
	'encryption-unavailable',
	'key-unavailable',
	'key-mismatch',
	'migration-failed',
	'unreadable',
	'unknown',
];

describe('isDiscardableDatabaseFailure', () => {
	it('discards data the app cannot open', () => {
		expect(failures.filter(isDiscardableDatabaseFailure)).toEqual([
			'key-mismatch',
			'migration-failed',
			'unreadable',
		]);
	});
});
