export interface ScrollMetrics {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

/**
 * «Прилип» ли пользователь к низу переписки: до конца осталось меньше threshold пикселей.
 * Нужно, чтобы новое сообщение не выдёргивало прокрутку у того, кто читает историю выше.
 */
export function isNearBottom({ scrollTop, scrollHeight, clientHeight }: ScrollMetrics, threshold = 48): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold
}
