module.exports = {
	projects: [
		{
			displayName: 'domain-and-data',
			preset: 'jest-expo',
			testEnvironment: 'node',
			testMatch: [
				'<rootDir>/tests/unit/**/*.test.ts',
				'<rootDir>/tests/integration/**/*.test.ts',
			],
			moduleNameMapper: {
				'^@/(.*)$': '<rootDir>/src/$1',
				'^@tests/(.*)$': '<rootDir>/tests/$1',
			},
			transformIgnorePatterns: [
				'node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-.*|react-navigation|@react-navigation/.*|@noble/.*))',
			],
		},
	],
	collectCoverageFrom: [
		'src/domain/**/*.ts',
		'src/data/**/*.ts',
		'!src/data/database/expo-database.ts',
		'!src/data/database/open-encrypted-database.ts',
	],
};
