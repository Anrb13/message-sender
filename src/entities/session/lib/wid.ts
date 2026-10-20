/** Отображаемый номер аккаунта из wid: 79991234567@c.us → +79991234567 */
export function formatWid(wid: string): string {
  const id = wid.split('@')[0]
  return /^\d+$/.test(id) ? `+${id}` : id
}
