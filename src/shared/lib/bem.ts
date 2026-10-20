type Modifiers = Record<string, boolean | string | undefined>

/**
 * Генератор БЭМ-классов для блока.
 *   const b = bem('chat-list-item')
 *   b()                    → 'chat-list-item'
 *   b({ active: true })    → 'chat-list-item chat-list-item--active'
 *   b('body')              → 'chat-list-item__body'
 *   b('status', { status: 'read' }) → '… chat-list-item__status--status_read'
 * Модификатор со значением false/undefined/'' не добавляется.
 */
export function bem(block: string) {
  function b(modifiers?: Modifiers): string
  function b(element: string, modifiers?: Modifiers): string
  function b(elementOrModifiers?: string | Modifiers, maybeModifiers?: Modifiers): string {
    const element = typeof elementOrModifiers === 'string' ? elementOrModifiers : undefined
    const modifiers = typeof elementOrModifiers === 'string' ? maybeModifiers : elementOrModifiers
    const base = element ? `${block}__${element}` : block

    const classes = [base]
    for (const [key, value] of Object.entries(modifiers ?? {})) {
      if (value === true) classes.push(`${base}--${key}`)
      else if (typeof value === 'string' && value) classes.push(`${base}--${key}_${value}`)
    }
    return classes.join(' ')
  }
  return b
}
