import { proAccessFromStoreResult } from '@/features/pro/entitlement-resolution';

describe('proAccessFromStoreResult', () => {
	it('keeps a cached grant only when the store cannot answer', () => {
		expect(proAccessFromStoreResult(null, true)).toBe(true);
		expect(proAccessFromStoreResult(null, false)).toBe(false);
	});

	it('follows the store when it answers', () => {
		expect(proAccessFromStoreResult(false, true)).toBe(false);
		expect(proAccessFromStoreResult(true, false)).toBe(true);
	});
});
