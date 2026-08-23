//#region packages/bundle/lib/types/index.js
/** Static profile-layer package; all runtime behavior lives in the control-center package. */
/** Cordis plugin name. */
const name = "dsh-control-center-bundle";
/** Mount the static bundle package. */
async function apply(ctx) {
	const controlCenter = await import("./lib-Dq_XaKG2.js").then((n) => n.t);
	ctx.plugin(controlCenter);
}
//#endregion
export { apply, name };
