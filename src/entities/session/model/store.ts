import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Credentials, MessengerType } from '@/shared/api'

export interface Session extends Credentials {
  /** Собственный идентификатор аккаунта из getSettings (например 79991234567@c.us) */
  wid?: string
}

interface SessionState {
  /** У каждого мессенджера свой инстанс GREEN-API, а значит и свои учётные данные */
  sessions: Partial<Record<MessengerType, Session>>
  activeMessenger: MessengerType
  login: (messenger: MessengerType, session: Session) => void
  logout: (messenger: MessengerType) => void
  setActiveMessenger: (messenger: MessengerType) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessions: {},
      activeMessenger: 'max',

      login: (messenger, session) => set((state) => ({ sessions: { ...state.sessions, [messenger]: session } })),

      logout: (messenger) =>
        set((state) => {
          const sessions = { ...state.sessions }
          delete sessions[messenger]
          return { sessions }
        }),

      setActiveMessenger: (activeMessenger) => set({ activeMessenger }),
    }),
    { name: 'message-sender:session' },
  ),
)

export const useSession = (messenger: MessengerType) => useSessionStore((state) => state.sessions[messenger])
