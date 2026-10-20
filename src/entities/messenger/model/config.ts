import type { MessengerType } from '@/shared/api'

export interface MessengerConfig {
  title: string
  /** Цвет из палитры Mantine для таба и акцентов */
  color: string
}

export const MESSENGERS: Record<MessengerType, MessengerConfig> = {
  max: { title: 'MAX', color: 'violet' },
  telegram: { title: 'Telegram', color: 'blue' },
  whatsapp: { title: 'WhatsApp', color: 'green' },
}

export const MESSENGER_ORDER: MessengerType[] = ['max', 'telegram', 'whatsapp']
