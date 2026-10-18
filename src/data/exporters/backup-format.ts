import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { z } from 'zod';

import { CATEGORY_ICONS, MAIN_ACCOUNT_ID } from '@/domain/entities';
import {
	base64ToBytes,
	bytesToBase64,
	bytesToHex,
	utf8Decode,
	utf8Encode,
} from '@/lib/crypto/bytes';

export const BACKUP_FORMAT = 'pennywise.backup';
export const BACKUP_VERSION = 2;
export const BACKUP_FILE_EXTENSION = 'pwbackup';
const ENVELOPE_FORMAT = 'pennywise.encrypted-backup';
export const BACKUP_KDF_ITERATIONS = 310_000;

const recurrenceSchema = z
	.object({
		frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
		day: z.number().int().min(1).max(31).nullable(),
		month: z.number().int().min(1).max(12).nullable(),
	})
	.nullable();

const localDateTime = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/);

export const backupPayloadSchema = z.object({
	format: z.literal(BACKUP_FORMAT),
	version: z.literal(BACKUP_VERSION),
	schemaVersion: z.number().int().positive(),
	exportedAt: localDateTime,
	counts: z.object({
		categories: z.number().int().nonnegative(),
		cards: z.number().int().nonnegative(),
		transactions: z.number().int().nonnegative(),
		receipts: z.number().int().nonnegative(),
	}),
	settings: z.object({
		name: z.string(),
		currencyCode: z.string().length(3),
		onboardingCompleted: z.boolean(),
		monthlyBudgetMinor: z.number().int().positive().nullable(),
		budgetAlertPercent: z.number().int().min(1).max(100),
		budgetAlertsEnabled: z.boolean(),
		appearance: z.enum(['system', 'light', 'dark']),
		autoLockSeconds: z.number().int().nonnegative(),
		hideAmounts: z.boolean(),
	}),
	categories: z.array(
		z.object({
			id: z.string().min(1),
			name: z.string().min(1),
			icon: z.enum(CATEGORY_ICONS),
			color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
			budgetLimitMinor: z.number().int().nonnegative().nullable(),
			legacyIconCode: z.number().int().nullable(),
			sortOrder: z.number().int(),
			archivedAt: z.string().nullable(),
		}),
	),
	cards: z.array(
		z.object({
			id: z.string().min(1),
			bankName: z.string(),
			holderName: z.string(),
			lastFour: z.string().regex(/^\d{4}$/),
			network: z.enum([
				'visa',
				'mastercard',
				'amex',
				'discover',
				'other',
			]),
			color: z.string(),
		}),
	),
	transactions: z.array(
		z.object({
			id: z.string().min(1),
			type: z.enum(['income', 'expense']),
			amountMinor: z
				.number()
				.int()
				.positive()
				.max(Number.MAX_SAFE_INTEGER),
			categoryId: z.string().min(1),
			cardId: z.string().nullable(),
			accountId: z.string().min(1).default(MAIN_ACCOUNT_ID),
			occurredAt: localDateTime,
			note: z.string(),
			receiptFile: z
				.string()
				.regex(/^[A-Za-z0-9-]+\.(jpg|jpeg|png|heic)$/)
				.nullable(),
			recurrence: recurrenceSchema,
			recurrenceSourceId: z.string().nullable(),
			occurrenceDate: z.string().nullable(),
			createdAt: z.string(),
			updatedAt: z.string(),
		}),
	),
	receipts: z.array(
		z.object({
			file: z.string().regex(/^[A-Za-z0-9-]+\.(jpg|jpeg|png|heic)$/),
			base64: z.string(),
		}),
	),
	accounts: z
		.array(
			z.object({
				id: z.string().min(1),
				name: z.string().min(1),
				kind: z.enum([
					'cash',
					'checking',
					'savings',
					'credit',
					'other',
				]),
				color: z.string(),
				openingBalanceMinor: z.number().int().safe(),
				sortOrder: z.number().int(),
				archivedAt: z.string().nullable(),
			}),
		)
		.default([
			{
				id: MAIN_ACCOUNT_ID,
				name: 'Main account',
				kind: 'checking',
				color: '#176B57',
				openingBalanceMinor: 0,
				sortOrder: 0,
				archivedAt: null,
			},
		]),
	transfers: z
		.array(
			z.object({
				id: z.string().min(1),
				fromAccountId: z.string().min(1),
				toAccountId: z.string().min(1),
				amountMinor: z.number().int().positive().safe(),
				occurredAt: localDateTime,
				note: z.string(),
				createdAt: z.string(),
			}),
		)
		.default([]),
	goals: z
		.array(
			z.object({
				id: z.string().min(1),
				name: z.string().min(1),
				targetMinor: z.number().int().positive().safe(),
				targetDate: z.string().nullable(),
				color: z.string(),
				createdAt: z.string(),
				archivedAt: z.string().nullable(),
			}),
		)
		.default([]),
	goalContributions: z
		.array(
			z.object({
				id: z.string().min(1),
				goalId: z.string().min(1),
				amountMinor: z.number().int().safe(),
				occurredAt: localDateTime,
			}),
		)
		.default([]),
});

