import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@dsh-control-center/control-center'

/** Cordis companion plugin name. */
export const name = 'dsh-control-center-invariant'
/** Service required before package ownership can be reserved. */
export const inject = ['invariants']

/** No runtime invariant: startup compatibility is enforced synchronously by the package entrypoint. */
const install: InvariantInstaller = () => {}

/** Register Control Center ownership with the DSH invariant registry. */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
