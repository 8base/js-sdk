module.exports = {
  transform: {
    '.(ts|tsx)': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      diagnostics: true,
      allowJs: true
    },
    TEST_WORKSPACE_ID: "ck4bg6wtu001808mg6a6u7mjh",
  },

  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts'
  ],
};
