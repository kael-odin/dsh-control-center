import { t as translationRemote } from "./translation-remote-client-DedbChWd.js";
import { t as paintingRemote } from "./painting-remote-client-X1tWq7oF.js";
import { createRequire } from "node:module";
import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Service } from "@deepseek-ai/cordis";
import { ReasoningEffortId, createUserMessage } from "@deepseek-ai/dsh-llm";
import { Remote, bindTypertRemote } from "@deepseek-ai/dsh-typert-protocol";
import { getPath } from "@deepseek-ai/dsh-client-schema-form";
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
//#region lib/types/translation.js
const MAX_TEXT_CHARS$1 = 1e5;
const MAX_HISTORY_PAGE$1 = 100;
const BUILTIN_LANGUAGES = Object.freeze([
	{
		id: "auto",
		label: "Auto detect",
		builtin: true
	},
	{
		id: "zh-CN",
		label: "简体中文",
		builtin: true
	},
	{
		id: "en",
		label: "English",
		builtin: true
	},
	{
		id: "ja",
		label: "日本語",
		builtin: true
	},
	{
		id: "ko",
		label: "한국어",
		builtin: true
	},
	{
		id: "fr",
		label: "Français",
		builtin: true
	},
	{
		id: "de",
		label: "Deutsch",
		builtin: true
	},
	{
		id: "es",
		label: "Español",
		builtin: true
	}
]);
function cloneJob$1(view) {
	return structuredClone(view);
}
function assertText(text) {
	if (typeof text !== "string" || text.trim().length === 0) throw new Error("translation text must not be blank");
	if (text.length > MAX_TEXT_CHARS$1) throw new Error(`translation text exceeds ${MAX_TEXT_CHARS$1} characters`);
	return text;
}
function language(id, allowAuto) {
	if (typeof id !== "string" || id.trim().length === 0) throw new Error("translation language must not be blank");
	if (!allowAuto && id === "auto") throw new Error("target language cannot use auto detection");
	return id.trim();
}
function prompt(request) {
	return [
		"Translate the text faithfully and completely.",
		`${request.sourceLanguage === "auto" ? "detect the source language automatically" : `the source language is ${request.sourceLanguage}`}; the target language is ${request.targetLanguage}.`,
		"Return only the translated text. Preserve paragraphs, lists, code, URLs, names, and formatting. Do not explain."
	].join(" ");
}
function failureOf(error) {
	return {
		message: error instanceof Error ? error.message : String(error),
		code: "TRANSLATION_ERROR"
	};
}
function markTranslationRemoteMethods(service) {
	const initializers = [];
	for (const [method, exportName] of [
		["start", "start"],
		["get", "get"],
		["cancel", "cancel"],
		["listHistory", "history"],
		["deleteHistory", "deleteHistory"],
		["languages", "languages"],
		["putLanguage", "putLanguage"],
		["deleteLanguage", "deleteLanguage"]
	]) {
		const implementation = Reflect.get(TranslationService.prototype, method);
		Remote(exportName)(implementation, {
			kind: "method",
			name: method,
			static: false,
			private: false,
			access: {
				has: (value) => method in value,
				get: (value) => Reflect.get(value, method)
			},
			addInitializer: (initializer) => {
				initializers.push(initializer);
			},
			metadata: void 0
		});
	}
	for (const initialize of initializers) initialize.call(service);
}
/**
* One-shot translation jobs and persistent in-process history over DSH LLM routes.
*/
var TranslationService = class extends Service {
	static inject = ["llm"];
	typertRemote = bindTypertRemote(this, "controlCenterTranslation");
	llm;
	jobs = /* @__PURE__ */ new Map();
	history = /* @__PURE__ */ new Map();
	customLanguages = /* @__PURE__ */ new Map();
	accepting = true;
	constructor(ctx) {
		super(ctx, "controlCenterTranslation");
		this.llm = ctx.get("llm");
		markTranslationRemoteMethods(this);
		ctx.effect(() => async () => {
			this.accepting = false;
			for (const job of this.jobs.values()) job.controller.abort();
			await Promise.allSettled([...this.jobs.values()].map((job) => job.task));
			this.jobs.clear();
		}, "control-center.translation: settle jobs");
	}
	start(request) {
		if (!this.accepting) throw new Error("translation service is stopping");
		const resolved = {
			sourceLanguage: language(request.sourceLanguage, true),
			targetLanguage: language(request.targetLanguage, false),
			text: assertText(request.text),
			selection: structuredClone(request.selection)
		};
		const now = Date.now();
		const jobId = `translation-${randomUUID()}`;
		const controller = new AbortController();
		const mutable = {
			view: {
				jobId,
				status: "running",
				output: "",
				selection: resolved.selection,
				sourceLanguage: resolved.sourceLanguage,
				targetLanguage: resolved.targetLanguage,
				createdAt: now,
				updatedAt: now
			},
			controller,
			task: Promise.resolve()
		};
		this.jobs.set(jobId, mutable);
		mutable.task = this.run(mutable, resolved);
		return { jobId };
	}
	get(jobId) {
		const job = this.jobs.get(jobId);
		if (job === void 0) throw new Error(`unknown translation job "${jobId}"`);
		return cloneJob$1(job.view);
	}
	cancel(jobId) {
		const job = this.jobs.get(jobId);
		if (job === void 0) throw new Error(`unknown translation job "${jobId}"`);
		if (job.view.status === "running") job.controller.abort();
		return cloneJob$1(job.view);
	}
	listHistory(cursor, limit) {
		const bounded = Math.min(MAX_HISTORY_PAGE$1, Math.max(1, Math.trunc(limit)));
		const ordered = [...this.history.values()].sort((left, right) => right.createdAt - left.createdAt);
		const offset = cursor === null ? 0 : Number.parseInt(cursor, 10);
		if (!Number.isSafeInteger(offset) || offset < 0) throw new Error("invalid translation history cursor");
		const items = ordered.slice(offset, offset + bounded).map((item) => structuredClone(item));
		const next = offset + items.length;
		return {
			items,
			...next < ordered.length ? { nextCursor: String(next) } : {}
		};
	}
	deleteHistory(id) {
		this.history.delete(id);
		return { absent: true };
	}
	languages() {
		const custom = [...this.customLanguages.values()].sort((left, right) => left.label.localeCompare(right.label));
		return {
			source: [...BUILTIN_LANGUAGES.map((item) => ({ ...item })), ...custom.map((item) => ({ ...item }))],
			target: [...BUILTIN_LANGUAGES.filter((item) => item.id !== "auto").map((item) => ({ ...item })), ...custom.map((item) => ({ ...item }))]
		};
	}
	putLanguage(id, label) {
		const resolvedId = language(id, false);
		if (BUILTIN_LANGUAGES.some((item) => item.id === resolvedId)) throw new Error(`language "${resolvedId}" is built in`);
		const resolvedLabel = label.trim();
		if (resolvedLabel.length === 0) throw new Error("translation language label must not be blank");
		const item = {
			id: resolvedId,
			label: resolvedLabel,
			builtin: false
		};
		this.customLanguages.set(resolvedId, item);
		return { ...item };
	}
	deleteLanguage(id) {
		this.customLanguages.delete(id);
		return { absent: true };
	}
	async run(job, request) {
		try {
			const llm = this.llm;
			const callConfig = {
				provider: request.selection.provider,
				model: request.selection.model,
				...request.selection.reasoningEffort === void 0 ? {} : { reasoningEffort: ReasoningEffortId(request.selection.reasoningEffort) }
			};
			const prepared = await llm.prepareCall(callConfig, job.controller.signal);
			const message = createUserMessage({
				source: { kind: "user" },
				content: [{
					type: "text",
					text: request.text
				}]
			});
			for await (const chunk of prepared.stream({
				...prepared.config,
				messages: [message],
				system: prompt(request),
				signal: job.controller.signal
			})) {
				if (chunk.type === "text-delta") job.view.output += chunk.text;
				if (chunk.type === "finish") {
					if (chunk.reason.kind === "aborted") job.view.status = "cancelled";
					else if (chunk.reason.kind === "error") {
						job.view.status = "error";
						job.view.failure = chunk.reason.failure;
					} else job.view.status = "completed";
				}
				job.view.updatedAt = Date.now();
			}
			if (job.view.status === "running") job.view.status = job.controller.signal.aborted ? "cancelled" : "completed";
			if (job.view.status === "completed") {
				const id = `history-${randomUUID()}`;
				const item = {
					id,
					sourceLanguage: request.sourceLanguage,
					targetLanguage: request.targetLanguage,
					sourceText: request.text,
					translatedText: job.view.output,
					selection: structuredClone(request.selection),
					createdAt: Date.now()
				};
				this.history.set(id, item);
				job.view.historyId = id;
			}
		} catch (error) {
			job.view.status = job.controller.signal.aborted ? "cancelled" : "error";
			if (job.view.status === "error") job.view.failure = failureOf(error);
		} finally {
			job.view.updatedAt = Date.now();
		}
	}
};
//#endregion
//#region lib/types/painting.js
const MAX_TEXT_CHARS = 2e4;
const MAX_HISTORY_PAGE = 100;
const DEFAULT_SAMPLES = 1;
function markPaintingRemoteMethods(service) {
	const initializers = [];
	for (const [method, exportName] of [
		["catalog", "catalog"],
		["start", "start"],
		["get", "get"],
		["cancel", "cancel"],
		["listHistory", "history"],
		["deleteHistory", "deleteHistory"]
	]) {
		const implementation = Reflect.get(PaintingService.prototype, method);
		Remote(exportName)(implementation, {
			kind: "method",
			name: method,
			static: false,
			private: false,
			access: {
				has: (value) => method in value,
				get: (value) => Reflect.get(value, method)
			},
			addInitializer: (initializer) => {
				initializers.push(initializer);
			},
			metadata: void 0
		});
	}
	for (const initialize of initializers) initialize.call(service);
}
function cloneJob(view) {
	return structuredClone(view);
}
function assertPrompt(prompt) {
	const trimmed = typeof prompt === "string" ? prompt.trim() : "";
	if (trimmed.length === 0) throw new Error("painting prompt must not be blank");
	if (trimmed.length > MAX_TEXT_CHARS) throw new Error(`painting prompt exceeds ${MAX_TEXT_CHARS} characters`);
	return trimmed;
}
function sampleCountOf(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isInteger(n) || n < 1 || n > 8) throw new Error("sampleCount must be an integer from 1 through 8");
	return n;
}
function providerProfile(settings, ns, path) {
	const view = settings.describe().find((candidate) => candidate.ns === ns);
	const raw = view === void 0 ? void 0 : getPath(view.value, path);
	return typeof raw === "object" && raw !== null ? raw : {};
}
/**
* Resolve a configured provider's endpoint from settings through the same
* authority the Models page reads.
* @param settings - Host settings service.
* @param llm - Host LLM service.
* @param providerId - provider route key.
* @returns resolved display name, endpoint, and settings identity.
*/
async function resolveProvider(settings, llm, providerId) {
	const entry = llm.listConfigurableProviders().find((candidate) => candidate.provider === providerId);
	if (entry === void 0) throw new Error(`provider "${providerId}" has no configurable route`);
	const settingsNs = entry.settingsNs;
	const settingsPath = [...entry.settingsPath];
	const baseURLValue = providerProfile(settings, settingsNs, settingsPath).baseURL;
	const baseURL = typeof baseURLValue === "string" && baseURLValue.trim().length > 0 ? baseURLValue.trim().replace(/\/$/, "") : void 0;
	if (baseURL === void 0) throw new Error(`provider "${providerId}" has no endpoint configured`);
	return {
		name: entry.displayName,
		baseURL,
		settingsNs,
		settingsPath
	};
}
/**
* Get the provider credential value through the DSH credentials authority.
* @param settings - Host settings service.
* @param credentials - Host credentials service.
* @param providerId - provider route key (diagnostic only).
* @param ns - provider settings namespace.
* @param path - provider settings path.
* @returns the resolved secret value, or '' when unconfigured.
*/
async function resolveKey(settings, credentials, providerId, ns, path) {
	const refName = providerProfile(settings, ns, path).apiKeyEnv;
	if (typeof refName !== "string" || refName.length === 0) return "";
	const resolved = await credentials.resolve(refName);
	if (resolved === void 0) throw new Error(`provider "${providerId}" has no credential configured for ${refName}`);
	return resolved.value.trim();
}
/** Call an OpenAI-compatible `/images/generations` endpoint and decode returned images. */
async function callImageGeneration(baseURL, apiKey, model, prompt, params, signal, onProgress) {
	const payload = {
		model,
		prompt,
		...params
	};
	onProgress(.2);
	const response = await fetch(`${baseURL}/images/generations`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			...apiKey.length === 0 ? {} : { authorization: `Bearer ${apiKey}` }
		},
		body: JSON.stringify(payload),
		signal
	});
	onProgress(.5);
	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`image generation failed (HTTP ${response.status}): ${text.slice(0, 300)}`);
	}
	const items = (await response.json()).data ?? [];
	if (items.length === 0) throw new Error("image generation returned no images");
	const images = [];
	let fraction = .6;
	for (const item of items) {
		const fromB64 = typeof item.b64_json === "string" && item.b64_json.length > 0;
		let bytes;
		if (fromB64) bytes = Uint8Array.from(Buffer.from(item.b64_json, "base64"));
		else {
			const url = item.url;
			if (typeof url !== "string" || url.length === 0) throw new Error("image generation returned an item with no data");
			const fetched = await fetch(url, { signal });
			if (!fetched.ok) throw new Error(`failed to download generated image (HTTP ${fetched.status})`);
			bytes = new Uint8Array(await fetched.arrayBuffer());
		}
		const dimensions = detectDimensions(bytes);
		images.push({
			data: bytes,
			mediaType: "image/png",
			width: dimensions.width,
			height: dimensions.height
		});
		fraction += .4 / items.length;
		onProgress(Math.min(.95, fraction));
	}
	return images;
}
/** Heuristic PNG/JPEG dimension probe for the durable ref metadata. */
function detectDimensions(bytes) {
	if (bytes.length >= 24 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
		const width = (bytes[16] ?? 0) << 24 | (bytes[17] ?? 0) << 16 | (bytes[18] ?? 0) << 8 | (bytes[19] ?? 0);
		const height = (bytes[20] ?? 0) << 24 | (bytes[21] ?? 0) << 16 | (bytes[22] ?? 0) << 8 | (bytes[23] ?? 0);
		return {
			width: width > 0 ? width : 1024,
			height: height > 0 ? height : 1024
		};
	}
	if (bytes.length >= 8 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] !== void 0) {
		const width = (bytes[6] ?? 0) << 8 | (bytes[7] ?? 0);
		const height = (bytes[4] ?? 0) << 8 | (bytes[5] ?? 0);
		return {
			width: width > 0 ? width : 1024,
			height: height > 0 ? height : 1024
		};
	}
	return {
		width: 1024,
		height: 1024
	};
}
/** Real async image-generation jobs and durable gallery over DSH providers, credentials, and attachments. */
var PaintingService = class extends Service {
	static inject = [
		"settings",
		"credentials",
		"llm",
		"attachments"
	];
	typertRemote = bindTypertRemote(this, "controlCenterPainting");
	jobs = /* @__PURE__ */ new Map();
	history = /* @__PURE__ */ new Map();
	accepting = true;
	constructor(ctx) {
		super(ctx, "controlCenterPainting");
		markPaintingRemoteMethods(this);
		ctx.effect(() => async () => {
			this.accepting = false;
			for (const job of this.jobs.values()) job.controller.abort();
			await Promise.allSettled([...this.jobs.values()].map((job) => job.task));
			this.jobs.clear();
		}, "control-center.painting: settle jobs");
	}
	async catalog() {
		const llm = this.ctx.get("llm");
		const directory = llm.listConfigurableProviders();
		const models = [];
		for (const provider of directory) try {
			const listed = await llm.listModels(provider.provider);
			for (const model of listed) models.push({
				providerId: provider.provider,
				id: model.id,
				label: model.name
			});
		} catch {}
		return {
			models,
			errors: []
		};
	}
	start(request) {
		if (!this.accepting) throw new Error("painting service is stopping");
		const resolved = {
			providerId: (request.providerId ?? "").trim(),
			model: (request.model ?? "").trim(),
			prompt: assertPrompt(request.prompt),
			params: request.params === void 0 ? {} : structuredClone(request.params),
			sampleCount: sampleCountOf(request.sampleCount ?? DEFAULT_SAMPLES)
		};
		if (resolved.providerId.length === 0 || resolved.model.length === 0) throw new Error("painting provider and model are required");
		const now = Date.now();
		const jobId = `painting-${randomUUID()}`;
		const controller = new AbortController();
		const mutable = {
			view: {
				jobId,
				status: "running",
				providerId: resolved.providerId,
				model: resolved.model,
				prompt: resolved.prompt,
				params: structuredClone(resolved.params),
				sampleCount: resolved.sampleCount,
				progress: 0,
				createdImages: [],
				createdAt: now,
				updatedAt: now
			},
			controller,
			task: Promise.resolve()
		};
		this.jobs.set(jobId, mutable);
		mutable.task = this.run(mutable, resolved);
		return { jobId };
	}
	get(jobId) {
		const job = this.jobs.get(jobId);
		if (job === void 0) throw new Error(`unknown painting job "${jobId}"`);
		return cloneJob(job.view);
	}
	cancel(jobId) {
		const job = this.jobs.get(jobId);
		if (job === void 0) throw new Error(`unknown painting job "${jobId}"`);
		if (job.view.status === "running") job.controller.abort();
		return cloneJob(job.view);
	}
	listHistory(cursor, limit) {
		const bounded = Math.min(MAX_HISTORY_PAGE, Math.max(1, Math.trunc(limit)));
		const ordered = [...this.history.values()].sort((left, right) => right.createdAt - left.createdAt);
		const offset = cursor === null ? 0 : Number.parseInt(cursor, 10);
		if (!Number.isSafeInteger(offset) || offset < 0) throw new Error("invalid painting history cursor");
		const items = ordered.slice(offset, offset + bounded).map((item) => structuredClone(item));
		const next = offset + items.length;
		return {
			items,
			...next < ordered.length ? { nextCursor: String(next) } : {}
		};
	}
	deleteHistory(id) {
		this.history.delete(id);
		return { absent: true };
	}
	async run(job, request) {
		try {
			const settings = this.ctx.get("settings");
			const credentials = this.ctx.get("credentials");
			const llm = this.ctx.get("llm");
			const attachments = this.ctx.get("attachments");
			const provider = await resolveProvider(settings, llm, request.providerId);
			const apiKey = await resolveKey(settings, credentials, request.providerId, provider.settingsNs, provider.settingsPath);
			job.view.progress = .1;
			const generated = await callImageGeneration(provider.baseURL, apiKey, request.model, request.prompt, request.params, job.controller.signal, (fraction) => {
				job.view.progress = fraction;
				job.view.updatedAt = Date.now();
			});
			if (job.controller.signal.aborted) {
				job.view.status = "cancelled";
				return;
			}
			const refs = [];
			for (const image of generated.slice(0, request.sampleCount)) {
				const ref = await attachments.saveImage({
					data: image.data,
					mediaType: image.mediaType,
					name: `${request.model}.png`
				});
				refs.push({
					attachmentId: ref.attachmentId,
					mediaType: ref.mediaType,
					bytes: ref.bytes,
					width: ref.width,
					height: ref.height,
					dataUrl: `data:${ref.mediaType};base64,${Buffer.from(image.data).toString("base64")}`
				});
			}
			job.view.progress = 1;
			job.view.createdImages = refs;
			job.view.status = "completed";
			const id = `painting-history-${randomUUID()}`;
			const item = {
				id,
				prompt: request.prompt,
				model: request.model,
				providerId: request.providerId,
				images: structuredClone(refs),
				createdAt: Date.now()
			};
			this.history.set(id, item);
			job.view.historyId = id;
		} catch (error) {
			job.view.status = job.controller.signal.aborted ? "cancelled" : "error";
			if (job.view.status === "error") job.view.error = error instanceof Error ? error.message : String(error);
		} finally {
			job.view.updatedAt = Date.now();
		}
	}
};
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
const inject = ["typert"];
/** Reject incompatible DSH packages, then restore the onboarding namespace. */
function apply(ctx) {
	assertCompatibleDsh();
	new TranslationService(ctx);
	new PaintingService(ctx);
	const contributions = [{
		package: "@dsh-control-center/control-center",
		face: "host",
		schemas: [],
		model: {
			services: [],
			events: [],
			objects: []
		},
		invocations: [...translationRemote.descriptors, ...paintingRemote.descriptors]
	}];
	for (const contribution of contributions) ctx.typert.register(contribution);
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE), OnboardingSettingsSchema);
	});
}
//#endregion
export { PaintingService, TranslationService, apply, assertCompatibleDsh, assertSecretSchemaSafe, auditSecretSchema, inject, name };
