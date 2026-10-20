import { Badge, Tabs } from '@mantine/core'
import { ChatWindow } from '@/widgets/chat-window'
import { Sidebar } from '@/widgets/sidebar'
import { LoginForm } from '@/features/auth'
import { useNotificationPolling } from '@/features/receive-messages'
import { useChatStore } from '@/entities/chat'
import { MESSENGERS, MESSENGER_ORDER } from '@/entities/messenger'
import { useSession, useSessionStore } from '@/entities/session'
import type { MessengerType } from '@/shared/api'
import { bem } from '@/shared/lib'
import './MessengerPage.css'

const b = bem('messenger-page')

function useUnreadCount(messenger: MessengerType) {
  return useChatStore((state) =>
    Object.values(state.chats).reduce((sum, chat) => (chat.messenger === messenger ? sum + chat.unread : sum), 0),
  )
}

function MessengerTab({ messenger }: { messenger: MessengerType }) {
  const unread = useUnreadCount(messenger)
  const { title, color } = MESSENGERS[messenger]

  return (
    <Tabs.Tab
      value={messenger}
      color={color}
      rightSection={
        unread > 0 && (
          <Badge size="sm" circle color={color}>
            {unread}
          </Badge>
        )
      }
    >
      {title}
    </Tabs.Tab>
  )
}

function MessengerPanel({ messenger }: { messenger: MessengerType }) {
  const session = useSession(messenger)
  const chatOpen = useChatStore((state) => !!state.activeChatKey[messenger])

  if (!session) {
    return (
      <div className={b('center')}>
        <LoginForm messenger={messenger} />
      </div>
    )
  }

  return (
    <div className={b('layout', { 'chat-open': chatOpen })}>
      <Sidebar messenger={messenger} />
      <ChatWindow messenger={messenger} />
    </div>
  )
}

export function MessengerPage() {
  const activeMessenger = useSessionStore((state) => state.activeMessenger)
  const setActiveMessenger = useSessionStore((state) => state.setActiveMessenger)
  // Приём сообщений работает для всех подключённых мессенджеров, а не только для открытого таба
  useNotificationPolling()

  return (
    <Tabs
      className={b()}
      value={activeMessenger}
      onChange={(value) => value && setActiveMessenger(value as MessengerType)}
      // Неактивные табы не монтируем: у каждого своя форма входа или свой чат
      keepMounted={false}
    >
      <Tabs.List>
        {MESSENGER_ORDER.map((messenger) => (
          <MessengerTab key={messenger} messenger={messenger} />
        ))}
      </Tabs.List>

      {MESSENGER_ORDER.map((messenger) => (
        <Tabs.Panel key={messenger} value={messenger} className={b('panel')}>
          <MessengerPanel messenger={messenger} />
        </Tabs.Panel>
      ))}
    </Tabs>
  )
}
