import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  // Netlify sets NETLIFY=true → absolute paths (/)
  // GitHub Actions sets GITHUB_ACTIONS=true → repo-relative base for Pages
  // Electron uses './' for file:// protocol compatibility
  base: process.env.NETLIFY
    ? '/'
    : process.env.GITHUB_ACTIONS
      ? '/simulador-bds/'
      : './',
  optimizeDeps: {
    include: ['alasql'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app:       resolve(__dirname, 'app.html'),
        simulator: resolve(__dirname, 'simulator.html'),
        admin:     resolve(__dirname, 'admin.html'),
      },
    },
  },
})
