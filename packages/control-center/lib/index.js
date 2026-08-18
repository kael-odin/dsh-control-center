import { createRequire } from "node:module";
import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { readFileSync } from "node:fs";
//#region lib/types/compatibility.js
/** DSH package versions and exports required by the first Control Center release. */
const SUPPORTED_DSH_VERSION = "0.1.0-rc.7";
const DSH_SOURCE_BASELINE = "99f6f02fecdb7dff40c3fbc9470f5907c29f74ca";
const REQUIRED_PACKAGES = [
	{
		name: "@deepseek-ai/dsh-api-remotes",
		client: true
	},
	{
		name: "@deepseek-ai/dsh-client-runtime",
		client: true
	},
	{
		name: "@deepseek-ai/dsh-client-ui-settings",
		client: true
	},
	{
		name: "@deepseek-ai/dsh-client-ui-layout",
		client: true
	},
	{
		name: "@deepseek-ai/dsh-client-ui-slots",
		client: false
	},
	{
		name: "@deepseek-ai/dsh-client-modules",
		client: true
	},
	{
		name: "@deepseek-ai/dsh-host-apiproxy",
		client: true
	},
	{
		name: "@deepseek-ai/dsh-settings",
		client: false
	}
];
/** Reject a DSH installation whose resolved contract packages differ from rc.7. */
function assertCompatibleDsh(requireFrom = createRequire(import.meta.url)) {
	for (const required of REQUIRED_PACKAGES) {
		let manifestPath;
		try {
			manifestPath = requireFrom.resolve(`${required.name}/package.json`);
		} catch (cause) {
			throw new Error(`DSH Control Center requires ${required.name}@${SUPPORTED_DSH_VERSION}, but its package manifest cannot be resolved. Remove the Control Center bundle or install the supported DSH release.`, { cause });
		}
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
		if (manifest.name !== required.name || manifest.version !== "0.1.0-rc.7") throw new Error(`DSH Control Center is incompatible with ${required.name}: expected ${SUPPORTED_DSH_VERSION}, resolved ${String(manifest.version)}. Supported DSH source baseline: ${DSH_SOURCE_BASELINE}.`);
		if (typeof manifest.exports !== "object" || manifest.exports["./package.json"] === void 0) throw new Error(`${required.name}@${SUPPORTED_DSH_VERSION} does not expose ./package.json as required`);
		if (required.client && manifest.exports["./client"] === void 0) throw new Error(`${required.name}@${SUPPORTED_DSH_VERSION} does not expose ./client as required`);
	}
}
//#endregion
//#region lib/types/secret-schema.js
/** Fail-closed audit for settings schemas that contain secret-role nodes. */
const SAFE_CONTAINERS = /* @__PURE__ */ new Set([
	"object",
	"dict",
	"array"
]);
const UNSUPPORTED_CONTAINERS = /* @__PURE__ */ new Set([
	"union",
	"intersect",
	"transform",
	"tuple",
	"lazy"
]);
function containsSecret(node, seen = /* @__PURE__ */ new Set()) {
	if (node === void 0 || seen.has(node)) return false;
	seen.add(node);
	if (node.meta?.role === "secret") return true;
	for (const child of Object.values(node.dict ?? {})) if (containsSecret(child, seen)) return true;
	if (containsSecret(node.inner, seen)) return true;
	return (node.list ?? []).some((child) => containsSecret(child, seen));
}
function audit(node, path, violations, seen) {
	if (node === void 0 || seen.has(node)) return;
	seen.add(node);
	if (node.meta?.role === "secret") return;
	const type = node.type ?? "unknown";
	if (UNSUPPORTED_CONTAINERS.has(type) && containsSecret(node)) {
		violations.push({
			path,
			type
		});
		return;
	}
	if (type === "object") {
		for (const [key, child] of Object.entries(node.dict ?? {})) audit(child, [...path, key], violations, seen);
		return;
	}
	if (type === "dict" || type === "array") {
		audit(node.inner, [...path, type === "array" ? "*" : "{}"], violations, seen);
		return;
	}
	if (SAFE_CONTAINERS.has(type)) return;
	if (containsSecret(node)) violations.push({
		path,
		type
	});
}
function rehydrateSerialized(schema) {
	const root = schema;
	if (root.refs === void 0 || root.uid === void 0) return root;
	const nodes = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(root.refs)) if (typeof value !== "number") nodes.set(Number(key), { ...value });
	const resolve = (value) => typeof value === "number" ? nodes.get(value) : value;
	for (const node of nodes.values()) {
		const inner = resolve(node.inner);
		if (inner === void 0) delete node.inner;
		else node.inner = inner;
		const list = node.list?.map((entry) => resolve(entry) ?? {});
		if (list === void 0) delete node.list;
		else node.list = list;
		if (node.dict !== void 0) node.dict = Object.fromEntries(Object.entries(node.dict).map(([key, value]) => [key, resolve(value) ?? {}]));
	}
	return nodes.get(root.uid) ?? root;
}
/** Return unsupported wrapper locations that can hide secret-role descendants. */
function auditSecretSchema(schema) {
	const violations = [];
	audit(rehydrateSerialized(schema), [], violations, /* @__PURE__ */ new Set());
	return violations;
}
/** Throw before a namespace with an unsafe secret schema is exposed by Control Center. */
function assertSecretSchemaSafe(namespace, schema) {
	const violations = auditSecretSchema(schema);
	if (violations.length === 0) return;
	const detail = violations.map((violation) => `${violation.path.length === 0 ? "<root>" : violation.path.join(".")} (${violation.type})`).join(", ");
	throw new Error(`Control Center refuses settings namespace ${JSON.stringify(namespace)}: secret descendants pass through unsupported schema wrappers at ${detail}`);
}
//#endregion
//#region lib/types/index.js
const ONBOARDING_SETTINGS_NAMESPACE = "ui-onboarding";
const OnboardingSettingsSchema = z.object({ welcomeNoticeVersion: z.string() });
/** Cordis plugin name. */
const name = "dsh-control-center";
/** Reject incompatible DSH packages, then restore the onboarding namespace. */
function apply(ctx) {
	assertCompatibleDsh();
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE), OnboardingSettingsSchema);
	});
}
//#endregion
export { apply, assertCompatibleDsh, assertSecretSchemaSafe, auditSecretSchema, name };
