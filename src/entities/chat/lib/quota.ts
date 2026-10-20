import type { Message } from '../model/types'

/** Имена ошибки переполнения хранилища: стандартное и историческое у Firefox */
const QUOTA_ERROR_NAMES = new Set(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])

/** Переполнение localStorage — единственная ошибка записи, которую можно пережить обрезкой истории */
export function isQuotaExceeded(error: unknown): boolean {
  return error instanceof Error && QUOTA_ERROR_NAMES.has(error.name)
}

/**
 * Аварийно освобождает место в localStorage: оставляет в каждом чате половину сообщений — самые новые.
 * Возвращает новые списки и число удалённых сообщений; если обрезать нечего, removed = 0.
 */
export function trimMessages(messages: Record<string, Message[]>): {
  messages: Record<string, Message[]>
  removed: number
} {
  const next: Record<string, Message[]> = {}
  let removed = 0

  for (const [key, list] of Object.entries(messages)) {
    // Чат с единственным сообщением не трогаем: иначе история исчезнет целиком
    const keep = list.length > 1 ? Math.ceil(list.length / 2) : list.length
    removed += list.length - keep
    next[key] = keep === list.length ? list : list.slice(-keep)
  }

  return { messages: next, removed }
}
