export function databaseFileUri(directory: string, name: string): string {
	const trimmedDirectory = directory.replace(/\/+$/, '');
	const base = /^[a-z][a-z0-9+.-]*:/i.test(trimmedDirectory)
		? trimmedDirectory
		: `file://${trimmedDirectory}`;
	return `${base}/${name.replace(/^\/+/, '')}`;
}
