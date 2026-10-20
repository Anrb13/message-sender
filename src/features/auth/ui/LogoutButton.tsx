import { Button } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import type { MessengerType } from '@/shared/api'

/** Выход из аккаунта мессенджера: удаляет его учётные данные и переписку, другие мессенджеры не трогает */
export function LogoutButton({ messenger }: { messenger: MessengerType }) {
  const logout = useSessionStore((state) => state.logout)
  const resetMessenger = useChatStore((state) => state.resetMessenger)

  return (
    <Button
      variant="subtle"
      color="gray"
      size="xs"
      leftSection={<IconLogout size={16} />}
      onClick={() => {
        logout(messenger)
        resetMessenger(messenger)
      }}
    >
      Выйти
    </Button>
  )
}
