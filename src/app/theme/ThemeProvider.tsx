import { createTheme, MantineProvider } from '@mantine/core'
import type { ReactNode } from 'react'

const theme = createTheme({
  primaryColor: 'violet',
  defaultRadius: 'md',
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Цветовая схема следует системной настройке пользователя
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      {children}
    </MantineProvider>
  )
}
