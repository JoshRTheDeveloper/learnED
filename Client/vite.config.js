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
    root: path.resolve(__dirname, 'Client'), // Specify the root directory of your source files
    base: '', // Specify the base URL for your application
    outDir: path.resolve(__dirname, 'dist'), // Specify the output directory
    assetsDir: '.', // Specify the directory for static assets (e.g., images, fonts)
    cssCodeSplit: false, 
  },
  test: {
    globals: true,
    environment: 'happy-dom'
  }
});
