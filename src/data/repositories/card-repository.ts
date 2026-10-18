import type { CardNetwork, PaymentCard } from '@/domain/entities';

import type { SqlExecutor } from '../database/sql-database';

interface CardRow {
	id: string;
	bank_name: string;
	holder_name: string;
	last_four: string;
	network: CardNetwork;
	color: string;
}

function toCard(row: CardRow): PaymentCard {
	return {
		id: row.id,
		bankName: row.bank_name,
		holderName: row.holder_name,
		lastFour: row.last_four,
		network: row.network,
		color: row.color,
	};
}

export async function listCards(db: SqlExecutor): Promise<PaymentCard[]> {
	const rows = await db.all<CardRow>(
		'SELECT * FROM payment_cards ORDER BY bank_name COLLATE NOCASE, last_four',
	);
	return rows.map(toCard);
}

export async function upsertCard(
	db: SqlExecutor,
	card: PaymentCard,
): Promise<void> {
	await db.run(
		`INSERT INTO payment_cards (id, bank_name, holder_name, last_four, network, color) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET bank_name = excluded.bank_name, holder_name = excluded.holder_name,
       last_four = excluded.last_four, network = excluded.network, color = excluded.color`,
		[
			card.id,
			card.bankName.trim(),
			card.holderName.trim(),
			card.lastFour,
			card.network,
			card.color,
		],
	);
}

export async function deleteCard(
	db: SqlExecutor,
	cardId: string,
): Promise<void> {
	await db.run('DELETE FROM payment_cards WHERE id = ?', [cardId]);
}

export async function countCardUsage(
	db: SqlExecutor,
	cardId: string,
): Promise<number> {
	const row = await db.get<{ total: number }>(
		'SELECT COUNT(*) AS total FROM transactions WHERE card_id = ?',
		[cardId],
	);
	return row?.total ?? 0;
}
