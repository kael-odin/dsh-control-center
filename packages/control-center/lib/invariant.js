//#region lib/types/invariant.js
const PACKAGE_NAME = "@dsh-control-center/control-center";
/** Cordis companion plugin name. */
const name = "dsh-control-center-invariant";
/** Service required before package ownership can be reserved. */
const inject = ["invariants"];
/** No runtime invariant: startup compatibility is enforced synchronously by the package entrypoint. */
const install = () => {};
/** Register Control Center ownership with the DSH invariant registry. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
