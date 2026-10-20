/**
 * Единый лимит длины сообщения для всех мессенджеров — по самому строгому (MAX: 4000 символов;
 * у Telegram 4096, у WhatsApp 20000).
 */
export const MESSAGE_MAX_LENGTH = 4000

/** Сколько секунд GREEN-API держит long-polling запрос receiveNotification (допустимо 5–60) */
export const RECEIVE_TIMEOUT_SECONDS = 20
