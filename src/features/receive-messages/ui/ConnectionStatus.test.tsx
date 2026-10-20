import { beforeEach, expect, test } from 'vitest'
import { renderWithMantine } from '@/shared/lib/test'
import { useConnectionStore } from '../model/connection-store'
import { ConnectionStatus } from './ConnectionStatus'

beforeEach(() => {
  useConnectionStore.setState(useConnectionStore.getInitialState())
})

test('при ошибке показывает её текст и что идёт переподключение', async () => {
  useConnectionStore.getState().setError('max', 'Не удалось связаться с GREEN-API')
  const screen = await renderWithMantine(<ConnectionStatus messenger="max" />)

  await expect.element(screen.getByRole('alert')).toHaveTextContent('Не удалось связаться с GREEN-API')
  await expect.element(screen.getByRole('alert')).toHaveTextContent('переподключение')
})

test('без ошибки ничего не показывает', async () => {
  useConnectionStore.getState().setError('telegram', 'чужая ошибка')
  const screen = await renderWithMantine(<ConnectionStatus messenger="max" />)

  expect(screen.container.querySelector('[role="alert"]')).toBeNull()
})
