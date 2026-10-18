import { useEffect, useState } from 'react';

import { loadReceiptDataUri } from '@/features/receipts/receipt-files';

export type ReceiptImageState =
	| { status: 'none' }
	| { status: 'loading' }
	| { status: 'ready'; uri: string }
	| { status: 'unavailable' };

export function useReceiptImage(fileName: string | null): ReceiptImageState {
	const [loaded, setLoaded] = useState<{
		fileName: string;
		uri: string | null;
	} | null>(null);

	useEffect(() => {
		if (!fileName) return;
		let cancelled = false;
		loadReceiptDataUri(fileName)
			.catch(() => null)
			.then((uri) => {
				if (!cancelled) setLoaded({ fileName, uri });
			});
		return () => {
			cancelled = true;
		};
	}, [fileName]);

	if (!fileName) return { status: 'none' };
	if (loaded?.fileName !== fileName) return { status: 'loading' };
	return loaded.uri
		? { status: 'ready', uri: loaded.uri }
		: { status: 'unavailable' };
}
