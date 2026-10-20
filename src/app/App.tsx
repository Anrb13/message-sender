import { MessengerPage } from '@/pages/messenger'
import { ThemeProvider } from './theme/ThemeProvider'
import './styles/index.css'

export function App() {
  return (
    <ThemeProvider>
      <MessengerPage />
    </ThemeProvider>
  )
}
