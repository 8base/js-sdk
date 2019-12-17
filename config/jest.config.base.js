module.exports = {
  transform: {
    '.(ts|tsx)': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },

  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: [
    '<rootDir>/__tests__/**/*.ts'
  ],
};
