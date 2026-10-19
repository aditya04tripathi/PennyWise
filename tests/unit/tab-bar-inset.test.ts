import { tabBarInset } from '@/components/ui/tab-bar-inset';

describe('tabBarInset', () => {
	it('reserves the iOS tab bar plus the bottom safe inset', () => {
		expect(tabBarInset(34, 'ios')).toBe(83);
	});

	it('reserves the Material navigation bar plus the bottom safe inset', () => {
		expect(tabBarInset(0, 'android')).toBe(80);
		expect(tabBarInset(24, 'android')).toBe(104);
	});
});
