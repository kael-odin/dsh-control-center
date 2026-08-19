/** Static profile-layer package; all runtime behavior lives in the control-center package. */

import type { Context } from '@deepseek-ai/cordis'

/** Cordis plugin name. */
export const name = 'dsh-control-center-bundle'

/** Mount the static bundle package. */
export async function apply(ctx: Context): Promise<void> {
  const controlCenter = await import('@dsh-control-center/control-center')
  ctx.plugin(controlCenter)
}
