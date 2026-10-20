import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { App } from './App'

test('приложение открывается на табе MAX', async () => {
  localStorage.clear()
  const screen = await render(<App />)

  await expect.element(screen.getByRole('tab', { name: /MAX/ })).toHaveAttribute('aria-selected', 'true')
})
