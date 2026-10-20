import { Avatar, Badge, Text, UnstyledButton } from '@mantine/core'
import { getChatTitle } from '../lib/title'
import type { Chat } from '../model/types'
import classes from './ChatListItem.module.css'

interface ChatListItemProps {
  chat: Chat
  lastMessage?: string
  active?: boolean
  onSelect?: (chatKey: string) => void
}

export function ChatListItem({ chat, lastMessage, active = false, onSelect }: ChatListItemProps) {
  const title = getChatTitle(chat)

  return (
    <UnstyledButton className={classes.item} aria-current={active} onClick={() => onSelect?.(chat.key)}>
      <Avatar name={title} color="initials" radius="xl" />
      <div className={classes.body}>
        <Text size="sm" fw={500} truncate>
          {title}
        </Text>
        {lastMessage && (
          <Text size="xs" c="dimmed" truncate>
            {lastMessage}
          </Text>
        )}
      </div>
      {chat.unread > 0 && (
        <Badge size="sm" circle>
          {chat.unread}
        </Badge>
      )}
    </UnstyledButton>
  )
}
