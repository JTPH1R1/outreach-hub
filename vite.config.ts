import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/outreach-hub/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
