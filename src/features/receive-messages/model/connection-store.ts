import { create } from 'zustand'
import type { MessengerType } from '@/shared/api'

interface ConnectionState {
  /** Последняя ошибка приёма уведомлений по мессенджерам; нет записи — связь в порядке */
  errors: Partial<Record<MessengerType, string>>
  setError: (messenger: MessengerType, error: string | null) => void
}

export const useConnectionStore = create<ConnectionState>()((set) => ({
  errors: {},
  setError: (messenger, error) =>
    set((state) => {
      const errors = { ...state.errors }
      if (error) errors[messenger] = error
      else delete errors[messenger]
      return { errors }
    }),
}))
