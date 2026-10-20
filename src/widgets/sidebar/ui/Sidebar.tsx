import { ScrollArea, Text } from '@mantine/core'
import { useMemo } from 'react'
import { LogoutButton } from '@/features/auth'
import { CreateChatForm } from '@/features/create-chat'
import { ChatListItem, useChatStore } from '@/entities/chat'
import { MESSENGERS } from '@/entities/messenger'
import { formatWid, useSession } from '@/entities/session'
import type { MessengerType } from '@/shared/api'
import { bem } from '@/shared/lib'
import './Sidebar.css'

const b = bem('sidebar')

// Новые чаты без сообщений — сверху, остальные — по времени последнего сообщения
const byRecency = (left?: number, right?: number) => (right ?? Infinity) - (left ?? Infinity) || 0

export function Sidebar({ messenger }: { messenger: MessengerType }) {
  const session = useSession(messenger)
  const allChats = useChatStore((state) => state.chats)
  const messages = useChatStore((state) => state.messages)
  const activeChatKey = useChatStore((state) => state.activeChatKey[messenger])
  const setActiveChat = useChatStore((state) => state.setActiveChat)

  const chats = useMemo(
    () =>
      Object.values(allChats)
        .filter((chat) => chat.messenger === messenger)
        .sort((left, right) => byRecency(left.lastMessageAt, right.lastMessageAt)),
    [allChats, messenger],
  )

  return (
    <aside className={b()}>
      <div className={b('header')}>
        <div>
          <Text fw={600}>{MESSENGERS[messenger].title}</Text>
          {session?.wid && (
            <Text size="xs" c="dimmed">
              {formatWid(session.wid)}
            </Text>
          )}
        </div>
        <LogoutButton messenger={messenger} />
      </div>

      <div className={b('create-chat')}>
        <CreateChatForm messenger={messenger} />
      </div>

      <ScrollArea className={b('chats')}>
        {chats.length === 0 ? (
          <Text className={b('empty')} size="sm" c="dimmed">
            Чатов пока нет. Введите номер телефона, чтобы начать переписку
          </Text>
        ) : (
          <ul className={b('list')} aria-label="Чаты">
            {chats.map((chat) => (
              <li key={chat.key}>
                <ChatListItem
                  chat={chat}
                  lastMessage={messages[chat.key]?.at(-1)?.text}
                  active={chat.key === activeChatKey}
                  onSelect={(key) => setActiveChat(messenger, key)}
                />
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  )
}
