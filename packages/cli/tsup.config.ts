import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node18',
  clean: true,
  sourcemap: false,
  minify: false,
  // Shebang is present in src/index.ts; no banner needed
})