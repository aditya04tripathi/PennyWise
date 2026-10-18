import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

import type { SqlDatabase } from '@/data/database/sql-database';
import { useSession } from '@/features/session/session-store';

export type QueryState<T> =
	| { status: 'loading'; data: undefined; error: undefined }
	| { status: 'success'; data: T; error: undefined }
	| { status: 'error'; data: T | undefined; error: Error };

export function useLedgerQuery<T>(
	load: (database: SqlDatabase) => Promise<T>,
	dependencies: readonly unknown[],
): QueryState<T> & { reload: () => void } {
	const database = useSession((state) => state.database);
	const dataVersion = useSession((state) => state.dataVersion);
	const [state, setState] = useState<QueryState<T>>({
		status: 'loading',
		data: undefined,
		error: undefined,
	});
	const [manualVersion, setManualVersion] = useState(0);
	const latestData = useRef<T | undefined>(undefined);

	const loadRef = useRef(load);
	useLayoutEffect(() => {
		loadRef.current = load;
	});
	const dependencyKey = JSON.stringify(dependencies);

	useEffect(() => {
		if (!database) return;
		let active = true;
		loadRef.current(database).then(
			(data) => {
				if (!active) return;
				latestData.current = data;
				setState({ status: 'success', data, error: undefined });
			},
			(error: unknown) => {
				if (!active) return;
				setState({
					status: 'error',
					data: latestData.current,
					error:
						error instanceof Error
							? error
							: new Error('Something went wrong'),
				});
			},
		);
		return () => {
			active = false;
		};
	}, [database, dataVersion, manualVersion, dependencyKey]);

	const reload = useCallback(
		() => setManualVersion((value) => value + 1),
		[],
	);
	return { ...state, reload };
}
