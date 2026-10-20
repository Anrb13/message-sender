import { Center, Stack, Text, Title } from '@mantine/core'

// Временная заглушка: табы мессенджеров и чат появятся на следующих шагах
export function MessengerPage() {
  return (
    <Center h="100%">
      <Stack align="center" gap="xs">
        <Title order={1}>Message Sender</Title>
        <Text c="dimmed">MAX · Telegram · WhatsApp через GREEN-API</Text>
      </Stack>
    </Center>
  )
}
