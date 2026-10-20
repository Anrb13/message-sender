import type {
  CheckAccountResponse,
  CheckWhatsappResponse,
  Credentials,
  DeleteNotificationResponse,
  InstanceSettings,
  Notification,
  RejectedResponse,
  SendMessageRequest,
  SendMessageResponse,
  SetSettingsResponse,
  StateInstanceResponse,
} from './types'

/** Ошибка GREEN-API. status = 0 — запрос не дошёл до сервера (нет сети, CORS, таймаут) */
export class GreenApiError extends Error {
  readonly status: number
  /** Истёк таймаут ожидания ответа (status = 0), а не сетевой сбой */
  readonly timeout: boolean

  constructor(status: number, message: string, { timeout = false }: { timeout?: boolean } = {}) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
    this.timeout = timeout
  }
}

/**
 * GREEN-API ответил 200, но в теле сообщил об отказе: `{ status: false, reason }`.
 * Так checkAccount отвечает, когда инстанс не авторизован или исчерпан лимит проверок номеров, —
 * без отдельного типа ошибки это выглядело бы как «номера нет в мессенджере».
 */
export class GreenApiRejectError extends Error {
  readonly reason: string

  constructor(reason: string) {
    super(reason)
    this.name = 'GreenApiRejectError'
    this.reason = reason
  }
}

/** Сколько ждать ответа обычного метода, мс */
const DEFAULT_TIMEOUT_MS = 30_000
/** Запас сверх receiveTimeout: long polling держит запрос сам и отвечает по своему таймауту */
const LONG_POLL_MARGIN_MS = 15_000
/** receiveTimeout по умолчанию у GREEN-API, секунд (допустимо 5–60) */
const DEFAULT_RECEIVE_TIMEOUT_SECONDS = 5

interface RequestOptions {
  httpMethod?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  /** Добавляется к URL после токена, например /{receiptId} */
  pathSuffix?: string
  query?: Record<string, string | number>
  signal?: AbortSignal
  /** Предельное время ожидания ответа, мс */
  timeoutMs?: number
}

/** Ответ 200, в котором GREEN-API сообщает об отказе вместо ожидаемых данных */
function isRejected(data: unknown): data is RejectedResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    (data as { status: unknown }).status === false &&
    typeof (data as { reason?: unknown }).reason === 'string'
  )
}

export function createGreenApiClient({ apiUrl, idInstance, apiTokenInstance }: Credentials) {
  const baseUrl = `${apiUrl.trim().replace(/\/+$/, '')}/waInstance${idInstance.trim()}`
  const token = apiTokenInstance.trim()

  // Все методы GREEN-API имеют вид {apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}
  async function request<T>(method: string, options: RequestOptions = {}): Promise<T> {
    const { httpMethod = 'GET', body, pathSuffix = '', query, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options
    const search = query
      ? `?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))}`
      : ''

    // Без таймаута зависший запрос оставил бы сообщение в статусе «Отправляется…» навсегда
    const timeoutSignal = AbortSignal.timeout(timeoutMs)

    let response: Response
    try {
      response = await fetch(`${baseUrl}/${method}/${token}${pathSuffix}${search}`, {
        method: httpMethod,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
      })
    } catch (error) {
      // Отмену (AbortController) отдаём как есть — вызывающий код отличает её от сбоя
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) throw error
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new GreenApiError(0, `GREEN-API не ответил за ${Math.round(timeoutMs / 1000)} с`, { timeout: true })
      }
      throw new GreenApiError(0, error instanceof Error ? error.message : String(error))
    }

    const text = await response.text()
    if (!response.ok) throw new GreenApiError(response.status, text || response.statusText)

    // receiveNotification при пустой очереди отвечает пустым телом или null
    const data: unknown = text ? JSON.parse(text) : null
    if (isRejected(data)) throw new GreenApiRejectError(data.reason)
    return data as T
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

    /** WhatsApp: проверка наличия аккаунта по номеру; phone — только цифры */
    checkWhatsapp: (phone: string) =>
      request<CheckWhatsappResponse>('checkWhatsapp', { httpMethod: 'POST', body: { phoneNumber: Number(phone) } }),

    sendMessage: (payload: SendMessageRequest) =>
      request<SendMessageResponse>('sendMessage', { httpMethod: 'POST', body: payload }),

    /** Long polling: ждёт уведомление до receiveTimeout секунд, при пустой очереди возвращает null */
    receiveNotification: ({ receiveTimeout, signal }: { receiveTimeout?: number; signal?: AbortSignal } = {}) =>
      request<Notification | null>('receiveNotification', {
        query: receiveTimeout === undefined ? undefined : { receiveTimeout },
        signal,
        // Сервер сам держит запрос receiveTimeout секунд, поэтому общий таймаут должен быть больше
        timeoutMs: (receiveTimeout ?? DEFAULT_RECEIVE_TIMEOUT_SECONDS) * 1000 + LONG_POLL_MARGIN_MS,
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
