import { MantineProvider } from '@mantine/core'
import type { ReactNode } from 'react'
import { render } from 'vitest-browser-react'

export { mockGreenApi } from './green-api-mock'

/** Рендер компонента для тестов: компонентам Mantine нужен MantineProvider */
export function renderWithMantine(ui: ReactNode) {
  return render(<MantineProvider>{ui}</MantineProvider>)
}