export type BackupPayload = z.output<typeof backupPayloadSchema>;

const envelopeSchema = z.object({
	format: z.literal(ENVELOPE_FORMAT),
	version: z.literal(BACKUP_VERSION),
	kdf: z.object({
		algorithm: z.literal('PBKDF2-HMAC-SHA256'),
		iterations: z.number().int().min(100_000).max(5_000_000),
		salt: z.string(),
	}),
	cipher: z.object({
		algorithm: z.literal('AES-256-GCM'),
		nonce: z.string(),
	}),
	ciphertext: z.string(),
});

type Envelope = z.infer<typeof envelopeSchema>;

export class BackupFormatError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BackupFormatError';
	}
}

export class BackupPasswordError extends Error {
	constructor() {
		super('The password is incorrect or the backup has been modified.');
		this.name = 'BackupPasswordError';
	}
}

function associatedData(envelope: Omit<Envelope, 'ciphertext'>): Uint8Array {
	return utf8Encode(
		[
			envelope.format,
			envelope.version,
			envelope.kdf.algorithm,
			envelope.kdf.iterations,
			envelope.kdf.salt,
			envelope.cipher.algorithm,
			envelope.cipher.nonce,
		].join('|'),
	);
}

async function deriveKey(
	password: string,
	salt: Uint8Array,
	iterations: number,
): Promise<Uint8Array> {
	return pbkdf2Async(sha256, utf8Encode(password.normalize('NFC')), salt, {
		c: iterations,
		dkLen: 32,
		asyncTick: 25,
	});
}

export function validateBackupPassword(password: string): string | null {
	if (password.length < 8) return 'Use at least 8 characters';
	return null;
}

export async function sealBackup(
	payload: BackupPayload,
	password: string,
	random: (length: number) => Uint8Array,
	iterations = BACKUP_KDF_ITERATIONS,
): Promise<string> {
	const salt = random(16);
	const nonce = random(12);
	const header: Omit<Envelope, 'ciphertext'> = {
		format: ENVELOPE_FORMAT,
		version: BACKUP_VERSION,
		kdf: {
			algorithm: 'PBKDF2-HMAC-SHA256',
			iterations,
			salt: bytesToBase64(salt),
		},
		cipher: { algorithm: 'AES-256-GCM', nonce: bytesToBase64(nonce) },
	};
	const key = await deriveKey(password, salt, iterations);
	const sealed = gcm(key, nonce, associatedData(header)).encrypt(
		utf8Encode(JSON.stringify(payload)),
	);
	return JSON.stringify({ ...header, ciphertext: bytesToBase64(sealed) });
}

export function isSealedBackup(text: string): boolean {
	return text.trimStart().startsWith('{') && text.includes(ENVELOPE_FORMAT);
}

export async function openBackup(
	text: string,
	password: string,
): Promise<BackupPayload> {
	let envelope: Envelope;
	try {
		envelope = envelopeSchema.parse(JSON.parse(text));
	} catch {
		throw new BackupFormatError(
			'This file is not a PennyWise 2 backup or it is damaged.',
		);
	}
	const key = await deriveKey(
		password,
		base64ToBytes(envelope.kdf.salt),
		envelope.kdf.iterations,
	);
	let plain: string;
	try {
		plain = utf8Decode(
			gcm(
				key,
				base64ToBytes(envelope.cipher.nonce),
				associatedData(envelope),
			).decrypt(base64ToBytes(envelope.ciphertext)),
		);
	} catch {
		throw new BackupPasswordError();
	}
	const parsed = backupPayloadSchema.safeParse(JSON.parse(plain));
	if (!parsed.success)
		throw new BackupFormatError(
			'The backup contents are not valid for this version of PennyWise.',
		);
	verifyCounts(parsed.data);
	return parsed.data;
}

function verifyCounts(payload: BackupPayload): void {
	const { counts } = payload;
	if (
		counts.categories !== payload.categories.length ||
		counts.cards !== payload.cards.length ||
		counts.transactions !== payload.transactions.length ||
		counts.receipts !== payload.receipts.length
	) {
		throw new BackupFormatError(
			'The backup is incomplete: record counts do not match its manifest.',
		);
	}
}

export function contentFingerprint(text: string | Uint8Array): string {
	return bytesToHex(
		sha256(typeof text === 'string' ? utf8Encode(text) : text),
	);
}
