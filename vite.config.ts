import tailcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');

  // Define environment variables to be injected into the client-side build.
  // Note: Sensitive variables (e.g., GEMINI_API_KEY) are intentionally excluded 
  // to maintain server-side security.
  const environmentVars: Record<string, string> = {
    'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || env.GOOGLE_MAPS_PLATFORM_KEY || '')
  };

  Object.keys(env).forEach((key) => {
    if (key.startsWith('VITE_')) {
      environmentVars[`process.env.${key}`] = JSON.stringify(env[key]);
      environmentVars[`import.meta.env.${key}`] = JSON.stringify(env[key]);
    }
  });

  return {
    define: environmentVars,
    plugins: [
      react(), 
      tailcss(),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false
      })
    ],
    base: './',
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: [
        { find: '@', replacement: path.resolve(process.cwd(), './src') },
      ],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'recharts'],
    },
    build: {
      outDir: 'dist',
      assetsDir: '',
      emptyOutDir: true,
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 2000,
      reportCompressedSize: false,
      rollupOptions: {
        input: {
          main: 'index.html',
        },
        external: [
          'express',
          'path',
          'fs',
          'http',
          'url',
          'firebase-admin',
          '@google/genai',
          'ws',
          'dotenv',
          'node-fetch',
          'node:util',
          'node:stream',
          'node:buffer',
          'node:crypto',
          'node:http',
          'node:https',
          'node:zlib',
          'node:fs',
          'node:path',
          'node:events',
          'node:process',
          'node:stream/web',
          'node:net',
          'node:tls',
          'node:child_process',
          'node:os',
          'node:fs/promises',
          'worker_threads',
          'child_process',
          'os',
          'crypto',
          'util',
          'stream',
          'events',
          'assert',
          'querystring',
          'net',
          'tls',
          'https',
          'zlib',
          'http',
          'fs/promises'
        ],
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'server') {
              return 'server.cjs';
            }
            return '[name]-[hash].js';
          },
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: '[name]-[hash][extname]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf')) {
                return 'vendor-jspdf';
              }
              if (id.includes('xlsx')) {
                return 'vendor-xlsx';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('framer-motion') || id.includes('motion')) {
                return 'vendor-motion';
              }
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
