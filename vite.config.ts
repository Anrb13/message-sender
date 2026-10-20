import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// GitHub Pages выставляет GITHUB_REPOSITORY как "owner/repo" — имя репозитория и есть подпапка сайта.
// Локальный билд без переменной продолжает работать по прежнему адресу.
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'message-sender'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site from https://<user>.github.io/<repo>/
  base: command === 'build' ? `/${repository}/` : '/',
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
