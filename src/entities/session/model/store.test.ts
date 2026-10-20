import { beforeEach, describe, expect, test } from 'vitest'
import { useSessionStore } from './store'

const session = {
  apiUrl: 'https://3100.api.green-api.com',
  idInstance: '3100000001',
  apiTokenInstance: 'token',
  wid: '79991234567@c.us',
}

beforeEach(() => {
  localStorage.clear()
  useSessionStore.setState(useSessionStore.getInitialState())
})

describe('useSessionStore', () => {
  test('по умолчанию активен MAX и сессий нет', () => {
    const state = useSessionStore.getState()
    expect(state.activeMessenger).toBe('max')
    expect(state.sessions).toEqual({})
  })

  test('login сохраняет сессию отдельно для каждого мессенджера', () => {
    useSessionStore.getState().login('max', session)
    useSessionStore.getState().login('telegram', { ...session, idInstance: '4100000001' })

    const { sessions } = useSessionStore.getState()
    expect(sessions.max).toEqual(session)
    expect(sessions.telegram?.idInstance).toBe('4100000001')
  })

  test('logout удаляет сессию только своего мессенджера', () => {
    useSessionStore.getState().login('max', session)
    useSessionStore.getState().login('telegram', session)
    useSessionStore.getState().logout('max')

    const { sessions } = useSessionStore.getState()
    expect(sessions.max).toBeUndefined()
    expect(sessions.telegram).toEqual(session)
  })

  test('setActiveMessenger переключает таб', () => {
    useSessionStore.getState().setActiveMessenger('whatsapp')
    expect(useSessionStore.getState().activeMessenger).toBe('whatsapp')
  })

  test('сессии сохраняются в localStorage', () => {
    useSessionStore.getState().login('max', session)
    expect(localStorage.getItem('message-sender:session')).toContain('3100000001')
  })
})
