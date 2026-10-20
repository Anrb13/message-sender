import type {
  CheckAccountResponse,
  Credentials,
  DeleteNotificationResponse,
  InstanceSettings,
  Notification,
  SendMessageRequest,
  SendMessageResponse,
  SetSettingsResponse,
  StateInstanceResponse,
} from './types'

/** Ошибка GREEN-API. status = 0 — запрос не дошёл до сервера (нет сети, CORS и т.п.) */
export class GreenApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

interface RequestOptions {
  httpMethod?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  /** Добавляется к URL после токена, например /{receiptId} */
  pathSuffix?: string
  query?: Record<string, string | number>
  signal?: AbortSignal
}

export function createGreenApiClient({ apiUrl, idInstance, apiTokenInstance }: Credentials) {
  const baseUrl = `${apiUrl.trim().replace(/\/+$/, '')}/waInstance${idInstance.trim()}`
  const token = apiTokenInstance.trim()

  // Все методы GREEN-API имеют вид {apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}
  async function request<T>(method: string, options: RequestOptions = {}): Promise<T> {
    const { httpMethod = 'GET', body, pathSuffix = '', query, signal } = options
    const search = query
      ? `?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))}`
      : ''

    let response: Response
    try {
      response = await fetch(`${baseUrl}/${method}/${token}${pathSuffix}${search}`, {
        method: httpMethod,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      })
    } catch (error) {
      // Отмену (AbortController) отдаём как есть — вызывающий код отличает её от сбоя
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new GreenApiError(0, error instanceof Error ? error.message : String(error))
    }

    const text = await response.text()
    if (!response.ok) throw new GreenApiError(response.status, text || response.statusText)

    // receiveNotification при пустой очереди отвечает пустым телом или null
    return (text ? JSON.parse(text) : null) as T
  }

  return {
    getStateInstance: () => request<StateInstanceResponse>('getStateInstance'),

    getSettings: () => request<InstanceSettings>('getSettings'),

    /** Внимание: перезапускает инстанс, новые настройки применяются в течение ~5 минут */
    setSettings: (settings: InstanceSettings) =>
      request<SetSettingsResponse>('setSettings', { httpMethod: 'POST', body: settings }),

    /** MAX и Telegram: проверка аккаунта по номеру; phone — только цифры */
    checkAccount: (phone: string) =>
      request<CheckAccountResponse>('checkAccount', { httpMethod: 'POST', body: { phoneNumber: Number(phone) } }),

    sendMessage: (payload: SendMessageRequest) =>
      request<SendMessageResponse>('sendMessage', { httpMethod: 'POST', body: payload }),

    /** Long polling: ждёт уведомление до receiveTimeout секунд, при пустой очереди возвращает null */
    receiveNotification: ({ receiveTimeout, signal }: { receiveTimeout?: number; signal?: AbortSignal } = {}) =>
      request<Notification | null>('receiveNotification', {
        query: receiveTimeout === undefined ? undefined : { receiveTimeout },
        signal,
      }),

    deleteNotification: (receiptId: number, signal?: AbortSignal) =>
      request<DeleteNotificationResponse>('deleteNotification', {
        httpMethod: 'DELETE',
        pathSuffix: `/${receiptId}`,
        signal,
      }),
  }
}

export type GreenApiClient = ReturnType<typeof createGreenApiClient>
