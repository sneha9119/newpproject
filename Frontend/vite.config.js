import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Polyfills for specific Node.js globals and modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // Add any other aliases if needed
    }
  },
  // Add server proxy configuration for development
  server: {
    proxy: {
      // When accessing /api in development, proxy to the backend
      '/api': {
        target: 'https://backend-5l3616x2m-snehas-projects-3f585613.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
