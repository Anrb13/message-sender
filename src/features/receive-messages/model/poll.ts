import { describeError } from '@/shared/api'
import type { GreenApiClient, WebhookBody } from '@/shared/api'
import { RECEIVE_TIMEOUT_SECONDS } from '@/shared/config'

/** Паузы между повторами после ошибок, мс: 1 → 2 → 5 секунд и дальше по 5 */
const DEFAULT_RETRY_DELAYS = [1000, 2000, 5000]

interface PollOptions {
  client: GreenApiClient
  signal: AbortSignal
  onNotification: (body: WebhookBody) => void
  /** Текст ошибки соединения или null, когда связь восстановилась */
  onStatus?: (error: string | null) => void
  retryDelays?: number[]
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * Цикл приёма уведомлений по HTTP API: receiveNotification (long polling) → обработка → deleteNotification.
 * Каждое полученное уведомление удаляется, даже если обработать его не удалось, иначе GREEN-API будет
 * отдавать его снова и очередь встанет. Повторная доставка безопасна: сообщения дедуплицируются по idMessage.
 * Работает, пока не отменён signal.
 */
export async function pollNotifications({
  client,
  signal,
  onNotification,
  onStatus,
  retryDelays = DEFAULT_RETRY_DELAYS,
}: PollOptions): Promise<void> {
  let failures = 0

  while (!signal.aborted) {
    try {
      const notification = await client.receiveNotification({ receiveTimeout: RECEIVE_TIMEOUT_SECONDS, signal })
      if (failures > 0) {
        failures = 0
        onStatus?.(null)
      }
      if (!notification) continue

      try {
        onNotification(notification.body)
      } catch (error) {
        console.error('Не удалось обработать уведомление GREEN-API', notification, error)
      }
      await client.deleteNotification(notification.receiptId, signal)
    } catch (error) {
      if (signal.aborted || isAbortError(error)) return
      try {
        onStatus?.(describeError(error))
      } catch (statusError) {
        // Сбой подписчика на статус (например, ошибка рендера) не должен убивать бесконечный цикл:
        // иначе приём сообщений остановится навсегда, а не переподключится
        console.error('Не удалось показать ошибку соединения', statusError)
      }
      await sleep(retryDelays[Math.min(failures, retryDelays.length - 1)], signal)
      failures++
    }
  }
}
