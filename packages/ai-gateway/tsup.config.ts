import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/beep-ai.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  clean: true,
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
});
