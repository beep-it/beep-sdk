module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.tsx', '**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    // SDK core mock - use our test mock instead of the real implementation
    '^@beep-it/sdk-core$': '<rootDir>/tests/__mocks__/@beep-it/sdk-core.js',
    // Sui mocks
    '^@mysten/sui$': '<rootDir>/tests/__mocks__/@mysten/sui.js',
    '^@mysten/sui/transactions$': '<rootDir>/tests/__mocks__/@mysten/sui.js',
    // Dynamic Labs mocks
    '^@dynamic-labs/sdk-react-core$': '<rootDir>/tests/__mocks__/@dynamic-labs/sdk-react-core.js',
    '^@dynamic-labs/sui$': '<rootDir>/tests/__mocks__/@dynamic-labs/sui.js',
    // Validator mock
    '^validator$': '<rootDir>/tests/__mocks__/validator.js',
    // SVG files
    '\\.svg$': '<rootDir>/tests/__mocks__/svg.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@beep-it/|@thumbmarkjs/|@dynamic-labs/))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/showcase.tsx',
    '!src/examples/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
};
