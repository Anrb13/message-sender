import { useEffect } from 'react'
import { useSessionStore } from '@/entities/session'
import { createGreenApiClient } from '@/shared/api'
import type { MessengerType } from '@/shared/api'
import { applyNotification } from './apply-notification'
import { useConnectionStore } from './connection-store'
import { pollNotifications } from './poll'

/**
 * Запускает приём уведомлений для каждого подключённого мессенджера — в том числе для неактивных табов,
 * чтобы сообщения приходили в фоне. При выходе или смене учётных данных циклы перезапускаются.
 */
export function useNotificationPolling() {
  const sessions = useSessionStore((state) => state.sessions)

  useEffect(() => {
    const { setError } = useConnectionStore.getState()
    const running = (Object.keys(sessions) as MessengerType[]).flatMap((messenger) => {
      const session = sessions[messenger]
      if (!session) return []

      const controller = new AbortController()
      void pollNotifications({
        client: createGreenApiClient(session),
        signal: controller.signal,
        onNotification: (body) => applyNotification(messenger, body),
        onStatus: (error) => setError(messenger, error),
      })
      return [{ messenger, controller }]
    })

    return () => {
      for (const { messenger, controller } of running) {
        controller.abort()
        setError(messenger, null)
      }
    }
  }, [sessions])
}
