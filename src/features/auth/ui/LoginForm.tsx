import { Alert, Button, Group, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'
import { MESSENGERS } from '@/entities/messenger'
import { useSessionStore, type Session } from '@/entities/session'
import { createGreenApiClient, describeError } from '@/shared/api'
import type { InstanceSettings, MessengerType } from '@/shared/api'
import { defaultApiUrl } from '@/shared/lib'
import { verifyCredentials } from '../model/verify'

interface FieldErrors {
  idInstance?: string
  apiTokenInstance?: string
}

/** Учётные данные проверены, но уведомления выключены — ждём решения пользователя */
interface PendingLogin {
  session: Session
  settingsFix: InstanceSettings
}

export function LoginForm({ messenger }: { messenger: MessengerType }) {
  const login = useSessionStore((state) => state.login)

  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<PendingLogin | null>(null)

  const apiUrlPlaceholder = defaultApiUrl(idInstance)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const errors: FieldErrors = {
      idInstance: idInstance.trim() ? undefined : 'Укажите idInstance',
      apiTokenInstance: apiTokenInstance.trim() ? undefined : 'Укажите apiTokenInstance',
    }
    setFieldErrors(errors)
    if (errors.idInstance || errors.apiTokenInstance) return

    const credentials = {
      apiUrl: apiUrl.trim() || apiUrlPlaceholder,
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }

    setLoading(true)
    setError(null)
    try {
      const { wid, settingsFix } = await verifyCredentials(credentials)
      const session: Session = { ...credentials, wid }
      if (settingsFix) setPending({ session, settingsFix })
      else login(messenger, session)
    } catch (e) {
      setError(describeError(e))
    } finally {
      setLoading(false)
    }
  }

  async function enableNotificationsAndLogin() {
    if (!pending) return
    setLoading(true)
    setError(null)
    try {
      await createGreenApiClient(pending.session).setSettings(pending.settingsFix)
      login(messenger, pending.session)
    } catch (e) {
      setError(describeError(e))
      setLoading(false)
    }
  }

  return (
    <Paper component="form" onSubmit={handleSubmit} withBorder shadow="sm" p="xl" w="100%" maw={420} noValidate>
      <Stack>
        <div>
          <Title order={2} size="h3">
            Вход в {MESSENGERS[messenger].title}
          </Title>
          <Text size="sm" c="dimmed">
            Данные инстанса из личного кабинета GREEN-API
          </Text>
        </div>

        <TextInput
          label="idInstance"
          value={idInstance}
          onChange={(e) => setIdInstance(e.currentTarget.value)}
          error={fieldErrors.idInstance}
          inputMode="numeric"
          autoComplete="username"
          disabled={!!pending}
        />
        <PasswordInput
          label="apiTokenInstance"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.currentTarget.value)}
          error={fieldErrors.apiTokenInstance}
          autoComplete="current-password"
          disabled={!!pending}
        />
        <TextInput
          label="apiUrl"
          description="Если оставить пустым, адрес будет вычислен по idInstance"
          placeholder={apiUrlPlaceholder}
          value={apiUrl}
          onChange={(e) => setApiUrl(e.currentTarget.value)}
          disabled={!!pending}
        />

        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        {pending ? (
          <Alert color="yellow" variant="light" icon={<IconAlertTriangle />} title="Входящие уведомления выключены">
            <Stack gap="sm">
              <Text size="sm">
                Без них приложение не получит ответы собеседников. Включение перезапустит инстанс, настройки
                применятся в течение ~5 минут.
              </Text>
              <Group gap="xs">
                <Button size="xs" onClick={enableNotificationsAndLogin} loading={loading}>
                  Включить и войти
                </Button>
                <Button size="xs" variant="default" onClick={() => login(messenger, pending.session)} disabled={loading}>
                  Войти без изменений
                </Button>
              </Group>
            </Stack>
          </Alert>
        ) : (
          <Button type="submit" loading={loading} fullWidth>
            Войти
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
