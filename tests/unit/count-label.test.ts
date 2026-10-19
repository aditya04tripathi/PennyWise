import { countLabel } from '@/lib/count-label';

describe('countLabel', () => {
	it('uses the singular when the count is one', () => {
		expect(countLabel(1, 'day')).toBe('1 day');
	});

	it('uses the plural for zero and for more than one', () => {
		expect(countLabel(0, 'day')).toBe('0 days');
		expect(countLabel(30, 'day')).toBe('30 days');
	});
});
