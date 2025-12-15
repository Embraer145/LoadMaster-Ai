import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(() => {
  // Optional: set by CI (e.g., GitHub Pages) so assets resolve under /<repo>/
  const base = process.env.VITE_BASE ?? '/'

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@core': path.resolve(__dirname, './src/core'),
        '@data': path.resolve(__dirname, './src/data'),
        '@ui': path.resolve(__dirname, './src/ui'),
        '@store': path.resolve(__dirname, './src/store'),
      },
    },
  }
})

