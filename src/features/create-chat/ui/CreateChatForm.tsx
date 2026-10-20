import { ActionIcon, TextInput } from '@mantine/core'
import { IconMessagePlus } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'
import { useSession } from '@/entities/session'
import type { MessengerType } from '@/shared/api'
import { createChat } from '../model/create-chat'

export function CreateChatForm({ messenger }: { messenger: MessengerType }) {
  const session = useSession(messenger)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session || loading) return

    setLoading(true)
    setError(null)
    try {
      await createChat(messenger, session, phone)
      setPhone('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextInput
        label="Номер телефона"
        placeholder="+7 999 123-45-67"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.currentTarget.value)}
        error={error}
        rightSection={
          <ActionIcon type="submit" variant="filled" loading={loading} aria-label="Создать чат" title="Создать чат">
            <IconMessagePlus size={18} />
          </ActionIcon>
        }
      />
    </form>
  )
}
