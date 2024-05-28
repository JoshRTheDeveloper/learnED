import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Invoicinator',
        short_name: 'Invoicinator',
        description: 'A simple app for invoices',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: 'src/assets/invoicinator192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'src/assets/invoicinator512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: 'src/assets/longScreenshot.png',
            sizes: '1080x1920',
            type: 'image/png'
          },
          {
            src: 'src/assets/screenshot1.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide'
          }
        ]
      }
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
  test: {
    globals: true,
    environment: 'happy-dom'
  }
})
