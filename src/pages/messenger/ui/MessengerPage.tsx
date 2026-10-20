import { Badge, Group, Stack, Tabs, Text } from '@mantine/core'
import { LoginForm, LogoutButton } from '@/features/auth'
import { useChatStore } from '@/entities/chat'
import { MESSENGERS, MESSENGER_ORDER } from '@/entities/messenger'
import { useSession, useSessionStore } from '@/entities/session'
import { isMessengerSupported, type MessengerType } from '@/shared/api'
import classes from './MessengerPage.module.css'

function useUnreadCount(messenger: MessengerType) {
  return useChatStore((state) =>
    Object.values(state.chats).reduce((sum, chat) => (chat.messenger === messenger ? sum + chat.unread : sum), 0),
  )
}

function MessengerTab({ messenger }: { messenger: MessengerType }) {
  const unread = useUnreadCount(messenger)
  const supported = isMessengerSupported(messenger)
  const { title, color } = MESSENGERS[messenger]

  return (
    <Tabs.Tab
      value={messenger}
      color={color}
      disabled={!supported}
      title={supported ? undefined : 'Поддержка появится позже'}
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

  if (!session) {
    return (
      <div className={classes.center}>
        <LoginForm messenger={messenger} />
      </div>
    )
  }

  // Временная заглушка: список чатов и окно переписки появятся на следующих шагах
  return (
    <div className={classes.center}>
      <Stack align="center">
        <Text>Вы вошли в {MESSENGERS[messenger].title}</Text>
        {session.wid && <Text c="dimmed">{session.wid}</Text>}
        <Group>
          <LogoutButton messenger={messenger} />
        </Group>
      </Stack>
    </div>
  )
}

export function MessengerPage() {
  const activeMessenger = useSessionStore((state) => state.activeMessenger)
  const setActiveMessenger = useSessionStore((state) => state.setActiveMessenger)

  return (
    <Tabs
      className={classes.page}
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
        <Tabs.Panel key={messenger} value={messenger} className={classes.panel}>
          <MessengerPanel messenger={messenger} />
        </Tabs.Panel>
      ))}
    </Tabs>
  )
}
