const FALLBACK_API_URL = 'https://api.green-api.com'

/**
 * apiUrl по умолчанию для формы входа. Хост инстанса GREEN-API обычно совпадает
 * с первыми 4 цифрами idInstance (3100123456 → 3100.api.green-api.com), но точный apiUrl
 * всегда указан в личном кабинете — поэтому пользователь может его поправить.
 */
export function defaultApiUrl(idInstance: string): string {
  const id = idInstance.trim()
  return /^\d{4,}$/.test(id) ? `https://${id.slice(0, 4)}.api.green-api.com` : FALLBACK_API_URL
}
