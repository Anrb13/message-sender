import { useEffect, useRef } from 'react'
import { useSessionStore, type Session } from '@/entities/session'
import { createGreenApiClient } from '@/shared/api'
import type { MessengerType } from '@/shared/api'
import { applyNotification } from './apply-notification'
import { useConnectionStore } from './connection-store'
import { pollNotifications } from './poll'

interface Connection {
  session: Session
  controller: AbortController
}

function sameSession(a: Session, b: Session): boolean {
  return a.apiUrl === b.apiUrl && a.idInstance === b.idInstance && a.apiTokenInstance === b.apiTokenInstance
}

/**
 * Запускает приём уведомлений для каждого подключённого мессенджера — в том числе для неактивных табов,
 * чтобы сообщения приходили в фоне. Перезапускается только цикл мессенджера, у которого реально изменились
 * учётные данные (вход или выход) — вход в другой мессенджер остальные циклы не затрагивает.
 */
export function useNotificationPolling() {
  const sessions = useSessionStore((state) => state.sessions)
  const connections = useRef<Partial<Record<MessengerType, Connection>>>({})

  useEffect(() => {
    const current = connections.current

    for (const messenger of Object.keys(current) as MessengerType[]) {
      const connection = current[messenger]
      const session = sessions[messenger]
      if (connection && (!session || !sameSession(connection.session, session))) {
        connection.controller.abort()
        useConnectionStore.getState().setError(messenger, null)
        delete current[messenger]
      }
    }

    for (const messenger of Object.keys(sessions) as MessengerType[]) {
      const session = sessions[messenger]
      if (!session || current[messenger]) continue

      const controller = new AbortController()
      current[messenger] = { session, controller }
      void pollNotifications({
        client: createGreenApiClient(session),
        signal: controller.signal,
        onNotification: (body) => applyNotification(messenger, body),
        onStatus: (error) => useConnectionStore.getState().setError(messenger, error),
      })
    }
  }, [sessions])

  // Размонтирование страницы — останавливаем все ещё работающие циклы
  useEffect(
    () => () => {
      for (const messenger of Object.keys(connections.current) as MessengerType[]) {
        connections.current[messenger]?.controller.abort()
        useConnectionStore.getState().setError(messenger, null)
      }
    },
    [],
  )
}
