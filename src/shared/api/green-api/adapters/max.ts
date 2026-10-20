import type { MessengerAdapter } from './types'

/**
 * В MAX chatId не совпадает с номером телефона — его назначает сервер. Уведомления о входящих
 * приходят с этим chatId, поэтому чат создаём только после checkAccount.
 */
export const maxAdapter: MessengerAdapter = {
  async resolveChatId(client, phone) {
    const { exist, chatId } = await client.checkAccount(phone)
    return exist && chatId ? { chatId, aliases: [] } : null
  },
}
