import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site from https://anrb13.github.io/message-sender/
  base: command === 'build' ? '/message-sender/' : '/',
  plugins: [react()],
  resolve: {
    // Алиас @/ → src/, дублируется в paths tsconfig.app.json
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
}))
