import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'strip-wgsl-debugger-literal',
      transform(code, id) {
        if (id.includes('three/build/three.webgpu')) {
          return code.replace(/'debugger'|"debugger"/g, '["de","bugger"].join("")');
        }
        return null;
      },
    },
  ],
  esbuild:
    command === 'build'
      ? {
          drop: ['debugger'],
          pure: ['console.debug', 'console.log'],
        }
      : undefined,
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1050,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion') || id.includes('node_modules/lenis')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/jszip')) {
            return 'vendor-zip';
          }
          if (id.includes('/src/data/repoLeaderboard.json')) {
            return 'repo-data';
          }
          if (id.includes('/src/data/previewMap.json')) {
            return 'preview-data';
          }
          if (id.includes('/src/data/sourceCatalog.json')) {
            return 'catalog-data';
          }
          if (id.includes('/src/data/motionShowcaseCatalog.ts')) {
            return 'motion-marquee-data';
          }
          if (id.includes('/src/data/glacierBooksData.ts')) {
            return 'glacier-books-data';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      '/p': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      '/p': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
}));
