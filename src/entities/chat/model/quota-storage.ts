import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { isQuotaExceeded, trimMessages } from '../lib/quota'
import type { Message } from './types'

interface QuotaSafeStorageOptions {
  storage: Storage
  /** Вызывается после успешной обрезки: какие сообщения остались и сколько не поместилось */
  onTrim: (messages: Record<string, Message[]>, removed: number) => void
}

type WithMessages = { messages: Record<string, Message[]> }

/**
 * Обёртка над localStorage для persist: при переполнении квоты обрезает историю и повторяет запись.
 * Без неё QuotaExceededError вылетал бы из экшенов стора: отправка обрывалась бы технической ошибкой
 * в интерфейсе, а входящие сообщения терялись бы при перезагрузке страницы.
 */
export function createQuotaSafeStorage<S extends WithMessages>({
  storage,
  onTrim,
}: QuotaSafeStorageOptions): PersistStorage<S> {
  return {
    getItem: (name) => {
      const raw = storage.getItem(name)
      return raw ? (JSON.parse(raw) as StorageValue<S>) : null
    },

    setItem: (name, value) => {
      let quotaError: unknown
      try {
        storage.setItem(name, JSON.stringify(value))
        return
      } catch (error) {
        if (!isQuotaExceeded(error)) throw error
        quotaError = error
      }

      const { messages, removed } = trimMessages(value.state.messages)
      // Обрезать уже нечего — не теряем данные молча, а сообщаем об ошибке вызывающему коду
      if (removed === 0) throw quotaError

      storage.setItem(name, JSON.stringify({ ...value, state: { ...value.state, messages } }))
      try {
        onTrim(messages, removed)
      } catch (callbackError) {
        // Предупреждение в интерфейсе не должно ломать сохранение
        console.error('Не удалось показать предупреждение об обрезке истории', callbackError)
      }
    },

    removeItem: (name) => storage.removeItem(name),
  }
}
