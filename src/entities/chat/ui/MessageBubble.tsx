import { IconAlertCircle, IconCheck, IconChecks, IconClock } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { bem, formatTime } from '@/shared/lib'
import type { Message, MessageStatus } from '../model/types'
import './MessageBubble.css'

const b = bem('message-bubble')
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
    <div className={b({ [message.direction]: true })}>
      <div className={b('content')}>
        {message.text}
        <span className={b('meta')}>
          {formatTime(message.timestamp)}
          {status && (
            <span
              className={b('status', { status: message.status, error: status.error })}
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
