import { darkColors, lightColors, type ColorTokens } from '@/theme/tokens';

function luminance(hex: string): number {
	const channels = [1, 3, 5].map(
		(offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
	);
	const [red, green, blue] = channels.map((value) =>
		value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
	);
	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string): number {
	const [lighter, darker] = [
		luminance(foreground),
		luminance(background),
	].sort((left, right) => right - left);
	return (lighter + 0.05) / (darker + 0.05);
}

const textPairs: [keyof ColorTokens, keyof ColorTokens, number][] = [
	['textPrimary', 'background', 7],
	['textPrimary', 'surface', 7],
	['textSecondary', 'surface', 4.5],
	['textSecondary', 'background', 4.5],
	['textSecondary', 'surfaceElevated', 4.5],
	['textTertiary', 'surface', 3],
	['brandPrimary', 'surface', 4.5],
	['textOnBrand', 'brandPrimary', 4.5],
	['positive', 'surface', 4.5],
	['negative', 'surface', 4.5],
	['warning', 'surface', 4.5],
	['negative', 'negativeSoft', 4.5],
	['warning', 'warningSoft', 4.5],
	['brandPrimary', 'brandSoft', 4.5],
];

describe.each([
	['light', lightColors],
	['dark', darkColors],
])('%s palette contrast (WCAG 2.1)', (_name, palette) => {
	it.each(textPairs)(
		'%s on %s meets %d:1',
		(foreground, background, minimum) => {
			expect(
				contrast(palette[foreground], palette[background]),
			).toBeGreaterThanOrEqual(minimum);
		},
	);
});
