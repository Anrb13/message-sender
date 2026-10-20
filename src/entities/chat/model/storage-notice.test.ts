import { beforeEach, describe, expect, test } from 'vitest'
import { useStorageNoticeStore } from './storage-notice'

beforeEach(() => {
  useStorageNoticeStore.setState(useStorageNoticeStore.getInitialState())
})

describe('useStorageNoticeStore', () => {
  test('по умолчанию предупреждения нет', () => {
    expect(useStorageNoticeStore.getState().removed).toBe(0)
  })

  test('notify суммирует удалённые сообщения', () => {
    useStorageNoticeStore.getState().notify(5)
    useStorageNoticeStore.getState().notify(3)

    expect(useStorageNoticeStore.getState().removed).toBe(8)
  })

  test('dismiss сбрасывает предупреждение', () => {
    useStorageNoticeStore.getState().notify(5)

    useStorageNoticeStore.getState().dismiss()

    expect(useStorageNoticeStore.getState().removed).toBe(0)
  })
})
