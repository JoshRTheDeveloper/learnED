import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: process.env.PORT || 3000,
    open: true,
    proxy: {
      '/graphql': {
        target: 'http://localhost:3001',
        secure: false,
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Use the copy plugin to copy the manifest.json file to the dist directory
    assetsInlineLimit: 0,
    assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.gif', '**/*.json', '**/*.xml', '**/*.webmanifest'],
    outDir: 'dist', // This is the default value, but explicitly setting it for clarity
  },
  test: {
    globals: true,
    environment: 'happy-dom'
  }
});
