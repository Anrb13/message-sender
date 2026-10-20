import { describe, expect, test } from 'vitest'
import { getChatTitle } from './title'

describe('getChatTitle', () => {
  test('имя собеседника важнее номера и chatId', () => {
    expect(getChatTitle({ name: 'Иван Петров', phone: '79991234567', chatId: '10000000' })).toBe('Иван Петров')
  })

  test('без имени — номер телефона с плюсом', () => {
    expect(getChatTitle({ phone: '79991234567', chatId: '10000000' })).toBe('+79991234567')
  })

  test('без имени и номера — chatId', () => {
    expect(getChatTitle({ chatId: '10000000' })).toBe('10000000')
  })

  test('пустое имя не считается именем', () => {
    expect(getChatTitle({ name: '', phone: '79991234567', chatId: '10000000' })).toBe('+79991234567')
  })
})
