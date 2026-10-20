import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MessengerType } from '@/shared/api'
import type { Chat, Message, MessageStatus, UpsertChatInput } from './types'

interface ChatState {
  chats: Record<string, Chat>
  /** Сообщения по ключу чата, отсортированы по времени */
  messages: Record<string, Message[]>
  /** Выбранный чат в каждом мессенджере (у каждого таба свой) */
  activeChatKey: Partial<Record<MessengerType, string>>
  /** Создаёт чат или дополняет существующий; возвращает ключ чата */
  upsertChat: (input: UpsertChatInput) => string
  addMessage: (chatKey: string, message: Message) => void
  updateStatus: (messenger: MessengerType, chatId: string, idMessage: string, status: MessageStatus) => void
  /** Завершает оптимистичную отправку: подставляет настоящий idMessage или помечает сообщение failed */
  settleMessage: (chatKey: string, tempId: string, outcome: { idMessage: string } | 'failed') => void
  setActiveChat: (messenger: MessengerType, chatKey: string | undefined) => void
  /** Удаляет все данные мессенджера — при выходе из его аккаунта */
  resetMessenger: (messenger: MessengerType) => void
}

export const chatKeyOf = (messenger: MessengerType, chatId: string) => `${messenger}:${chatId}`

/** Ищет чат по chatId или одному из его aliases в пределах мессенджера */
export function findChatKey(chats: Record<string, Chat>, messenger: MessengerType, chatId: string): string | null {
  const direct = chats[chatKeyOf(messenger, chatId)]
  if (direct) return direct.key
  const byAlias = Object.values(chats).find((chat) => chat.messenger === messenger && chat.aliases.includes(chatId))
  return byAlias?.key ?? null
}

// Статусы приходят асинхронно и могут перепутаться: read не должен смениться на delivered.
// Ошибки доставки (failed, noAccount, notInGroup) перекрывают любой статус.
const STATUS_RANK: Partial<Record<MessageStatus, number>> = { pending: 0, sent: 1, delivered: 2, read: 3 }

function nextStatus(current: MessageStatus | undefined, incoming: MessageStatus): MessageStatus {
  const incomingRank = STATUS_RANK[incoming]
  const currentRank = current === undefined ? undefined : STATUS_RANK[current]
  if (incomingRank === undefined || currentRank === undefined) return incoming
  return incomingRank > currentRank ? incoming : (current as MessageStatus)
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: {},
      messages: {},
      activeChatKey: {},

      upsertChat: ({ messenger, chatId, aliases = [], name, phone }) => {
        const key = findChatKey(get().chats, messenger, chatId) ?? chatKeyOf(messenger, chatId)
        set((state) => {
          const existing = state.chats[key]
          const allAliases = new Set([...(existing?.aliases ?? []), ...aliases, chatId])
          allAliases.delete(existing?.chatId ?? chatId)

          const chat: Chat = {
            key,
            messenger,
            chatId: existing?.chatId ?? chatId,
            aliases: [...allAliases],
            name: name || existing?.name,
            phone: phone || existing?.phone,
            unread: existing?.unread ?? 0,
            lastMessageAt: existing?.lastMessageAt,
          }
          return { chats: { ...state.chats, [key]: chat } }
        })
        return key
      },

      addMessage: (chatKey, message) =>
        set((state) => {
          const chat = state.chats[chatKey]
          const list = state.messages[chatKey] ?? []
          // Одно и то же сообщение может прийти дважды: из ответа sendMessage и из уведомления
          if (!chat || list.some((m) => m.idMessage === message.idMessage)) return state

          const messages = [...list, message].sort((a, b) => a.timestamp - b.timestamp)
          const isActive = state.activeChatKey[chat.messenger] === chatKey
          const unread = message.direction === 'incoming' && !isActive ? chat.unread + 1 : chat.unread

          return {
            messages: { ...state.messages, [chatKey]: messages },
            chats: {
              ...state.chats,
              [chatKey]: { ...chat, unread, lastMessageAt: Math.max(chat.lastMessageAt ?? 0, message.timestamp) },
            },
          }
        }),

      updateStatus: (messenger, chatId, idMessage, status) =>
        set((state) => {
          const key = findChatKey(state.chats, messenger, chatId)
          const list = key ? state.messages[key] : undefined
          if (!key || !list?.some((m) => m.idMessage === idMessage)) return state

          return {
            messages: {
              ...state.messages,
              [key]: list.map((m) => (m.idMessage === idMessage ? { ...m, status: nextStatus(m.status, status) } : m)),
            },
          }
        }),

      settleMessage: (chatKey, tempId, outcome) =>
        set((state) => {
          const list = state.messages[chatKey]
          if (!list?.some((m) => m.idMessage === tempId)) return state

          let next: Message[]
          if (outcome === 'failed') {
            next = list.map((m) => (m.idMessage === tempId ? { ...m, status: 'failed' as const } : m))
          } else if (list.some((m) => m.idMessage === outcome.idMessage)) {
            // Уведомление outgoingAPIMessageReceived пришло раньше ответа sendMessage — копия уже есть
            next = list.filter((m) => m.idMessage !== tempId)
          } else {
            next = list.map((m) =>
              m.idMessage === tempId ? { ...m, idMessage: outcome.idMessage, status: nextStatus(m.status, 'sent') } : m,
            )
          }
          return { messages: { ...state.messages, [chatKey]: next } }
        }),

      setActiveChat: (messenger, chatKey) =>
        set((state) => {
          const chat = chatKey ? state.chats[chatKey] : undefined
          return {
            activeChatKey: { ...state.activeChatKey, [messenger]: chatKey },
            chats: chat ? { ...state.chats, [chat.key]: { ...chat, unread: 0 } } : state.chats,
          }
        }),

      resetMessenger: (messenger) =>
        set((state) => {
          const keep = <T,>(record: Record<string, T>) =>
            Object.fromEntries(Object.entries(record).filter(([key]) => state.chats[key]?.messenger !== messenger))
          const activeChatKey = { ...state.activeChatKey }
          delete activeChatKey[messenger]
          return { chats: keep(state.chats), messages: keep(state.messages), activeChatKey }
        }),
    }),
    { name: 'message-sender:chats' },
  ),
)
