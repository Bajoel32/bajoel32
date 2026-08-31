import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Deploy ke project site https://bajoel32.github.io/bajoel32/ (dilayani dari sub-path).
  // Harus sama dengan nama repo. Kalau repo di-rename jadi user-site (Bajoel32.github.io), ubah ke '/'.
  base: '/bajoel32/',
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
    devSourcemap: true,
  },
  build: {
    cssCodeSplit: true,
    minify: 'oxc',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
})
