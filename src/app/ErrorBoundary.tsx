import { Button, Stack, Text, Title } from '@mantine/core'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Страховка от падения рендера: без неё любая ошибка в компоненте оставляет пользователю
 * белый экран без объяснения. Переписка при этом цела — она лежит в localStorage.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Ошибка рендера приложения', error, info)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <Stack align="center" justify="center" h="100%" p="xl" gap="sm">
        <Title order={2}>Что-то пошло не так</Title>
        <Text c="dimmed" ta="center">
          Переписка сохранена в браузере — перезагрузите страницу, чтобы продолжить.
        </Text>
        <Text size="xs" c="dimmed" ta="center">
          {error.message}
        </Text>
        <Button onClick={() => window.location.reload()}>Перезагрузить</Button>
      </Stack>
    )
  }
}
