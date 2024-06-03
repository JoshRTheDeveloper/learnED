import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Invoicinator',
        short_name: 'Invoicinator',
        display: 'standalone',
        background_color: '#ffffff',
        lang: 'en',
        description: 'A simple app for invoices',
        theme_color: '#000000',
        icons: [
             {
      "src": "https://invoicinator3000-d580657ecca9.herokuapp.com/assets/invoicinator192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "https://invoicinator3000-d580657ecca9.herokuapp.com/assets/invoicinator512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  screenshots: [
    {
      "src": "https://invoicinator3000-d580657ecca9.herokuapp.com/assets/longScreenshot.png",
      "sizes": "1080x1920",
      "type": "image/png"
    },
    {
      "src": "https://invoicinator3000-d580657ecca9.herokuapp.com/assets/screenshot1.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
        ]
      },
      swSrc: path.resolve(__dirname, 'dist/registerSW.js'),
    })
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
    assetsDir: 'assets', // Specify the directory name for built assets
    outDir: 'dist', // Specify the output directory for the built files
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  test: {
    globals: true,
    environment: 'happy-dom'
  }
});




