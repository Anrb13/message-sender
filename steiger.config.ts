import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

// Steiger проверяет соблюдение правил Feature-Sliced Design в src/
export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // Правило предлагает сливать слайсы, у которых меньше двух потребителей. В небольшом приложении так
      // устроено большинство виджетов и фич (sidebar нужен только странице, create-chat — только sidebar),
      // а разделение на слайсы здесь осознанное: оно держит границы слоёв и сценариев явными.
      'fsd/insignificant-slice': 'off',
    },
  },
])
