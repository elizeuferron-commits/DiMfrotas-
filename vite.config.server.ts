import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    ssr: 'server.ts',
    outDir: 'dist',
    emptyOutDir: false, // Maintain the client static assets
    rollupOptions: {
      output: {
        entryFileNames: 'server.cjs',
        format: 'cjs',
      },
      external: [
        'express',
        'path',
        'fs',
        'url',
        'vite',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
      ],
    },
    minify: false,
    sourcemap: true,
  },
});
