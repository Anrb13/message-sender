import type { MessengerType } from '../types'
import { checkAccountAdapter } from './check-account'
import type { MessengerAdapter } from './types'
import { whatsappAdapter } from './whatsapp'

const adapters: Record<MessengerType, MessengerAdapter> = {
  max: checkAccountAdapter,
  telegram: checkAccountAdapter,
  whatsapp: whatsappAdapter,
}

export function getAdapter(messenger: MessengerType): MessengerAdapter {
  return adapters[messenger]
}

export type { MessengerAdapter, ResolvedChat } from './types'
