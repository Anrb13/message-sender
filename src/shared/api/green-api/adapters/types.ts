import type { GreenApiClient } from '../client'

export interface ResolvedChat {
  chatId: string
  /** Другие chatId того же собеседника (в WhatsApp ответ может прийти с @c.us вместо @lid) */
  aliases: string[]
}

/** Всё, чем мессенджеры отличаются друг от друга в GREEN-API, собрано здесь */
export interface MessengerAdapter {
  /** Находит chatId собеседника по номеру (только цифры). null — у номера нет аккаунта в мессенджере */
  resolveChatId(client: GreenApiClient, phone: string): Promise<ResolvedChat | null>
}
