import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { App } from './App'

test('renders the app', async () => {
  const screen = await render(<App />)

  await expect.element(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Message Sender')
})
