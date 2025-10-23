/**
 * ESLint configuration for beep-mcp
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    'dist/**/*',
    '**/dist/**/*',
    'node_modules/**/*',
    '**/node_modules/**/*',
    '.eslintrc.js',
    '**/.eslintrc.js',
  ],
  overrides: [
    {
      files: ['packages/checkout-widget/**/*.{ts,tsx}'],
      parserOptions: {
        project: ['packages/checkout-widget/tsconfig.eslint.json'],
      },
    },
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
};
