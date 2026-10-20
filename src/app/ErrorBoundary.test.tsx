import { expect, test, vi } from 'vitest'
import { renderWithMantine } from '@/shared/lib/test'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

test('показывает заглушку вместо упавшего дерева', async () => {
  // React пишет ошибку в консоль — в этом тесте она ожидаема
  vi.spyOn(console, 'error').mockImplementation(() => {})

  const screen = await renderWithMantine(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  )

  await expect.element(screen.getByText('Что-то пошло не так')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Перезагрузить' })).toBeVisible()
})

test('пока дети не падают, рендерит их', async () => {
  const screen = await renderWithMantine(
    <ErrorBoundary>
      <p>Контент приложения</p>
    </ErrorBoundary>,
  )

  await expect.element(screen.getByText('Контент приложения')).toBeVisible()
})
