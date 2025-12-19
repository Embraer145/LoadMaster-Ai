import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(() => {
  // Optional: set by CI (e.g., GitHub Pages) so assets resolve under /<repo>/
  const base = process.env.VITE_BASE ?? '/'
  const appVersion = process.env.npm_package_version ?? '0.0.0'

  return {
    base,
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@config': path.resolve(__dirname, './src/config'),
        '@core': path.resolve(__dirname, './src/core'),
        '@data': path.resolve(__dirname, './src/data'),
        '@db': path.resolve(__dirname, './src/db'),
        '@ui': path.resolve(__dirname, './src/ui'),
        '@store': path.resolve(__dirname, './src/store'),
      },
    },
  }
})

