/**
 * 快捷短语变量模板 — Cherry parity: a phrase's text may carry `{{variable}}`
 * placeholders that resolve at insert time, not at store time (a stored
 * "今天的日期是 {{date}}" is regenerated on every use).
 *
 * Honesty rules: an unknown or unavailable variable stays verbatim in the
 * draft so the user sees exactly what did not resolve; values expand once
 * (no recursion); `date`/`time` come from the injected clock so tests stay
 * deterministic.
 */

export interface PhraseVariableContext {
  /** The insert-time clock. */
  now: Date
  /** Clipboard text when it could be read; undefined leaves `{{clipboard}}` verbatim. */
  clipboard?: string
  /** BCP-47 locale for the weekday name (default zh-CN, Cherry parity). */
  locale?: string
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

function resolveVariable(name: string, context: PhraseVariableContext): string | undefined {
  const { now } = context
  switch (name) {
    case 'date':
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    case 'time':
      return `${pad(now.getHours())}:${pad(now.getMinutes())}`
    case 'datetime':
      return `${resolveVariable('date', context)} ${resolveVariable('time', context)}`
    case 'week':
    case 'weekday':
      return new Intl.DateTimeFormat(context.locale ?? 'zh-CN', { weekday: 'long' }).format(now)
    case 'clipboard':
      return context.clipboard
    default:
      return undefined
  }
}

/**
 * Expand every `{{name}}` in the phrase text. Unknown names (and known names
 * whose value is unavailable, e.g. clipboard without a readable clipboard)
 * survive verbatim; a lone `{{` or `}}` is untouched.
 */
export function expandPhraseVariables(text: string, context: PhraseVariableContext): string {
  return text.replace(/\{\{([a-zA-Z]+)\}\}/g, (whole, name: string) => {
    const value = resolveVariable(name, context)
    return value === undefined ? whole : value
  })
}
