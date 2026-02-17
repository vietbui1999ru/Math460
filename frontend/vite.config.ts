/**
 * Vite Configuration
 *
 * Configuration for Vite build tool with React plugin.
 * Defines build options, dev server settings, and optimizations.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Development server configuration
  server: {
    port: 5743,
    host: true,
    strictPort: false,
    open: false,
    cors: true,
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8001',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'plotly-vendor': ['plotly.js-dist-min'],
        },
      },
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'plotly.js-dist-min'],
  },

  // Environment variable prefix
  envPrefix: 'VITE_',

  // Preview server configuration
  preview: {
    port: 3000,
    host: true,
    strictPort: false,
  },
});
