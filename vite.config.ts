import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://neuf.yesplan.be',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
    transformMode: {
      web: [/\.[jt]sx?$/, /\.vue$/],
    },
  },
})
