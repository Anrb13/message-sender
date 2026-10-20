import { ActionIcon, Textarea } from '@mantine/core'
import { IconSend2 } from '@tabler/icons-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useSession } from '@/entities/session'
import type { MessengerType } from '@/shared/api'
import { MESSAGE_MAX_LENGTH } from '@/shared/config'
import { bem } from '@/shared/lib'
import { sendMessage } from '../model/send-message'
import './MessageComposer.css'

const b = bem('message-composer')

interface MessageComposerProps {
  messenger: MessengerType
  chatKey: string
}

export function MessageComposer({ messenger, chatKey }: MessageComposerProps) {
  const session = useSession(messenger)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const canSend = text.trim().length > 0

  async function submit() {
    if (!session || !canSend) return
    // Поле очищаем сразу: сообщение уже видно в переписке, а при ошибке оно помечается «Не доставлено»
    setText('')
    setError(null)
    try {
      await sendMessage(session, chatKey, text)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void submit()
  }

  // Enter — отправить, Shift+Enter — перенос строки (как в web.max.ru)
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form className={b()} onSubmit={handleSubmit}>
      <Textarea
        className={b('input')}
        aria-label="Сообщение"
        placeholder="Сообщение"
        autosize
        minRows={1}
        maxRows={6}
        maxLength={MESSAGE_MAX_LENGTH}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        error={error}
      />
      <ActionIcon
        className={b('send')}
        type="submit"
        size="lg"
        radius="xl"
        disabled={!canSend}
        aria-label="Отправить"
        title="Отправить (Enter)"
      >
        <IconSend2 size={18} />
      </ActionIcon>
    </form>
  )
}
