export class CsvParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CsvParseError';
	}
}

export function parseCsv(content: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;
	let index = 0;
	const text = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;

	const endField = () => {
		row.push(field);
		field = '';
	};
	const endRow = () => {
		endField();
		if (!(row.length === 1 && row[0] === '')) rows.push(row);
		row = [];
	};

	while (index < text.length) {
		const char = text[index];
		if (inQuotes) {
			if (char === '"') {
				if (text[index + 1] === '"') {
					field += '"';
					index += 2;
					continue;
				}
				inQuotes = false;
			} else {
				field += char;
			}
			index += 1;
			continue;
		}
		if (char === '"' && field === '') {
			inQuotes = true;
		} else if (char === ',') {
			endField();
		} else if (char === '\r' && text[index + 1] === '\n') {
			endRow();
			index += 1;
		} else if (char === '\n' || char === '\r') {
			endRow();
		} else {
			field += char;
		}
		index += 1;
	}
	if (inQuotes) throw new CsvParseError('Unterminated quoted field');
	if (field !== '' || row.length > 0) endRow();
	return rows;
}

export function encodeCsv(
	rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
	return rows.map((row) => row.map(encodeCsvField).join(',')).join('\r\n');
}

function encodeCsvField(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	const text = String(value);
	const needsQuoting = /[",\r\n]/.test(text) || /^[=+\-@\t]/.test(text);
	const safe =
		/^[=+\-@\t]/.test(text) && typeof value === 'string'
			? `'${text}`
			: text;
	return needsQuoting ? `"${safe.replace(/"/g, '""')}"` : safe;
}
