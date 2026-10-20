import { create } from 'zustand'

interface StorageNoticeState {
  /** Сколько сообщений пришлось удалить, чтобы освободить место в localStorage; 0 — предупреждения нет */
  removed: number
  notify: (removed: number) => void
  dismiss: () => void
}

/** Предупреждение о том, что историю пришлось обрезать под квоту браузера. Хранится отдельно от чатов:
 *  запись в стор чатов во время обработки переполнения снова упёрлась бы в ту же квоту. */
export const useStorageNoticeStore = create<StorageNoticeState>()((set) => ({
  removed: 0,
  notify: (removed) => set((state) => ({ removed: state.removed + removed })),
  dismiss: () => set({ removed: 0 }),
}))
