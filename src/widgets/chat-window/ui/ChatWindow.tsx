import { ActionIcon, Avatar, ScrollArea, Text, Title } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { MessageComposer } from '@/features/send-message'
import { getChatTitle, MessageBubble, useChatStore, type Message } from '@/entities/chat'
import type { MessengerType } from '@/shared/api'
import { bem } from '@/shared/lib'
import { isNearBottom } from '../lib/scroll'
import './ChatWindow.css'

const b = bem('chat-window')
const NO_MESSAGES: Message[] = []

export function ChatWindow({ messenger }: { messenger: MessengerType }) {
  const chatKey = useChatStore((state) => state.activeChatKey[messenger])
  const chat = useChatStore((state) => (chatKey ? state.chats[chatKey] : undefined))
  const messages = useChatStore((state) => (chatKey ? state.messages[chatKey] : undefined) ?? NO_MESSAGES)
  const setActiveChat = useChatStore((state) => state.setActiveChat)
  const bottomRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  // «Прилип» ли пользователь к низу переписки: пока да — новые сообщения прокручиваем,
  // но тому, кто читает историю выше, прокрутку не выдёргиваем
  const atBottomRef = useRef(true)
  const shownChatKey = useRef(chatKey)

  useEffect(() => {
    // Другой чат всегда открываем на последнем сообщении
    if (shownChatKey.current !== chatKey) {
      shownChatKey.current = chatKey
      atBottomRef.current = true
    }
    if (atBottomRef.current) bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [chatKey, messages.length])

  if (!chatKey || !chat) {
    return (
      <section className={b({ empty: true })}>
        <Text c="dimmed">Выберите чат или создайте новый</Text>
      </section>
    )
  }

  const title = getChatTitle(chat)

  return (
    <section className={b()}>
      <header className={b('header')}>
        <ActionIcon
          className={b('back')}
          variant="subtle"
          color="gray"
          aria-label="Назад к чатам"
          onClick={() => setActiveChat(messenger, undefined)}
        >
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Avatar name={title} color="initials" radius="xl" />
        <div className={b('title')}>
          <Title order={2} size="h5" lineClamp={1}>
            {title}
          </Title>
          {chat.phone && chat.name && (
            <Text size="xs" c="dimmed">
              +{chat.phone}
            </Text>
          )}
        </div>
      </header>

      <ScrollArea
        className={b('messages')}
        viewportRef={viewportRef}
        onScrollPositionChange={({ y }) => {
          const viewport = viewportRef.current
          if (!viewport) return
          atBottomRef.current = isNearBottom({
            scrollTop: y,
            scrollHeight: viewport.scrollHeight,
            clientHeight: viewport.clientHeight,
          })
        }}
      >
        {messages.length === 0 ? (
          <Text className={b('hint')} size="sm" c="dimmed">
            Сообщений пока нет. Напишите первым!
          </Text>
        ) : (
          <div className={b('list')}>
            {messages.map((message) => (
              <MessageBubble key={message.idMessage} message={message} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      <MessageComposer key={chatKey} messenger={messenger} chatKey={chatKey} />
    </section>
  )
}
