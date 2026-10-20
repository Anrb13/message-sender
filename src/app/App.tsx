import { MessengerPage } from '@/pages/messenger'
import { ErrorBoundary } from './ErrorBoundary'
import { ThemeProvider } from './theme/ThemeProvider'
import './styles/index.css'

export function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <MessengerPage />
      </ErrorBoundary>
    </ThemeProvider>
  )
}
