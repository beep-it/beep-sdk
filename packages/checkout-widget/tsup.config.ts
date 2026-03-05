import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/showcase.tsx'],
  format: ['iife'],
  outDir: 'dist',
  globalName: 'BeepShowcase',
  dts: false,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  loader: {
    '.svg': 'dataurl',
  },
  // Ensure we don't try to bundle Node.js modules
  platform: 'browser',
  // External dependencies that should not be bundled
  noExternal: ['react', 'react-dom', '@beep-it/sdk-core', 'qrcode'],
});
