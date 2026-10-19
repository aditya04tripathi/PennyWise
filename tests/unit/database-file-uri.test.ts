import { databaseFileUri } from '@/data/database/database-file-uri';

describe('databaseFileUri', () => {
	it('turns an Android filesystem path into a file URI', () => {
		expect(
			databaseFileUri(
				'/data/user/0/com.adityatripathi.penny_wise/files/SQLite',
				'pennywise.db',
			),
		).toBe(
			'file:///data/user/0/com.adityatripathi.penny_wise/files/SQLite/pennywise.db',
		);
	});

	it('keeps a directory that is already a URI', () => {
		expect(
			databaseFileUri(
				'file:///var/mobile/Containers/Data/Application/abc/Documents/SQLite/',
				'pennywise.db',
			),
		).toBe(
			'file:///var/mobile/Containers/Data/Application/abc/Documents/SQLite/pennywise.db',
		);
	});
});
