import type { MessengerAdapter } from './types'

/**
 * MAX и Telegram: chatId назначает сервер и он не совпадает с номером телефона. Уведомления о входящих
 * приходят с этим chatId, поэтому чат создаём только после checkAccount.
 */
export const checkAccountAdapter: MessengerAdapter = {
  async resolveChatId(client, phone) {
    const { exist, chatId } = await client.checkAccount(phone)
    return exist && chatId ? { chatId, aliases: [] } : null
  },
}
