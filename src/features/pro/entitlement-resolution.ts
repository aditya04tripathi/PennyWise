export function proAccessFromStoreResult(
	storeIsPro: boolean | null,
	cachedGrant: boolean,
): boolean {
	return storeIsPro === null ? cachedGrant : storeIsPro;
}
