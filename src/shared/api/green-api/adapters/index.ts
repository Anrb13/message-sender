import type { MessengerType } from '../types'
import { maxAdapter } from './max'
import type { MessengerAdapter } from './types'

// Адаптеры Telegram и WhatsApp добавляются отдельным шагом
const adapters: Partial<Record<MessengerType, MessengerAdapter>> = {
  max: maxAdapter,
}

export function getAdapter(messenger: MessengerType): MessengerAdapter {
  const adapter = adapters[messenger]
  if (!adapter) throw new Error(`Мессенджер ${messenger} пока не поддерживается`)
  return adapter
}

export type { MessengerAdapter, ResolvedChat } from './types'
