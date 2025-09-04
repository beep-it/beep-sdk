module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@beep/sdk-core$': '<rootDir>/../core/src/index.ts',
    '\\.svg$': '<rootDir>/tests/__mocks__/svg.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!@beep/)'
  ]
};
