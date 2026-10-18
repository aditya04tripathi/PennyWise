import { shouldLockAfterBackground } from '@/domain/security/auto-lock';

describe('shouldLockAfterBackground', () => {
	it('does not lock when the app never went to the background', () => {
		expect(shouldLockAfterBackground(null, 10_000, 0)).toBe(false);
	});

	it('locks immediately when the delay is zero', () => {
		expect(shouldLockAfterBackground(10_000, 10_000, 0)).toBe(true);
	});

	it('waits for the configured delay', () => {
		expect(shouldLockAfterBackground(0, 59_999, 60)).toBe(false);
		expect(shouldLockAfterBackground(0, 60_000, 60)).toBe(true);
	});
});
