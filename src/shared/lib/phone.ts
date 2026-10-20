/**
 * Приводит введённый номер к виду «только цифры, с кодом страны» (79991234567).
 * Российские номера в формате 8XXXXXXXXXX и XXXXXXXXXX (без кода) дополняются до 7XXXXXXXXXX.
 * Возвращает null, если номер не похож на международный (11–15 цифр).
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`

  return digits.length >= 11 && digits.length <= 15 ? digits : null
}
