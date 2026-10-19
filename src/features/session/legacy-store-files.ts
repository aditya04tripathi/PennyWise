import { Directory, Paths } from 'expo-file-system';

const HIVE_BOXES = [
	'transactionBox',
	'categoryBox',
	'paymentCards',
	'userBox',
] as const;

function isLegacyStoreFile(name: string): boolean {
	return HIVE_BOXES.some(
		(box) => name === box || name.startsWith(`${box}.`),
	);
}

export function removeLegacyStoreFiles(): boolean {
	let removed = false;
	let directories: Directory[];
	try {
		const documents = Paths.document;
		directories = [
			documents,
			new Directory(documents.parentDirectory, 'app_flutter'),
		];
	} catch {
		return false;
	}
	for (const directory of directories) {
		try {
			if (!directory.exists) continue;
			for (const entry of directory.list()) {
				if (!isLegacyStoreFile(entry.name)) continue;
				entry.delete();
				removed = true;
			}
		} catch {
			continue;
		}
	}
	return removed;
}
