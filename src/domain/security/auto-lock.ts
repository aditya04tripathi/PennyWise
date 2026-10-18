export function shouldLockAfterBackground(
	backgroundedAt: number | null,
	nowMs: number,
	autoLockSeconds: number,
): boolean {
	if (backgroundedAt === null) return false;
	return nowMs - backgroundedAt >= autoLockSeconds * 1000;
}
