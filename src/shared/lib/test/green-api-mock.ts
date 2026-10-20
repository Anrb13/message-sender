import { vi } from 'vitest'

type Handler = (request: { url: string; init: RequestInit; body: unknown }) => unknown

/**
 * Подменяет fetch: ответ выбирается по имени метода GREEN-API из URL.
 * Обработчик может вернуть готовый Response (например, с ошибкой) или данные для JSON-ответа.
 * Неизвестный метод отвечает 404, чтобы тест сразу это показал.
 */
export function mockGreenApi(handlers: Record<string, Handler>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init = {}) => {
    const url = String(input)
    const method = /\/waInstance[^/]+\/([^/]+)\//.exec(url)?.[1] ?? ''
    const handler = handlers[method]
    if (!handler) return new Response(`unexpected method ${method}`, { status: 404 })

    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined
    const result = await handler({ url, init, body })
    return result instanceof Response ? result : new Response(JSON.stringify(result ?? null), { status: 200 })
  })
}
