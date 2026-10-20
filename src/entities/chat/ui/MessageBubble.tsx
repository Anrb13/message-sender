import { IconAlertCircle, IconCheck, IconChecks, IconClock } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { formatTime } from '@/shared/lib'
import type { Message, MessageStatus } from '../model/types'
import classes from './MessageBubble.module.css'

const ICON_SIZE = 14

const STATUS_VIEW: Record<MessageStatus, { label: string; icon: ReactNode; error?: boolean }> = {
  pending: { label: 'Отправляется', icon: <IconClock size={ICON_SIZE} /> },
  sent: { label: 'Отправлено', icon: <IconCheck size={ICON_SIZE} /> },
  delivered: { label: 'Доставлено', icon: <IconChecks size={ICON_SIZE} /> },
  read: { label: 'Прочитано', icon: <IconChecks size={ICON_SIZE} /> },
  failed: { label: 'Не доставлено', icon: <IconAlertCircle size={ICON_SIZE} />, error: true },
  noAccount: { label: 'Не доставлено', icon: <IconAlertCircle size={ICON_SIZE} />, error: true },
  notInGroup: { label: 'Не доставлено', icon: <IconAlertCircle size={ICON_SIZE} />, error: true },
}

export function MessageBubble({ message }: { message: Message }) {
  const status = message.direction === 'outgoing' && message.status ? STATUS_VIEW[message.status] : null

  return (
    <div className={classes.row} data-direction={message.direction}>
      <div className={classes.bubble}>
        {message.text}
        <span className={classes.meta}>
          {formatTime(message.timestamp)}
          {status && (
            <span
              className={classes.status}
              data-status={message.status}
              data-error={status.error || undefined}
              role="img"
              aria-label={status.label}
              title={status.label}
            >
              {status.icon}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
