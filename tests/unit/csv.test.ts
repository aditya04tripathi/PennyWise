import {
	CsvParseError,
	encodeCsv,
	parseCsv,
} from '@/data/importers/legacy/csv';

describe('csv', () => {
	it('parses quoted fields with escaped quotes, commas and CRLF', () => {
		expect(parseCsv('type,data\r\nuser,"{""a"":""x, y""}"\r\n')).toEqual([
			['type', 'data'],
			['user', '{"a":"x, y"}'],
		]);
	});

	it('supports LF, BOM and embedded newlines', () => {
		expect(parseCsv('\uFEFFa,b\n"multi\nline",2')).toEqual([
			['a', 'b'],
			['multi\nline', '2'],
		]);
	});

	it('rejects unterminated quotes', () => {
		expect(() => parseCsv('a,"b')).toThrow(CsvParseError);
	});

	it('round-trips and neutralises spreadsheet formulas', () => {
		const encoded = encodeCsv([
			['Note', 'Amount'],
			['=HYPERLINK("x")', -12.5],
			['a,b', null],
		]);
		expect(parseCsv(encoded)).toEqual([
			['Note', 'Amount'],
			['\'=HYPERLINK("x")', '-12.5'],
			['a,b', ''],
		]);
	});
});
