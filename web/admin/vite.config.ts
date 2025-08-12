import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['aws-amplify'],
  },
  build: {
    commonjsOptions: {
      include: [/aws-amplify/, /node_modules/],
    },
  },
})
