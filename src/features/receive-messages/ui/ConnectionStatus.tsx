import { Alert } from '@mantine/core'
import { IconPlugConnectedX } from '@tabler/icons-react'
import type { MessengerType } from '@/shared/api'
import { useConnectionStore } from '../model/connection-store'

/** Предупреждение о сбое приёма сообщений; цикл приёма при этом продолжает переподключаться сам */
export function ConnectionStatus({ messenger }: { messenger: MessengerType }) {
  const error = useConnectionStore((state) => state.errors[messenger])
  if (!error) return null

  return (
    <Alert color="orange" variant="light" icon={<IconPlugConnectedX size={18} />} p="xs">
      {error}. Идёт переподключение…
    </Alert>
  )
}
