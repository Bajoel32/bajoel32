import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Deploy ke user site https://bajoel32.github.io (dilayani dari root).
  // Kalau nanti pindah ke project site (mis. github.io/nama-repo), ubah jadi '/nama-repo/'.
  base: '/',
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
