import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
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
  build: {
    rollupOptions: {
      input: {
        auth: fileURLToPath(new URL('./auth.html', import.meta.url)),
        popup: fileURLToPath(new URL('./index.html', import.meta.url)),
        personal: fileURLToPath(new URL('./personal.html', import.meta.url)),
        background: fileURLToPath(new URL('./src/entries/background.ts', import.meta.url)),
        content: fileURLToPath(new URL('./src/entries/content.ts', import.meta.url)),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
