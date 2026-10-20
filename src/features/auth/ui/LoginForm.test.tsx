import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useSessionStore } from '@/entities/session'
import { mockGreenApi, renderWithMantine } from '@/shared/lib/test'
import { LoginForm } from './LoginForm'

const readySettings = {
  wid: '79991234567@c.us',
  webhookUrl: '',
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
}

beforeEach(() => {
  localStorage.clear()
  useSessionStore.setState(useSessionStore.getInitialState())
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function fillAndSubmit(screen: Awaited<ReturnType<typeof renderWithMantine>>) {
  await screen.getByLabelText('idInstance').fill('3100000001')
  await screen.getByLabelText('apiTokenInstance').fill('secret-token')
  await screen.getByRole('button', { name: 'Войти' }).click()
}

describe('LoginForm', () => {
  test('apiUrl подставляется по idInstance', async () => {
    const screen = await renderWithMantine(<LoginForm messenger="max" />)
    await screen.getByLabelText('idInstance').fill('3100000001')

    await expect.element(screen.getByLabelText('apiUrl')).toHaveAttribute('placeholder', 'https://3100.api.green-api.com')
  })

  test('успешный вход сохраняет сессию мессенджера', async () => {
    mockGreenApi({
      getStateInstance: () => ({ stateInstance: 'authorized' }),
      getSettings: () => readySettings,
    })
    const screen = await renderWithMantine(<LoginForm messenger="max" />)

    await fillAndSubmit(screen)

    await expect.poll(() => useSessionStore.getState().sessions.max).toEqual({
      apiUrl: 'https://3100.api.green-api.com',
      idInstance: '3100000001',
      apiTokenInstance: 'secret-token',
      wid: '79991234567@c.us',
    })
  })

  test('пустые поля → ошибки валидации, запросов нет', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const screen = await renderWithMantine(<LoginForm messenger="max" />)

    await screen.getByRole('button', { name: 'Войти' }).click()

    await expect.element(screen.getByText('Укажите idInstance')).toBeVisible()
    await expect.element(screen.getByText('Укажите apiTokenInstance')).toBeVisible()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('ошибка API показывается в форме', async () => {
    mockGreenApi({ getStateInstance: () => new Response('', { status: 401 }) })
    const screen = await renderWithMantine(<LoginForm messenger="max" />)

    await fillAndSubmit(screen)

    await expect.element(screen.getByText(/Неверный idInstance или apiTokenInstance/)).toBeVisible()
    expect(useSessionStore.getState().sessions.max).toBeUndefined()
  })

  test('выключенные уведомления: «Включить и войти» вызывает setSettings', async () => {
    const setSettings = vi.fn((_body: unknown) => ({ saveSettings: true }))
    mockGreenApi({
      getStateInstance: () => ({ stateInstance: 'authorized' }),
      getSettings: () => ({ ...readySettings, incomingWebhook: 'no' }),
      setSettings: ({ body }) => setSettings(body),
    })
    const screen = await renderWithMantine(<LoginForm messenger="max" />)

    await fillAndSubmit(screen)
    await expect.element(screen.getByText(/уведомления выключены/i)).toBeVisible()
    expect(useSessionStore.getState().sessions.max).toBeUndefined()

    await screen.getByRole('button', { name: 'Включить и войти' }).click()

    await expect.poll(() => useSessionStore.getState().sessions.max?.idInstance).toBe('3100000001')
    expect(setSettings).toHaveBeenCalledWith({ incomingWebhook: 'yes' })
  })

  test('выключенные уведомления: можно войти без изменений', async () => {
    const setSettings = vi.fn()
    mockGreenApi({
      getStateInstance: () => ({ stateInstance: 'authorized' }),
      getSettings: () => ({ ...readySettings, incomingWebhook: 'no' }),
      setSettings,
    })
    const screen = await renderWithMantine(<LoginForm messenger="max" />)

    await fillAndSubmit(screen)
    await screen.getByRole('button', { name: 'Войти без изменений' }).click()

    await expect.poll(() => useSessionStore.getState().sessions.max?.idInstance).toBe('3100000001')
    expect(setSettings).not.toHaveBeenCalled()
  })
})
