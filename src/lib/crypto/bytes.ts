const BASE64_ALPHABET =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = new Map(
	[...BASE64_ALPHABET].map((char, index) => [char, index]),
);

export function utf8Encode(text: string): Uint8Array {
	const bytes: number[] = [];
	for (const char of text) {
		const code = char.codePointAt(0)!;
		if (code < 0x80) bytes.push(code);
		else if (code < 0x800)
			bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
		else if (code < 0x10000)
			bytes.push(
				0xe0 | (code >> 12),
				0x80 | ((code >> 6) & 63),
				0x80 | (code & 63),
			);
		else
			bytes.push(
				0xf0 | (code >> 18),
				0x80 | ((code >> 12) & 63),
				0x80 | ((code >> 6) & 63),
				0x80 | (code & 63),
			);
	}
	return Uint8Array.from(bytes);
}

export class Utf8DecodeError extends Error {
	constructor() {
		super('Content is not valid UTF-8 text');
		this.name = 'Utf8DecodeError';
	}
}

export function utf8Decode(bytes: Uint8Array): string {
	let result = '';
	let index = 0;
	while (index < bytes.length) {
		const first = bytes[index];
		let code: number;
		let length: number;
		if (first < 0x80) [code, length] = [first, 1];
		else if (first >= 0xc2 && first < 0xe0)
			[code, length] = [first & 31, 2];
		else if (first >= 0xe0 && first < 0xf0)
			[code, length] = [first & 15, 3];
		else if (first >= 0xf0 && first < 0xf5) [code, length] = [first & 7, 4];
		else throw new Utf8DecodeError();
		if (index + length > bytes.length) throw new Utf8DecodeError();
		for (let offset = 1; offset < length; offset += 1) {
			const next = bytes[index + offset];
			if ((next & 0xc0) !== 0x80) throw new Utf8DecodeError();
			code = (code << 6) | (next & 63);
		}
		result += String.fromCodePoint(code);
		index += length;
	}
	return result;
}

export function bytesToBase64(bytes: Uint8Array): string {
	let output = '';
	for (let index = 0; index < bytes.length; index += 3) {
		const chunk =
			(bytes[index] << 16) |
			((bytes[index + 1] ?? 0) << 8) |
			(bytes[index + 2] ?? 0);
		output +=
			BASE64_ALPHABET[(chunk >> 18) & 63] +
			BASE64_ALPHABET[(chunk >> 12) & 63];
		output +=
			index + 1 < bytes.length ? BASE64_ALPHABET[(chunk >> 6) & 63] : '=';
		output += index + 2 < bytes.length ? BASE64_ALPHABET[chunk & 63] : '=';
	}
	return output;
}

export function base64ToBytes(base64: string): Uint8Array {
	const clean = base64.replace(/[\s=]/g, '');
	const output = new Uint8Array(Math.floor((clean.length * 3) / 4));
	let buffer = 0;
	let bits = 0;
	let position = 0;
	for (const char of clean) {
		const value = BASE64_LOOKUP.get(char);
		if (value === undefined) throw new Error('Invalid base64 content');
		buffer = (buffer << 6) | value;
		bits += 6;
		if (bits >= 8) {
			bits -= 8;
			output[position++] = (buffer >> bits) & 0xff;
		}
	}
	return output.subarray(0, position);
}

export function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	);
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
	const output = new Uint8Array(
		parts.reduce((total, part) => total + part.length, 0),
	);
	let offset = 0;
	for (const part of parts) {
		output.set(part, offset);
		offset += part.length;
	}
	return output;
}

export function constantTimeEqual(
	left: Uint8Array,
	right: Uint8Array,
): boolean {
	if (left.length !== right.length) return false;
	let difference = 0;
	for (let index = 0; index < left.length; index += 1)
		difference |= left[index] ^ right[index];
	return difference === 0;
}
