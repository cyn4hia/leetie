import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://<user>.github.io/leetie/ in production
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/leetie/' : '/',
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
}))
