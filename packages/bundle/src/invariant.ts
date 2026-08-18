import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@dsh-control-center/bundle'

/** Cordis companion plugin name. */
export const name = 'dsh-control-center-bundle-invariant'
/** Service required before package ownership can be reserved. */
export const inject = ['invariants']

/** No runtime invariant: this package only carries a static profile patch. */
const install: InvariantInstaller = () => {}

/** Register bundle ownership with the DSH invariant registry. */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
