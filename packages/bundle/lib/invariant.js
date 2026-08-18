//#region packages/bundle/lib/types/invariant.js
const PACKAGE_NAME = "@dsh-control-center/bundle";
/** Cordis companion plugin name. */
const name = "dsh-control-center-bundle-invariant";
/** Service required before package ownership can be reserved. */
const inject = ["invariants"];
/** No runtime invariant: this package only carries a static profile patch. */
const install = () => {};
/** Register bundle ownership with the DSH invariant registry. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
