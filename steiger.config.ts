import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

// Steiger проверяет соблюдение правил Feature-Sliced Design в src/
export default defineConfig([...fsd.configs.recommended])
