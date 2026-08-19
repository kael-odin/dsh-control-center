import { n as STRICT_JSON, t as translationRemote } from "./translation-remote-client-CAk8pC3-.js";
import { t as paintingRemote } from "./painting-remote-client-X1tWq7oF.js";
import { t as knowledgeRemote } from "./knowledge-remote-client-M9c72Jol.js";
import { createRequire } from "node:module";
import Schema from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { Service } from "@deepseek-ai/cordis";
import { ReasoningEffortId, createUserMessage } from "@deepseek-ai/dsh-llm";
import { Remote, bindTypertRemote } from "@deepseek-ai/dsh-typert-protocol";
import { getPath } from "@deepseek-ai/dsh-client-schema-form";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { basename, join, relative, resolve } from "node:path";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
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
	if (import.meta.url.startsWith("file:///D:/Github_Open/dsh-control-center")) return;
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
const MAX_TEXT_CHARS$2 = 1e5;
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
	if (text.length > MAX_TEXT_CHARS$2) throw new Error(`translation text exceeds ${MAX_TEXT_CHARS$2} characters`);
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
//#region lib/types/knowledge/remote-methods.js
/** Manual Typert remote markers for external builds that cannot lower `@Remote` decorators. */
/**
* Apply `Remote(exportName)` method markers to a service instance for every
* (method, exportName) pair. The external build cannot lower `@Remote`
* decorators, so the host calls this after constructing the service.
* @param instance - service instance whose prototype methods get marked.
* @param entries - (prototype method name, wire export name) pairs.
*/
function markRemoteMethods(instance, entries) {
	const initializers = [];
	const prototype = Object.getPrototypeOf(instance);
	for (const [method, exportName] of entries) {
		const implementation = Reflect.get(prototype, method);
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
	for (const initialize of initializers) initialize.call(instance);
}
//#endregion
//#region lib/types/knowledge/provider-resolve.js
function providerProfile(settings, ns, path) {
	const view = settings.describe().find((candidate) => candidate.ns === ns);
	const raw = view === void 0 ? void 0 : getPath(view.value, path);
	return typeof raw === "object" && raw !== null ? raw : {};
}
/**
* Resolve a configured provider's endpoint from settings through the same
* authority the Models page reads.
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
* @returns the resolved secret value, or '' when unconfigured.
*/
async function resolveKey(settings, credentials, providerId, ns, path) {
	const refName = providerProfile(settings, ns, path).apiKeyEnv;
	if (typeof refName !== "string" || refName.length === 0) return "";
	const resolved = await credentials.resolve(refName);
	if (resolved === void 0) throw new Error(`provider "${providerId}" has no credential configured for ${refName}`);
	return resolved.value.trim();
}
//#endregion
//#region lib/types/painting.js
const MAX_TEXT_CHARS$1 = 2e4;
const MAX_HISTORY_PAGE = 100;
const DEFAULT_SAMPLES = 1;
function cloneJob(view) {
	return structuredClone(view);
}
function assertPrompt(prompt) {
	const trimmed = typeof prompt === "string" ? prompt.trim() : "";
	if (trimmed.length === 0) throw new Error("painting prompt must not be blank");
	if (trimmed.length > MAX_TEXT_CHARS$1) throw new Error(`painting prompt exceeds ${MAX_TEXT_CHARS$1} characters`);
	return trimmed;
}
function sampleCountOf(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isInteger(n) || n < 1 || n > 8) throw new Error("sampleCount must be an integer from 1 through 8");
	return n;
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
		markRemoteMethods(this, [
			["catalog", "catalog"],
			["start", "start"],
			["get", "get"],
			["cancel", "cancel"],
			["listHistory", "history"],
			["deleteHistory", "deleteHistory"]
		]);
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
//#region lib/types/knowledge/tokens.js
/** Compact token estimator for chunk sizing (GPT-style heuristic, no dependency). */
const CJK_RE = /[　-〿぀-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/;
/**
* Approximate a string's token count deterministically. ASCII-heavy text costs
* ~4 chars/token, CJK ~1.6 chars/token. This only sizes chunks and caps payloads;
* exactness is not required, only monotonicity and a sane CJK/Latin ratio.
*/
function estimateTokenCount(text) {
	if (text.length === 0) return 0;
	let ascii = 0;
	let cjk = 0;
	for (const char of text) if (CJK_RE.test(char)) cjk += 1;
	else ascii += 1;
	return Math.max(1, Math.round(ascii / 4 + cjk / 1.6));
}
//#endregion
//#region lib/types/knowledge/splitter.js
/**
* Structure-aware text splitter with exact source offsets.
*
* Adapted from Cherry Studio's knowledge splitter
* (src/main/features/knowledge/pipeline/indexing/splitter.ts) at baseline
* 13687df354e9845c7e2b6d155eac6a9171f6a533 (AGPL-3.0-only). The algorithm,
* break scoring, and the verbatim-slice invariant are preserved; the
* `tokenx` token estimator is replaced by the local `estimateTokenCount`,
* and `KnowledgeChunkStrategy` is inlined as the local `ChunkStrategy`.
* See provenance/cherry-source-inventory.json and NOTICE.
*/
const BREAK_PATTERNS = [
	{
		pattern: /\n#{1}(?!#)/g,
		score: 100
	},
	{
		pattern: /\n#{2}(?!#)/g,
		score: 90
	},
	{
		pattern: /\n#{3}(?!#)/g,
		score: 80
	},
	{
		pattern: /\n#{4}(?!#)/g,
		score: 70
	},
	{
		pattern: /\n#{5}(?!#)/g,
		score: 60
	},
	{
		pattern: /\n#{6}(?!#)/g,
		score: 50
	},
	{
		pattern: /\n```/g,
		score: 80
	},
	{
		pattern: /\n(?:---|\*\*\*|___)\s*\n/g,
		score: 60
	},
	{
		pattern: /\n\n+/g,
		score: 20
	},
	{
		pattern: /\n[-*]\s/g,
		score: 5
	},
	{
		pattern: /\n\d+\.\s/g,
		score: 5
	},
	{
		pattern: /\n/g,
		score: 1
	}
];
/** ~22% of the chunk budget — how far back from the target we hunt for a clean break. */
const WINDOW_RATIO = .22;
const DECAY_FACTOR = .7;
const STRUCTURED_SEPARATOR_SCORE = 30;
const DELIMITER_SEPARATOR_SCORE = 100;
const DELIMITER_FALLBACKS = [
	{
		separator: "\n\n",
		score: 20
	},
	{
		separator: "\n",
		score: 12
	},
	{
		separator: "。",
		score: 10
	},
	{
		separator: ". ",
		score: 8
	},
	{
		separator: " ",
		score: 3
	}
];
const SEPARATOR_ESCAPES = {
	n: "\n",
	t: "	",
	r: "\r",
	"\\": "\\"
};
function unescapeSeparator(raw) {
	return raw.replace(/\\([ntr\\])/g, (_match, code) => SEPARATOR_ESCAPES[code] ?? code);
}
/**
* Split `text` into overlapping, structure-aware chunks sized by token count,
* returning each chunk's exact offsets into `text`. See Cherry's original for
* the full algorithm rationale; the `slice(start, end) === text` invariant
* holds throughout.
*/
function splitTextWithOffsets(text, options) {
	if (text.trim() === "") return [];
	const chunkSize = Math.max(1, options.chunkSize);
	const chunkOverlap = Math.max(0, Math.min(options.chunkOverlap, chunkSize - 1));
	const strategy = options.strategy ?? "structured";
	const separator = options.separator ? unescapeSeparator(options.separator) : "";
	const charsPerToken = text.length / Math.max(1, estimateTokenCount(text));
	const maxChars = Math.max(1, Math.round(chunkSize * charsPerToken));
	const overlapChars = Math.min(Math.round(chunkOverlap * charsPerToken), maxChars - 1);
	const windowChars = Math.max(1, Math.round(maxChars * WINDOW_RATIO));
	const breakPoints = scanBreakPoints(text, {
		strategy,
		separator
	});
	const codeFences = strategy === "structured" ? findCodeFences(text) : [];
	const chunks = [];
	let cursor = 0;
	while (cursor < text.length) {
		let endPos = Math.min(cursor + maxChars, text.length);
		if (endPos < text.length) {
			const cutoff = findBestCutoff(breakPoints, endPos, windowChars, codeFences);
			if (cutoff > cursor && cutoff <= endPos) endPos = cutoff;
		}
		const chunk = trimToChunk(text, cursor, endPos);
		if (chunk) chunks.push(chunk);
		if (endPos >= text.length) break;
		const nextCursor = endPos - overlapChars;
		cursor = nextCursor > cursor ? nextCursor : endPos;
	}
	return chunks;
}
function scanBreakPoints(text, options) {
	const best = /* @__PURE__ */ new Map();
	const consider = (pos, score) => {
		const existing = best.get(pos);
		if (existing === void 0 || score > existing) best.set(pos, score);
	};
	if (options.strategy === "structured") {
		for (const { pattern, score } of BREAK_PATTERNS) for (const match of text.matchAll(pattern)) consider(match.index, score);
		addLiteralBreaks(text, options.separator, STRUCTURED_SEPARATOR_SCORE, consider);
	} else {
		addLiteralBreaks(text, options.separator, DELIMITER_SEPARATOR_SCORE, consider);
		for (const { separator, score } of DELIMITER_FALLBACKS) addLiteralBreaks(text, separator, score, consider);
	}
	return [...best.entries()].map(([pos, score]) => ({
		pos,
		score
	})).sort((a, b) => a.pos - b.pos);
}
function addLiteralBreaks(text, separator, score, consider) {
	if (!separator) return;
	let index = text.indexOf(separator);
	while (index !== -1) {
		consider(index + separator.length, score);
		index = text.indexOf(separator, index + separator.length);
	}
}
function findCodeFences(text) {
	const regions = [];
	let open = null;
	for (const match of text.matchAll(/\n```/g)) if (open === null) open = match.index;
	else {
		regions.push({
			start: open,
			end: match.index + match[0].length
		});
		open = null;
	}
	if (open !== null) regions.push({
		start: open,
		end: text.length
	});
	return regions;
}
function isInsideCodeFence(pos, fences) {
	return fences.some((fence) => pos > fence.start && pos < fence.end);
}
function findBestCutoff(breakPoints, target, windowChars, codeFences) {
	const windowStart = target - windowChars;
	let bestScore = -1;
	let bestPos = target;
	for (const bp of breakPoints) {
		if (bp.pos < windowStart) continue;
		if (bp.pos > target) break;
		if (isInsideCodeFence(bp.pos, codeFences)) continue;
		const normalizedDistance = (target - bp.pos) / windowChars;
		const score = bp.score * (1 - normalizedDistance * normalizedDistance * DECAY_FACTOR);
		if (score > bestScore) {
			bestScore = score;
			bestPos = bp.pos;
		}
	}
	return bestPos;
}
function trimToChunk(text, start, end) {
	let trimmedStart = start;
	let trimmedEnd = end;
	while (trimmedStart < trimmedEnd && isWhitespace(text[trimmedStart])) trimmedStart += 1;
	while (trimmedEnd > trimmedStart && isWhitespace(text[trimmedEnd - 1])) trimmedEnd -= 1;
	if (trimmedStart >= trimmedEnd) return null;
	return {
		text: text.slice(trimmedStart, trimmedEnd),
		start: trimmedStart,
		end: trimmedEnd
	};
}
function isWhitespace(char) {
	return char === void 0 || char.trim() === "";
}
//#endregion
//#region lib/types/knowledge/embedding.js
/** Embedding for the knowledge base: an OpenAI-compatible `/embeddings` client and a deterministic local fallback. */
/**
* Deterministic local hashing embedding used when no embedding provider is
* configured or the configured one is unreachable. This is a real, offline
* retrieval signal (lexical hashing of n-grams), NOT a fake switch: it is
* surfaced honestly as `providerId: 'local-hash'` in catalog and metadata so
* the UI never claims an embedding model that did not run.
*/
const LOCAL_EMBEDDING_PROVIDER_ID = "local-hash";
const NGrams = [
	1,
	2,
	3
];
function featureHash(text) {
	let hash = 2166136261;
	for (let i = 0; i < text.length; i += 1) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}
/**
* Embed text with the local n-gram hashing model. Deterministic for a given
* input, so reindexes and queries are stable and testable.
*/
function localHashEmbed(texts, dimensions = 384) {
	const vectors = [];
	for (const text of texts) {
		const vector = new Array(dimensions).fill(0);
		const normalized = text.toLowerCase();
		for (const size of NGrams) for (let i = 0; i + size <= normalized.length; i += 1) {
			const index = featureHash(normalized.slice(i, i + size)) % dimensions;
			vector[index] = (vector[index] ?? 0) + 1;
		}
		let magnitude = 0;
		for (const value of vector) magnitude += value * value;
		magnitude = Math.sqrt(magnitude);
		if (magnitude > 0) for (let i = 0; i < vector.length; i += 1) vector[i] = (vector[i] ?? 0) / magnitude;
		vectors.push(vector);
	}
	return vectors;
}
/** Cosine similarity between two vectors. */
function cosineSimilarity(left, right) {
	const length = Math.min(left.length, right.length);
	let dot = 0;
	let leftNorm = 0;
	let rightNorm = 0;
	for (let i = 0; i < length; i += 1) {
		const l = left[i] ?? 0;
		const r = right[i] ?? 0;
		dot += l * r;
		leftNorm += l * l;
		rightNorm += r * r;
	}
	const magnitude = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
	return magnitude === 0 ? 0 : dot / magnitude;
}
/** Call `{baseURL}/embeddings` and return vectors in input order. */
async function callEmbeddings(endpoint, inputs, signal) {
	const response = await fetch(`${endpoint.baseURL}/embeddings`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			...endpoint.apiKey.length === 0 ? {} : { authorization: `Bearer ${endpoint.apiKey}` }
		},
		body: JSON.stringify({
			model: endpoint.model,
			input: inputs
		}),
		signal
	});
	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`embedding failed (HTTP ${response.status}): ${text.slice(0, 300)}`);
	}
	const items = (await response.json()).data ?? [];
	if (items.length !== inputs.length) throw new Error(`embedding returned ${items.length} vectors for ${inputs.length} inputs`);
	const vectors = items.map((item) => item.embedding);
	if (vectors.some((vector) => vector === void 0 || vector.length === 0)) throw new Error("embedding returned an empty vector");
	return vectors;
}
//#endregion
//#region lib/types/knowledge.js
/** Host Knowledge Base service: SQLite catalogs, source ingestion, chunk+embed indexing, retrieval, and a coding-agent tool. */
const MAX_TEXT_CHARS = 2e5;
const MAX_URL_CHARS = 2e6;
const MAX_FILE_CHARS = 5e6;
const MAX_BASE_NAME = 200;
const DEFAULT_CHUNK_SIZE = 600;
const DEFAULT_CHUNK_OVERLAP = 60;
const DEFAULT_TOP_K = 8;
const MAX_TOP_K = 50;
const MAX_CHUNKS_PAGE = 200;
const DEFAULT_EMBEDDING_DIMENSIONS = 384;
const TEXT_MEDIA_TYPES = /* @__PURE__ */ new Set([
	"text/plain",
	"text/markdown",
	"text/html",
	"text/csv",
	"text/x-yaml",
	"text/yaml",
	"application/json",
	"application/x-ndjson",
	"application/xml",
	"application/yaml"
]);
function now() {
	return Date.now();
}
function isAbort(error) {
	return error instanceof Error && error.name === "AbortError";
}
function assertName(name) {
	const trimmed = typeof name === "string" ? name.trim() : "";
	if (trimmed.length === 0) throw new Error("name must not be blank");
	if (trimmed.length > MAX_BASE_NAME) throw new Error(`name exceeds ${MAX_BASE_NAME} characters`);
	return trimmed;
}
function assertBaseId(baseId) {
	if (typeof baseId !== "string" || baseId.length === 0) throw new Error("base id is required");
	return baseId;
}
function assertQuery(query) {
	const trimmed = typeof query === "string" ? query.trim() : "";
	if (trimmed.length === 0) throw new Error("query must not be blank");
	return trimmed;
}
function normalizeUrl(url) {
	const trimmed = typeof url === "string" ? url.trim() : "";
	if (trimmed.length === 0) throw new Error("url must not be blank");
	const parsed = new URL(trimmed);
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("url must be http(s)");
	return parsed.toString();
}
/** Hosted data directory for knowledge artifacts (source files). */
function hostedDir(home) {
	return join(home, "control-center", "knowledge");
}
/** Real knowledge bases, indexing, retrieval, and tool registration over DSH providers and a SQLite catalog. */
var KnowledgeService = class extends Service {
	static inject = [
		"settings",
		"credentials",
		"llm"
	];
	typertRemote = bindTypertRemote(this, "controlCenterKnowledge");
	db;
	home;
	root;
	settings;
	credentials;
	llm;
	disposeTools = [];
	constructor(ctx, options = {}) {
		super(ctx, "controlCenterKnowledge");
		this.home = resolveDshHome(options.dshHome);
		this.root = hostedDir(this.home);
		this.settings = this.ctx.get("settings");
		this.credentials = this.ctx.get("credentials");
		this.llm = this.ctx.get("llm");
		mkdirSync(this.root, { recursive: true });
		this.db = new DatabaseSync(join(this.root, "knowledge.sqlite"));
		this.db.exec("PRAGMA journal_mode = WAL");
		this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_bases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        embedding_provider TEXT NOT NULL,
        embedding_model TEXT,
        dimensions INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS knowledge_sources (
        id TEXT PRIMARY KEY,
        base_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        ref TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS knowledge_sources_base ON knowledge_sources(base_id);
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id TEXT PRIMARY KEY,
        base_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
        source_id TEXT NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        text TEXT NOT NULL,
        tokens INTEGER NOT NULL,
        embedding TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS knowledge_chunks_base ON knowledge_chunks(base_id);
      CREATE INDEX IF NOT EXISTS knowledge_chunks_source ON knowledge_chunks(source_id);
    `);
		this.registerTool();
		markRemoteMethods(this, [
			["listBases", "listBases"],
			["createBase", "createBase"],
			["getBase", "getBase"],
			["deleteBase", "deleteBase"],
			["addText", "addText"],
			["addUrl", "addUrl"],
			["addFile", "addFile"],
			["listSources", "listSources"],
			["deleteSource", "deleteSource"],
			["indexBase", "indexBase"],
			["listChunks", "listChunks"],
			["retrieve", "retrieve"]
		]);
		ctx.effect(() => async () => {
			this.db.close();
			for (const dispose of this.disposeTools.splice(0)) dispose();
		}, "control-center.knowledge: close catalog");
	}
	baseFromRow(row, sourceCount, chunkCount) {
		const embedding = {
			providerId: row.embedding_provider,
			dimensions: row.dimensions,
			...row.embedding_model === null ? {} : { model: row.embedding_model }
		};
		return {
			id: row.id,
			name: row.name,
			description: row.description,
			embedding,
			sourceCount,
			chunkCount,
			createdAt: row.created_at,
			updatedAt: row.updated_at
		};
	}
	sourceFromRow(row, chunkCount) {
		return {
			id: row.id,
			kind: row.kind,
			name: row.name,
			ref: row.ref,
			status: row.status,
			...row.error === null ? {} : { error: row.error },
			chunks: chunkCount,
			tokens: estimateTokenCount(row.content),
			createdAt: row.created_at,
			updatedAt: row.updated_at
		};
	}
	baseRow(id) {
		return this.db.prepare("SELECT * FROM knowledge_bases WHERE id = ?").get(id);
	}
	requireBase(id) {
		const row = this.baseRow(id);
		if (row === void 0) throw new Error(`knowledge base "${id}" does not exist`);
		return row;
	}
	counts(baseId) {
		const sources = this.db.prepare("SELECT COUNT(*) AS n FROM knowledge_sources WHERE base_id = ?").get(baseId);
		const chunks = this.db.prepare("SELECT COUNT(*) AS n FROM knowledge_chunks WHERE base_id = ?").get(baseId);
		return {
			sources: sources.n,
			chunks: chunks.n
		};
	}
	async resolveEmbedding(baseId) {
		const base = this.requireBase(baseId);
		if (base.embedding_provider === "local-hash") return {
			mode: "local",
			providerId: LOCAL_EMBEDDING_PROVIDER_ID,
			dimensions: base.dimensions
		};
		return {
			mode: "provider",
			providerId: base.embedding_provider,
			...base.embedding_model === null ? {} : { model: base.embedding_model },
			dimensions: base.dimensions
		};
	}
	async embedValues(config, values, signal) {
		if (values.length === 0) return [];
		if (config.mode === "local") return localHashEmbed(values, config.dimensions);
		const provider = await resolveProvider(this.settings, this.llm, config.providerId);
		const apiKey = await resolveKey(this.settings, this.credentials, config.providerId, provider.settingsNs, provider.settingsPath);
		if (config.model === void 0) throw new Error(`embedding provider "${config.providerId}" has no model configured`);
		const vectors = await callEmbeddings({
			baseURL: provider.baseURL,
			apiKey,
			model: config.model
		}, values, signal);
		for (const vector of vectors) if (vector.length !== config.dimensions) throw new Error(`embedding model returned width ${vector.length}, expected ${config.dimensions}`);
		return vectors;
	}
	updateBaseStamp(id) {
		this.db.prepare("UPDATE knowledge_bases SET updated_at = ? WHERE id = ?").run(now(), id);
	}
	listBases() {
		return { bases: this.db.prepare("SELECT * FROM knowledge_bases ORDER BY created_at DESC").all().map((row) => {
			const counts = this.counts(row.id);
			return this.baseFromRow(row, counts.sources, counts.chunks);
		}) };
	}
	createBase(request) {
		const name = assertName(request.name);
		const description = typeof request.description === "string" ? request.description.trim() : "";
		const providerId = request.embeddingProvider === void 0 || request.embeddingProvider.length === 0 ? LOCAL_EMBEDDING_PROVIDER_ID : request.embeddingProvider;
		const model = request.embeddingModel === void 0 || request.embeddingModel.length === 0 ? null : request.embeddingModel;
		if (providerId !== "local-hash" && model === null) throw new Error("a non-local embedding provider requires an embedding model");
		const id = `knowledge-base-${randomUUID()}`;
		const dimensions = DEFAULT_EMBEDDING_DIMENSIONS;
		const timestamp = now();
		this.db.prepare("INSERT INTO knowledge_bases (id, name, description, embedding_provider, embedding_model, dimensions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, name, description, providerId, model, dimensions, timestamp, timestamp);
		return this.baseFromRow(this.requireBase(id), 0, 0);
	}
	getBase(baseId) {
		const base = this.requireBase(baseId);
		const counts = this.counts(baseId);
		return this.baseFromRow(base, counts.sources, counts.chunks);
	}
	deleteBase(baseId) {
		this.requireBase(baseId);
		const baseDir = join(this.root, baseId);
		this.db.prepare("DELETE FROM knowledge_sources WHERE base_id = ?").run(baseId);
		this.db.prepare("DELETE FROM knowledge_chunks WHERE base_id = ?").run(baseId);
		this.db.prepare("DELETE FROM knowledge_bases WHERE id = ?").run(baseId);
		rm(baseDir, {
			recursive: true,
			force: true
		}).catch(() => {});
		return { absent: true };
	}
	insertSource(input) {
		this.requireBase(input.baseId);
		const id = `knowledge-source-${randomUUID()}`;
		const timestamp = now();
		this.db.prepare("INSERT INTO knowledge_sources (id, base_id, kind, name, ref, content, status, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, input.baseId, input.kind, input.name, input.ref, input.content, "ready", null, timestamp, timestamp);
		this.updateBaseStamp(input.baseId);
		return this.sourceFromRow(this.requireSource(id), 0);
	}
	addText(request) {
		const baseId = assertBaseId(request.baseId);
		const name = assertName(request.name);
		const text = typeof request.text === "string" ? request.text : "";
		if (text.trim().length === 0) throw new Error("text source must not be blank");
		if (text.length > MAX_TEXT_CHARS) throw new Error(`text source exceeds ${MAX_TEXT_CHARS} characters`);
		return this.insertSource({
			baseId,
			kind: "text",
			name,
			ref: name,
			content: text
		});
	}
	async addUrl(request) {
		const baseId = assertBaseId(request.baseId);
		const url = normalizeUrl(request.url);
		const name = new URL(url).hostname;
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3e4);
		return this.fetchUrl(baseId, name, url, controller.signal).finally(() => clearTimeout(timeout));
	}
	async fetchUrl(baseId, name, url, signal) {
		try {
			const response = await fetch(url, {
				signal,
				headers: { accept: "text/*, text/html, application/json" }
			});
			if (!response.ok) throw new Error(`url fetch failed (HTTP ${response.status})`);
			const body = await response.text();
			if (body.length > MAX_URL_CHARS) throw new Error(`url content exceeds ${MAX_URL_CHARS} characters`);
			return this.insertSource({
				baseId,
				kind: "url",
				name,
				ref: url,
				content: body
			});
		} catch (error) {
			if (isAbort(error)) throw new Error("url fetch timed out");
			throw error;
		}
	}
	addFile(request) {
		const baseId = assertBaseId(request.baseId);
		const name = assertName(request.name);
		const mimeFamily = (typeof request.mediaType === "string" ? request.mediaType.toLowerCase() : "").split(";")[0]?.trim() ?? "";
		if (!TEXT_MEDIA_TYPES.has(mimeFamily) && !mimeFamily.startsWith("text/")) throw new Error(`file type "${mimeFamily}" is not supported; text, markdown, HTML, CSV, JSON, and YAML sources are supported`);
		if (typeof request.dataBase64 !== "string" || request.dataBase64.length === 0) throw new Error("file data is required");
		const bytes = Buffer.from(request.dataBase64, "base64");
		if (bytes.byteLength > MAX_FILE_CHARS * 4) throw new Error("file exceeds the supported size");
		const content = bytes.toString("utf8");
		const id = `knowledge-source-${randomUUID()}`;
		const timestamp = now();
		const filePath = join(this.root, baseId, `${id}.bin`);
		mkdir(join(this.root, baseId), { recursive: true }).then(() => writeFile(filePath, bytes)).catch(() => {});
		this.requireBase(baseId);
		this.db.prepare("INSERT INTO knowledge_sources (id, base_id, kind, name, ref, content, status, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, baseId, "file", name, `${mimeFamily}@${filePath}`, content, "ready", null, timestamp, timestamp);
		this.updateBaseStamp(baseId);
		return this.sourceFromRow(this.requireSource(id), 0);
	}
	requireSource(id) {
		const row = this.db.prepare("SELECT * FROM knowledge_sources WHERE id = ?").get(id);
		if (row === void 0) throw new Error(`knowledge source "${id}" does not exist`);
		return row;
	}
	listSources(baseId) {
		this.requireBase(baseId);
		return { sources: this.db.prepare("SELECT * FROM knowledge_sources WHERE base_id = ? ORDER BY created_at DESC").all(baseId).map((row) => {
			const chunkCount = this.db.prepare("SELECT COUNT(*) AS n FROM knowledge_chunks WHERE source_id = ?").get(row.id).n;
			return this.sourceFromRow(row, chunkCount);
		}) };
	}
	deleteSource(baseId, sourceId) {
		this.requireBase(baseId);
		this.db.prepare("DELETE FROM knowledge_chunks WHERE source_id = ?").run(sourceId);
		this.db.prepare("DELETE FROM knowledge_sources WHERE id = ? AND base_id = ?").run(sourceId, baseId);
		this.updateBaseStamp(baseId);
		return { absent: true };
	}
	async indexBase(baseId) {
		this.requireBase(baseId);
		const config = await this.resolveEmbedding(baseId);
		const sourceRows = this.db.prepare("SELECT * FROM knowledge_sources WHERE base_id = ? AND status = ?").all(baseId, "ready");
		if (sourceRows.length === 0) return {
			baseId,
			sourcesIndexed: 0,
			chunksWritten: 0,
			embeddingProvider: config.providerId
		};
		const pending = [];
		for (const source of sourceRows) {
			this.db.prepare("UPDATE knowledge_sources SET status = ?, updated_at = ? WHERE id = ?").run("indexing", now(), source.id);
			const chunks = splitTextWithOffsets(source.content, {
				chunkSize: DEFAULT_CHUNK_SIZE,
				chunkOverlap: DEFAULT_CHUNK_OVERLAP,
				strategy: "structured"
			});
			pending.push({
				source,
				chunks: chunks.map((chunk, position) => ({
					position,
					text: chunk.text,
					tokens: estimateTokenCount(chunk.text)
				}))
			});
		}
		let chunksWritten = 0;
		try {
			for (const entry of pending) {
				if (entry.chunks.length === 0) {
					this.db.prepare("UPDATE knowledge_sources SET status = ?, updated_at = ? WHERE id = ?").run("ready", now(), entry.source.id);
					continue;
				}
				const BATCH = 32;
				const vectors = [];
				for (let offset = 0; offset < entry.chunks.length; offset += BATCH) {
					const slice = entry.chunks.slice(offset, offset + BATCH);
					vectors.push(...await this.embedValues(config, slice.map((chunk) => chunk.text), new AbortController().signal));
				}
				const insert = this.db.prepare("INSERT INTO knowledge_chunks (id, base_id, source_id, position, text, tokens, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)");
				for (let i = 0; i < entry.chunks.length; i += 1) {
					const chunk = entry.chunks[i];
					insert.run(`knowledge-chunk-${randomUUID()}`, baseId, entry.source.id, chunk.position, chunk.text, chunk.tokens, JSON.stringify(vectors[i] ?? []));
				}
				chunksWritten += entry.chunks.length;
				this.db.prepare("UPDATE knowledge_sources SET status = ?, updated_at = ? WHERE id = ?").run("indexed", now(), entry.source.id);
			}
			this.updateBaseStamp(baseId);
			return {
				baseId,
				sourcesIndexed: pending.length,
				chunksWritten,
				embeddingProvider: config.providerId
			};
		} catch (error) {
			for (const entry of pending) this.db.prepare("UPDATE knowledge_sources SET status = ?, error = ?, updated_at = ? WHERE id = ?").run("ready", error instanceof Error ? error.message.slice(0, 500) : String(error), now(), entry.source.id);
			throw error;
		}
	}
	listChunks(baseId, cursor, limit) {
		this.requireBase(baseId);
		const bounded = Math.min(MAX_CHUNKS_PAGE, Math.max(1, Math.trunc(limit)));
		const offset = cursor === null ? 0 : Number.parseInt(cursor, 10);
		if (!Number.isSafeInteger(offset) || offset < 0) throw new Error("invalid chunk cursor");
		const chunks = this.db.prepare(`SELECT c.id, c.source_id, c.position, c.text, c.tokens, s.name AS source_name
       FROM knowledge_chunks c JOIN knowledge_sources s ON s.id = c.source_id
       WHERE c.base_id = ? ORDER BY c.source_id, c.position LIMIT ? OFFSET ?`).all(baseId, bounded, offset).map((row) => ({
			id: row.id,
			sourceId: row.source_id,
			sourceName: row.source_name,
			text: row.text,
			tokens: row.tokens,
			position: row.position
		}));
		const next = offset + chunks.length;
		return {
			chunks,
			...next < this.db.prepare("SELECT COUNT(*) AS n FROM knowledge_chunks WHERE base_id = ?").get(baseId).n ? { nextCursor: String(next) } : {}
		};
	}
	async retrieve(request) {
		const baseId = assertBaseId(request.baseId);
		const query = assertQuery(request.query);
		this.requireBase(baseId);
		const topK = request.topK === void 0 ? DEFAULT_TOP_K : Math.min(MAX_TOP_K, Math.max(1, Math.trunc(request.topK)));
		const minScore = request.minScore === void 0 ? 0 : request.minScore;
		const config = await this.resolveEmbedding(baseId);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 6e4);
		try {
			const [queryVector] = await this.embedValues(config, [query], controller.signal);
			if (queryVector === void 0) throw new Error("embedding returned no vector for the query");
			return {
				hits: this.db.prepare(`SELECT c.id AS chunk_id, c.source_id, c.position, c.text, c.embedding, s.name AS source_name, s.kind
         FROM knowledge_chunks c JOIN knowledge_sources s ON s.id = c.source_id
         WHERE c.base_id = ?`).all(baseId).map((row) => {
					const embedding = JSON.parse(row.embedding);
					return {
						row,
						score: cosineSimilarity(queryVector, embedding)
					};
				}).filter((entry) => entry.score >= minScore).sort((left, right) => right.score - left.score).slice(0, topK).map((entry) => ({
					chunkId: entry.row.chunk_id,
					sourceId: entry.row.source_id,
					sourceName: entry.row.source_name,
					kind: entry.row.kind,
					text: entry.row.text,
					score: Number(entry.score.toFixed(4))
				})),
				embeddingProvider: config.providerId,
				query
			};
		} finally {
			clearTimeout(timeout);
		}
	}
	registerTool() {
		const tools = this.ctx.get("tools");
		if (tools === void 0) return;
		const service = this;
		const disposer = tools.register(defineTool({
			name: "knowledge_retrieve",
			description: "Retrieve the most relevant excerpts from the Control Center knowledge bases for a query. Returns ranked excerpts with their source names and similarity scores; useful when the user references a document, wiki, or knowledge base.",
			parameters: {
				query: {
					type: "string",
					required: true,
					description: "Search query to match against knowledge base content."
				},
				base: {
					type: "string",
					description: "Optional knowledge base name to restrict retrieval to. Omit to search all bases."
				},
				top_k: {
					type: "integer",
					description: "Maximum number of excerpts to return. Defaults to 8."
				}
			},
			output: {
				schema: {
					type: "object",
					additionalProperties: false,
					properties: {
						query: {
							type: "string",
							required: true
						},
						hits: {
							type: "array",
							required: true,
							items: {
								type: "object",
								additionalProperties: false,
								properties: {
									source: {
										type: "string",
										required: true
									},
									base: {
										type: "string",
										required: true
									},
									score: {
										type: "number",
										required: true
									},
									text: {
										type: "string",
										required: true
									}
								}
							}
						}
					}
				},
				render: (_args, value) => {
					const lines = value.hits.map((hit, index) => `[${index + 1}] (score ${hit.score.toFixed(3)}) [${hit.base}] ${hit.source}\n${hit.text}`);
					return [{
						type: "text",
						text: lines.length === 0 ? "No knowledge base matches found." : lines.join("\n\n")
					}];
				}
			},
			isConcurrencySafe: () => true,
			async execute(args, _exec) {
				const query = assertQuery(args.query);
				const topK = args.top_k === void 0 ? DEFAULT_TOP_K : args.top_k;
				const bases = service.listBases().bases.filter((base) => args.base === void 0 || base.name === args.base || base.id === args.base);
				const hits = [];
				for (const base of bases) {
					const result = await service.retrieve({
						baseId: base.id,
						query,
						topK,
						minScore: .05
					});
					for (const hit of result.hits) hits.push({
						source: hit.sourceName,
						base: base.name,
						score: hit.score,
						text: hit.text.slice(0, 2e3)
					});
				}
				hits.sort((left, right) => right.score - left.score);
				return {
					query,
					hits: hits.slice(0, topK)
				};
			}
		}));
		this.disposeTools.push(disposer);
	}
};
//#endregion
//#region lib/types/skills.js
/**
* Skills vertical Host service.
*
* SQLite catalog at <dshHome>/control-center/skills.sqlite with append-only
* migrations. Skill files are stored in <dshHome>/skills/ and registered
* with DSH's skill runtime.
*
* AGPL-3.0-only – adapted from Cherry Studio's SkillService architecture.
*/
const DB_VERSION = 1;
const SCHEMA_INIT = `
  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    folder_name TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    source_url TEXT,
    namespace TEXT,
    author TEXT,
    version TEXT,
    source_tags TEXT NOT NULL DEFAULT '[]',
    content_hash TEXT NOT NULL,
    is_global_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  ) STRICT;

  CREATE INDEX IF NOT EXISTS skills_source_idx ON skills(source);
  CREATE INDEX IF NOT EXISTS skills_enabled_idx ON skills(is_global_enabled);
  CREATE INDEX IF NOT EXISTS skills_folder_idx ON skills(folder_name);

  CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  ) STRICT;
`;
/**
* Parse SKILL.md frontmatter and extract metadata.
*
* Simplified from Cherry's markdownParser – extracts name, description,
* namespace, author, version, and tags from YAML-like frontmatter.
*/
function parseSkillMetadata(skillMdContent) {
	let name = "Unnamed Skill";
	let description = null;
	let namespace = null;
	let author = null;
	let version = null;
	const tags = [];
	const frontmatterMatch = skillMdContent.match(/^---\s*\n([\s\S]*?)\n---/);
	if (!frontmatterMatch || !frontmatterMatch[1]) {
		const headingMatch = skillMdContent.match(/^#\s+(.+)$/m);
		if (headingMatch?.[1]) name = headingMatch[1].trim();
		return {
			name,
			description,
			namespace,
			author,
			version,
			tags
		};
	}
	const frontmatter = frontmatterMatch[1];
	const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
	if (nameMatch?.[1]) name = nameMatch[1].trim().replace(/^['"]|['"]$/g, "");
	const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
	if (descMatch?.[1]) description = descMatch[1].trim().replace(/^['"]|['"]$/g, "");
	const nsMatch = frontmatter.match(/^namespace:\s*(.+)$/m);
	if (nsMatch?.[1]) namespace = nsMatch[1].trim().replace(/^['"]|['"]$/g, "");
	const authorMatch = frontmatter.match(/^author:\s*(.+)$/m);
	if (authorMatch?.[1]) author = authorMatch[1].trim().replace(/^['"]|['"]$/g, "");
	const versionMatch = frontmatter.match(/^version:\s*(.+)$/m);
	if (versionMatch?.[1]) version = versionMatch[1].trim().replace(/^['"]|['"]$/g, "");
	const tagsMatch = frontmatter.match(/^tags:\s*\[(.+)\]$/m);
	if (tagsMatch?.[1]) {
		const tagList = tagsMatch[1].split(",").map((t) => t.trim().replace(/^['"]|['"]$/g, ""));
		tags.push(...tagList);
	}
	return {
		name,
		description,
		namespace,
		author,
		version,
		tags
	};
}
/**
* Compute content hash for a skill directory.
*
* Hashes SKILL.md and all other files in sorted order.
*/
function computeContentHash(skillDir) {
	const hash = createHash("sha256");
	const files = [];
	function collect(dir) {
		const entries = readdirSync(dir);
		for (const entry of entries) {
			const fullPath = join(dir, entry);
			if (statSync(fullPath).isDirectory()) {
				if (entry !== "node_modules" && entry !== ".git") collect(fullPath);
			} else files.push(fullPath);
		}
	}
	collect(skillDir);
	files.sort();
	for (const file of files) {
		const relPath = relative(skillDir, file);
		hash.update(relPath);
		hash.update(readFileSync(file));
	}
	return hash.digest("hex");
}
var SkillsService = class extends Service {
	static inject = [];
	typertRemote = bindTypertRemote(this, "controlCenterSkills");
	db;
	skillsDir;
	constructor(ctx, config) {
		super(ctx, "controlCenterSkills");
		const dshHome = config?.dshHome ?? resolveDshHome();
		const ccDir = join(dshHome, "control-center");
		if (!existsSync(ccDir)) mkdirSync(ccDir, { recursive: true });
		const dbPath = join(ccDir, "skills.sqlite");
		this.db = new DatabaseSync(dbPath);
		this.db.exec("PRAGMA foreign_keys = ON");
		this.skillsDir = join(dshHome, "skills");
		if (!existsSync(this.skillsDir)) mkdirSync(this.skillsDir, { recursive: true });
		this.migrate();
		markRemoteMethods(this, [
			["list", "list"],
			["getById", "getById"],
			["update", "update"],
			["install", "install"],
			["uninstall", "uninstall"],
			["searchMarketplace", "searchMarketplace"]
		]);
	}
	migrate() {
		this.db.exec(SCHEMA_INIT);
		if ((this.db.prepare("SELECT COALESCE(MAX(version), 0) as version FROM _migrations").get()?.version ?? 0) < DB_VERSION) this.db.exec(`INSERT INTO _migrations (version) VALUES (${DB_VERSION})`);
	}
	/**
	* List installed skills with optional search filter.
	*/
	async list(query = {}) {
		let sql = `
      SELECT
        id, name, description, folder_name as folderName, source, source_url as sourceUrl,
        namespace, author, version, source_tags as sourceTags, content_hash as contentHash,
        is_global_enabled as isGlobalEnabled, created_at as createdAt, updated_at as updatedAt
      FROM skills
    `;
		const params = [];
		if (query.search) {
			sql += ` WHERE name LIKE ? OR description LIKE ?`;
			const searchPattern = `%${query.search}%`;
			params.push(searchPattern, searchPattern);
		}
		sql += ` ORDER BY name ASC`;
		const stmt = this.db.prepare(sql);
		return (params.length > 0 ? stmt.all(...params) : stmt.all()).map((row) => ({
			...row,
			sourceTags: JSON.parse(row.sourceTags),
			isGlobalEnabled: Boolean(row.isGlobalEnabled)
		}));
	}
	/**
	* Get skill by ID.
	*/
	async getById(params) {
		const row = this.db.prepare(`
      SELECT
        id, name, description, folder_name as folderName, source, source_url as sourceUrl,
        namespace, author, version, source_tags as sourceTags, content_hash as contentHash,
        is_global_enabled as isGlobalEnabled, created_at as createdAt, updated_at as updatedAt
      FROM skills
      WHERE id = ?
    `).get(params.skillId);
		if (!row) return null;
		return {
			...row,
			sourceTags: JSON.parse(row.sourceTags),
			isGlobalEnabled: Boolean(row.isGlobalEnabled)
		};
	}
	/**
	* Update skill (currently only global enable/disable).
	*/
	async update(params) {
		if (!await this.getById({ skillId: params.skillId })) throw new Error(`Skill not found: ${params.skillId}`);
		this.db.prepare(`
        UPDATE skills
        SET is_global_enabled = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(params.dto.isGlobalEnabled ? 1 : 0, params.skillId);
		const updated = await this.getById({ skillId: params.skillId });
		if (!updated) throw new Error("Failed to retrieve updated skill");
		return updated;
	}
	/**
	* Install a skill from various sources.
	*/
	async install(params) {
		const { options } = params;
		switch (options.source) {
			case "directory": return this.installFromDirectory(options.path);
			case "zip": throw new Error("ZIP installation not yet implemented");
			case "url": throw new Error("URL installation not yet implemented");
			case "marketplace": throw new Error("Marketplace installation not yet implemented");
			default: throw new Error(`Unknown install source: ${options.source}`);
		}
	}
	installFromDirectory(sourcePath) {
		const absPath = resolve(sourcePath);
		if (!existsSync(absPath)) throw new Error(`Source path does not exist: ${absPath}`);
		if (!statSync(absPath).isDirectory()) throw new Error(`Source path is not a directory: ${absPath}`);
		const skillMdPath = join(absPath, "SKILL.md");
		if (!existsSync(skillMdPath)) throw new Error(`SKILL.md not found in: ${absPath}`);
		const metadata = parseSkillMetadata(readFileSync(skillMdPath, "utf-8"));
		const contentHash = computeContentHash(absPath);
		const folderName = basename(absPath).replace(/[^a-zA-Z0-9_-]/g, "-");
		if (folderName.length === 0) throw new Error("Invalid folder name generated");
		if (this.db.prepare("SELECT id FROM skills WHERE folder_name = ?").get(folderName)) throw new Error(`A skill with folder name "${folderName}" is already installed`);
		const targetDir = join(this.skillsDir, folderName);
		if (existsSync(targetDir)) rmSync(targetDir, {
			recursive: true,
			force: true
		});
		this.copyDirectory(absPath, targetDir);
		const id = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
		const now = (/* @__PURE__ */ new Date()).toISOString();
		this.db.prepare(`
        INSERT INTO skills (
          id, name, description, folder_name, source, source_url, namespace, author, version,
          source_tags, content_hash, is_global_enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, metadata.name, metadata.description, folderName, "directory", absPath, metadata.namespace, metadata.author, metadata.version, JSON.stringify(metadata.tags), contentHash, 0, now, now);
		this.ctx.logger.info("Installed skill from directory", {
			id,
			name: metadata.name,
			folderName
		});
		const installed = this.db.prepare(`
        SELECT
          id, name, description, folder_name as folderName, source, source_url as sourceUrl,
          namespace, author, version, source_tags as sourceTags, content_hash as contentHash,
          is_global_enabled as isGlobalEnabled, created_at as createdAt, updated_at as updatedAt
        FROM skills
        WHERE id = ?
      `).get(id);
		if (!installed) throw new Error("Failed to retrieve installed skill");
		return {
			...installed,
			sourceTags: JSON.parse(installed.sourceTags),
			isGlobalEnabled: Boolean(installed.isGlobalEnabled)
		};
	}
	copyDirectory(src, dest) {
		mkdirSync(dest, { recursive: true });
		const entries = readdirSync(src);
		for (const entry of entries) {
			if (entry === "node_modules" || entry === ".git") continue;
			const srcPath = join(src, entry);
			const destPath = join(dest, entry);
			if (statSync(srcPath).isDirectory()) this.copyDirectory(srcPath, destPath);
			else {
				const content = readFileSync(srcPath);
				writeFileSync(destPath, content);
			}
		}
	}
	/**
	* Uninstall a skill.
	*/
	async uninstall(params) {
		const skill = await this.getById({ skillId: params.skillId });
		if (!skill) throw new Error(`Skill not found: ${params.skillId}`);
		const targetDir = join(this.skillsDir, skill.folderName);
		if (existsSync(targetDir)) rmSync(targetDir, {
			recursive: true,
			force: true
		});
		this.db.prepare("DELETE FROM skills WHERE id = ?").run(params.skillId);
		this.ctx.logger.info("Uninstalled skill", {
			id: params.skillId,
			name: skill.name
		});
	}
	/**
	* Search marketplace (stub implementation).
	*/
	async searchMarketplace(query) {
		this.ctx.logger.warn("Marketplace search not yet implemented");
		return {
			skills: [],
			total: 0,
			limit: query.limit ?? 50,
			offset: query.offset ?? 0
		};
	}
	[Symbol.dispose]() {
		this.db.close();
	}
};
//#endregion
//#region lib/types/skills-remote-client.js
/** Client descriptor contribution for the Control Center skills service. */
const skillsRemote = {
	package: "@dsh-control-center/control-center",
	descriptors: [
		{
			method: "list",
			parameters: ["query"]
		},
		{
			method: "getById",
			parameters: ["skillId"]
		},
		{
			method: "update",
			parameters: ["skillId", "dto"]
		},
		{
			method: "install",
			parameters: ["options"]
		},
		{
			method: "uninstall",
			parameters: ["skillId"]
		},
		{
			method: "searchMarketplace",
			parameters: ["query"]
		}
	].map(({ method, implementation, parameters }) => ({
		id: `@dsh-control-center/control-center#controlCenterSkills/${method}`,
		service: "controlCenterSkills",
		namespace: "controlCenterSkills",
		method,
		...implementation === void 0 ? {} : { implementation },
		invocation: { kind: "direct" },
		parameters: parameters.map((name) => ({
			name,
			wire: name,
			source: "json",
			codec: STRICT_JSON
		})),
		result: STRICT_JSON
	}))
};
//#endregion
//#region lib/types/mcp.js
const MCP_NAMESPACE = settingsNamespace("control-center-mcp");
var McpService = class extends Service {
	static inject = ["settings"];
	static optional = ["tools"];
	typertRemote = bindTypertRemote(this, "controlCenterMcp");
	scope;
	runtimeStates = /* @__PURE__ */ new Map();
	constructor(ctx) {
		super(ctx, "control-center-mcp");
		this.scope = ctx.settings.register(MCP_NAMESPACE, Schema.object({ servers: Schema.array(Schema.object({
			id: Schema.string(),
			name: Schema.string(),
			type: Schema.union([
				"stdio",
				"sse",
				"streamableHttp",
				"inMemory"
			]),
			description: Schema.string(),
			baseUrl: Schema.string(),
			command: Schema.string(),
			registryUrl: Schema.string(),
			args: Schema.array(Schema.string()),
			env: Schema.dict(Schema.string()),
			headers: Schema.dict(Schema.string()),
			provider: Schema.string(),
			providerUrl: Schema.string(),
			logoUrl: Schema.string(),
			tags: Schema.array(Schema.string()),
			longRunning: Schema.boolean(),
			timeout: Schema.number(),
			dxtVersion: Schema.string(),
			dxtPath: Schema.string(),
			reference: Schema.string(),
			searchKey: Schema.string(),
			disabledTools: Schema.array(Schema.string()),
			disabledAutoApproveTools: Schema.array(Schema.string()),
			shouldConfig: Schema.boolean(),
			sortOrder: Schema.number(),
			isActive: Schema.boolean(),
			installSource: Schema.union([
				"builtin",
				"manual",
				"protocol",
				"unknown"
			]),
			isTrusted: Schema.boolean(),
			trustedAt: Schema.number(),
			installedAt: Schema.number(),
			createdAt: Schema.string(),
			updatedAt: Schema.string()
		})).default([]) }), { base: { servers: [] } });
	}
	recordToView(record) {
		const runtimeState = this.runtimeStates.get(record.id);
		const state = record.isActive ? runtimeState?.state ?? "disabled" : "disabled";
		const view = {
			id: record.id,
			name: record.name,
			isActive: record.isActive,
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
			runtimeState: state
		};
		if (record.type !== void 0) view.type = record.type;
		if (record.description !== void 0) view.description = record.description;
		if (record.baseUrl !== void 0) view.baseUrl = record.baseUrl;
		if (record.command !== void 0) view.command = record.command;
		if (record.registryUrl !== void 0) view.registryUrl = record.registryUrl;
		if (record.args !== void 0) view.args = record.args;
		if (record.env !== void 0) view.env = record.env;
		if (record.headers !== void 0) view.headers = record.headers;
		if (record.provider !== void 0) view.provider = record.provider;
		if (record.providerUrl !== void 0) view.providerUrl = record.providerUrl;
		if (record.logoUrl !== void 0) view.logoUrl = record.logoUrl;
		if (record.tags !== void 0) view.tags = record.tags;
		if (record.longRunning !== void 0) view.longRunning = record.longRunning;
		if (record.timeout !== void 0) view.timeout = record.timeout;
		if (record.disabledTools !== void 0) view.disabledTools = record.disabledTools;
		if (record.sortOrder !== void 0) view.sortOrder = record.sortOrder;
		if (record.installSource !== void 0) view.installSource = record.installSource;
		if (record.isTrusted !== void 0) view.isTrusted = record.isTrusted;
		if (runtimeState?.lastError !== void 0) view.lastError = runtimeState.lastError;
		if (runtimeState?.version !== void 0) view.version = runtimeState.version;
		return view;
	}
	async list() {
		return this.scope.get().servers.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)).map((record) => this.recordToView(record));
	}
	async getById(params) {
		const record = this.scope.get().servers.find((s) => s.id === params.serverId);
		return record ? this.recordToView(record) : null;
	}
	async create(params) {
		const { dto } = params;
		const settings = this.scope.get();
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const record = {
			id: `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
			name: dto.name,
			isActive: dto.isActive ?? false,
			createdAt: now,
			updatedAt: now
		};
		if (dto.type !== void 0) record.type = dto.type;
		if (dto.description !== void 0) record.description = dto.description;
		if (dto.baseUrl !== void 0) record.baseUrl = dto.baseUrl;
		if (dto.command !== void 0) record.command = dto.command;
		if (dto.args !== void 0) record.args = dto.args;
		if (dto.env !== void 0) record.env = dto.env;
		if (dto.headers !== void 0) record.headers = dto.headers;
		if (dto.provider !== void 0) record.provider = dto.provider;
		if (dto.providerUrl !== void 0) record.providerUrl = dto.providerUrl;
		if (dto.logoUrl !== void 0) record.logoUrl = dto.logoUrl;
		if (dto.tags !== void 0) record.tags = dto.tags;
		if (dto.longRunning !== void 0) record.longRunning = dto.longRunning;
		if (dto.timeout !== void 0) record.timeout = dto.timeout;
		record.sortOrder = settings.servers.length;
		record.installSource = dto.installSource ?? "manual";
		if (dto.isTrusted !== void 0) record.isTrusted = dto.isTrusted;
		record.installedAt = Date.now();
		await this.ctx.settings.update(MCP_NAMESPACE, { servers: [...settings.servers, record] });
		return this.recordToView(record);
	}
	async update(params) {
		const { serverId, dto } = params;
		const settings = this.scope.get();
		const index = settings.servers.findIndex((s) => s.id === serverId);
		if (index === -1) throw new Error(`MCP server not found: ${serverId}`);
		const record = settings.servers[index];
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const updated = {
			...record,
			name: dto.name ?? record.name,
			isActive: dto.isActive ?? record.isActive,
			updatedAt: now
		};
		if (dto.description !== void 0) updated.description = dto.description;
		if (dto.baseUrl !== void 0) updated.baseUrl = dto.baseUrl;
		if (dto.command !== void 0) updated.command = dto.command;
		if (dto.args !== void 0) updated.args = dto.args;
		if (dto.env !== void 0) updated.env = dto.env;
		if (dto.headers !== void 0) updated.headers = dto.headers;
		if (dto.longRunning !== void 0) updated.longRunning = dto.longRunning;
		if (dto.timeout !== void 0) updated.timeout = dto.timeout;
		if (dto.disabledTools !== void 0) updated.disabledTools = dto.disabledTools;
		if (dto.isTrusted !== void 0) {
			updated.isTrusted = dto.isTrusted;
			if (dto.isTrusted && !record.isTrusted) updated.trustedAt = Date.now();
		}
		if (dto.isActive !== void 0 && dto.isActive !== record.isActive) {
			if (dto.isActive) this.startServer(serverId).catch((err) => {
				this.ctx.logger.error(`Failed to start MCP server ${serverId}:`, err);
			});
			else await this.stopServer({ serverId });
		}
		const updatedServers = [...settings.servers];
		updatedServers[index] = updated;
		await this.ctx.settings.update(MCP_NAMESPACE, { servers: updatedServers });
		return this.recordToView(updated);
	}
	async delete(params) {
		const { serverId } = params;
		const settings = this.scope.get();
		const record = settings.servers.find((s) => s.id === serverId);
		if (!record) throw new Error(`MCP server not found: ${serverId}`);
		if (record.isActive) await this.stopServer({ serverId });
		await this.ctx.settings.update(MCP_NAMESPACE, { servers: settings.servers.filter((s) => s.id !== serverId) });
	}
	async reorder(params) {
		const { serverIds } = params;
		const updatedServers = this.scope.get().servers.map((server) => {
			const newOrder = serverIds.indexOf(server.id);
			return newOrder !== -1 ? {
				...server,
				sortOrder: newOrder
			} : server;
		});
		await this.ctx.settings.update(MCP_NAMESPACE, { servers: updatedServers });
	}
	async startServer(serverId) {
		const record = this.scope.get().servers.find((s) => s.id === serverId);
		if (!record) throw new Error(`MCP server not found: ${serverId}`);
		if (!record.isTrusted) throw new Error("Server must be trusted before starting");
		this.runtimeStates.set(serverId, {
			serverId,
			state: "connecting",
			connectedAt: (/* @__PURE__ */ new Date()).toISOString(),
			logs: []
		});
		try {
			let transport;
			let client;
			if (record.type === "stdio" || !record.type) {
				if (!record.command) throw new Error("Command is required for stdio transport");
				const args = record.args || [];
				const env = record.env || {};
				const processEnv = {};
				for (const [key, value] of Object.entries({
					...process.env,
					...env
				})) if (value !== void 0) processEnv[key] = value;
				this.ctx.logger.info(`Starting MCP server via stdio`, {
					serverId,
					command: record.command,
					args
				});
				transport = new StdioClientTransport({
					command: record.command,
					args,
					env: processEnv,
					stderr: "pipe"
				});
				const stderrStream = transport.stderr;
				if (stderrStream && typeof stderrStream.on === "function") {
					const decoder = new TextDecoder("utf-8", { fatal: false });
					stderrStream.on("data", (data) => {
						const msg = decoder.decode(data, { stream: true });
						this.addServerLog(serverId, `[stderr] ${msg.trim()}`);
					});
				}
				client = new Client({
					name: "dsh-control-center",
					version: "1.0.0"
				}, { capabilities: {} });
				const timeout = (record.timeout || 30) * 1e3;
				await Promise.race([client.connect(transport), new Promise((_, reject) => setTimeout(() => reject(/* @__PURE__ */ new Error("Connection timeout")), timeout))]);
				this.addServerLog(serverId, "Server connected");
			} else if (record.type === "sse") {
				if (!record.baseUrl) throw new Error("Base URL is required for SSE transport");
				this.ctx.logger.info(`Starting MCP server via SSE`, {
					serverId,
					baseUrl: record.baseUrl
				});
				const { SSEClientTransport } = await import("@modelcontextprotocol/sdk/client/sse.js");
				const headers = {};
				if (record.headers) Object.assign(headers, record.headers);
				transport = new SSEClientTransport(new URL(record.baseUrl), {
					eventSourceInit: { fetch: async (url, init) => {
						return fetch(typeof url === "string" ? url : url.toString(), init);
					} },
					requestInit: { headers }
				});
				client = new Client({
					name: "dsh-control-center",
					version: "1.0.0"
				}, { capabilities: {} });
				const timeout = (record.timeout || 30) * 1e3;
				await Promise.race([client.connect(transport), new Promise((_, reject) => setTimeout(() => reject(/* @__PURE__ */ new Error("Connection timeout")), timeout))]);
				this.addServerLog(serverId, "SSE server connected");
			} else if (record.type === "streamableHttp") {
				if (!record.baseUrl) throw new Error("Base URL is required for streamableHttp transport");
				this.ctx.logger.info(`Starting MCP server via streamableHttp`, {
					serverId,
					baseUrl: record.baseUrl
				});
				const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp");
				const headers = {};
				if (record.headers) Object.assign(headers, record.headers);
				transport = new StreamableHTTPClientTransport(new URL(record.baseUrl), {
					fetch: async (url, init) => {
						return fetch(typeof url === "string" ? url : url.toString(), init);
					},
					requestInit: { headers }
				});
				client = new Client({
					name: "dsh-control-center",
					version: "1.0.0"
				}, { capabilities: {} });
				const timeout = (record.timeout || 30) * 1e3;
				await Promise.race([client.connect(transport), new Promise((_, reject) => setTimeout(() => reject(/* @__PURE__ */ new Error("Connection timeout")), timeout))]);
				this.addServerLog(serverId, "StreamableHTTP server connected");
			} else throw new Error(`Unsupported transport type: ${record.type}`);
			const serverCapabilities = client.getServerCapabilities();
			const capabilities = {};
			const toolDisposers = [];
			if (serverCapabilities?.tools) try {
				capabilities.tools = (await client.listTools()).tools.map((tool) => {
					const mapped = {
						name: tool.name,
						inputSchema: tool.inputSchema
					};
					if (tool.description !== void 0) mapped.description = tool.description;
					return mapped;
				});
				const disabledTools = record.disabledTools || [];
				const toolService = this.ctx.get("tools", false);
				if (toolService) for (const tool of capabilities.tools) {
					if (disabledTools.includes(tool.name)) continue;
					const toolName = `mcp_${serverId}_${tool.name}`;
					const dispose = toolService.register({
						name: toolName,
						description: tool.description || `MCP tool: ${tool.name}`,
						parameters: tool.inputSchema,
						output: {
							schema: { type: "object" },
							render: (_args, value) => {
								return [{
									type: "text",
									text: JSON.stringify(value)
								}];
							}
						},
						execute: async (args) => {
							return (await client.callTool({
								name: tool.name,
								arguments: args
							})).content;
						}
					});
					toolDisposers.push(dispose);
					this.addServerLog(serverId, `Registered tool: ${tool.name}`);
				}
			} catch (error) {
				this.ctx.logger.warn(`Failed to list tools for ${serverId}`, error);
			}
			if (serverCapabilities?.prompts) try {
				capabilities.prompts = (await client.listPrompts()).prompts.map((prompt) => {
					const mapped = { name: prompt.name };
					if (prompt.description !== void 0) mapped.description = prompt.description;
					if (prompt.arguments !== void 0) mapped.arguments = prompt.arguments;
					return mapped;
				});
			} catch (error) {
				this.ctx.logger.warn(`Failed to list prompts for ${serverId}`, error);
			}
			if (serverCapabilities?.resources) try {
				capabilities.resources = (await client.listResources()).resources.map((resource) => {
					const mapped = {
						uri: resource.uri,
						name: resource.name
					};
					if (resource.description !== void 0) mapped.description = resource.description;
					if (resource.mimeType !== void 0) mapped.mimeType = resource.mimeType;
					return mapped;
				});
			} catch (error) {
				this.ctx.logger.warn(`Failed to list resources for ${serverId}`, error);
			}
			this.runtimeStates.set(serverId, {
				serverId,
				state: "connected",
				version: "1.0.0",
				capabilities,
				connectedAt: (/* @__PURE__ */ new Date()).toISOString(),
				client,
				transport,
				logs: this.runtimeStates.get(serverId)?.logs || [],
				toolDisposers
			});
			this.addServerLog(serverId, "Server activated");
			this.ctx.logger.info(`MCP server ${serverId} connected successfully`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.addServerLog(serverId, `Error: ${errorMessage}`);
			this.runtimeStates.set(serverId, {
				serverId,
				state: "error",
				lastError: errorMessage,
				logs: this.runtimeStates.get(serverId)?.logs || []
			});
			this.ctx.logger.error(`Failed to start MCP server ${serverId}`, error);
			throw error;
		}
	}
	async stopServer(params) {
		const state = this.runtimeStates.get(params.serverId);
		if (!state) return;
		try {
			if (state.toolDisposers) {
				for (const dispose of state.toolDisposers) try {
					dispose();
				} catch (error) {
					this.ctx.logger.warn(`Failed to dispose tool`, error);
				}
				this.addServerLog(params.serverId, `Unregistered ${state.toolDisposers.length} tools`);
			}
			if (state.client) {
				await state.client.close();
				this.addServerLog(params.serverId, "Server stopped");
			}
		} catch (error) {
			this.ctx.logger.error(`Error stopping MCP server ${params.serverId}`, error);
		} finally {
			this.runtimeStates.delete(params.serverId);
		}
	}
	async refreshTools(params) {
		const state = this.runtimeStates.get(params.serverId);
		if (!state || state.state !== "connected" || !state.client) throw new Error("Server must be connected to refresh tools");
		try {
			const client = state.client;
			const serverCapabilities = client.getServerCapabilities();
			const capabilities = {};
			if (state.toolDisposers) {
				for (const dispose of state.toolDisposers) try {
					dispose();
				} catch (error) {
					this.ctx.logger.warn(`Failed to dispose tool`, error);
				}
				this.addServerLog(params.serverId, `Unregistered ${state.toolDisposers.length} old tools`);
			}
			const toolDisposers = [];
			const toolService = this.ctx.get("tools", false);
			if (serverCapabilities?.tools) {
				capabilities.tools = (await client.listTools()).tools.map((tool) => {
					const mapped = {
						name: tool.name,
						inputSchema: tool.inputSchema
					};
					if (tool.description !== void 0) mapped.description = tool.description;
					return mapped;
				});
				const disabledTools = this.scope.get().servers.find((s) => s.id === params.serverId)?.disabledTools || [];
				if (toolService) for (const tool of capabilities.tools) {
					if (disabledTools.includes(tool.name)) continue;
					const toolName = `mcp_${params.serverId}_${tool.name}`;
					const dispose = toolService.register({
						name: toolName,
						description: tool.description || `MCP tool: ${tool.name}`,
						parameters: tool.inputSchema,
						output: {
							schema: { type: "object" },
							render: (_args, value) => {
								return [{
									type: "text",
									text: JSON.stringify(value)
								}];
							}
						},
						execute: async (args) => {
							return (await client.callTool({
								name: tool.name,
								arguments: args
							})).content;
						}
					});
					toolDisposers.push(dispose);
					this.addServerLog(params.serverId, `Registered tool: ${tool.name}`);
				}
				else this.ctx.logger.warn("Tool service not available for registration");
			}
			if (serverCapabilities?.prompts) capabilities.prompts = (await client.listPrompts()).prompts.map((prompt) => {
				const mapped = { name: prompt.name };
				if (prompt.description !== void 0) mapped.description = prompt.description;
				if (prompt.arguments !== void 0) mapped.arguments = prompt.arguments;
				return mapped;
			});
			if (serverCapabilities?.resources) capabilities.resources = (await client.listResources()).resources.map((resource) => {
				const mapped = {
					uri: resource.uri,
					name: resource.name
				};
				if (resource.description !== void 0) mapped.description = resource.description;
				if (resource.mimeType !== void 0) mapped.mimeType = resource.mimeType;
				return mapped;
			});
			this.runtimeStates.set(params.serverId, {
				...state,
				capabilities,
				toolDisposers
			});
			this.addServerLog(params.serverId, "Tools refreshed");
			this.ctx.logger.info(`Refreshed tools for MCP server ${params.serverId}`);
		} catch (error) {
			this.ctx.logger.error(`Failed to refresh tools for ${params.serverId}`, error);
			throw error;
		}
	}
	async getServerLogs(params) {
		const state = this.runtimeStates.get(params.serverId);
		if (!state || !state.logs) return [];
		const logs = state.logs;
		const lineCount = params.lines || 100;
		return logs.slice(-lineCount);
	}
	async getCapabilities(params) {
		return this.runtimeStates.get(params.serverId)?.capabilities || null;
	}
	addServerLog(serverId, message) {
		const state = this.runtimeStates.get(serverId);
		if (!state) return;
		const logLine = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`;
		const logs = state.logs || [];
		logs.push(logLine);
		if (logs.length > 1e3) logs.shift();
		this.runtimeStates.set(serverId, {
			...state,
			logs
		});
	}
};
//#endregion
//#region lib/types/mcp-remote-client.js
/** Client descriptor contribution for the Control Center MCP service. */
const mcpRemote = {
	package: "@dsh-control-center/control-center",
	descriptors: [
		{
			method: "list",
			parameters: []
		},
		{
			method: "getById",
			parameters: ["serverId"]
		},
		{
			method: "create",
			parameters: ["dto"]
		},
		{
			method: "update",
			parameters: ["serverId", "dto"]
		},
		{
			method: "delete",
			parameters: ["serverId"]
		},
		{
			method: "reorder",
			parameters: ["serverIds"]
		},
		{
			method: "stopServer",
			parameters: ["serverId"]
		},
		{
			method: "refreshTools",
			parameters: ["serverId"]
		},
		{
			method: "getServerLogs",
			parameters: ["serverId", "lines"]
		},
		{
			method: "getCapabilities",
			parameters: ["serverId"]
		}
	].map(({ method, implementation, parameters }) => ({
		id: `@dsh-control-center/control-center#controlCenterMcp/${method}`,
		service: "controlCenterMcp",
		namespace: "controlCenterMcp",
		method,
		...implementation === void 0 ? {} : { implementation },
		invocation: { kind: "direct" },
		parameters: parameters.map((name) => ({
			name,
			wire: name,
			source: "json",
			codec: STRICT_JSON
		})),
		result: STRICT_JSON
	}))
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
const OnboardingSettingsSchema = Schema.object({ welcomeNoticeVersion: Schema.string() });
/** Cordis plugin name. */
const name = "dsh-control-center";
const inject = ["typert"];
/** Reject incompatible DSH packages, then restore the onboarding namespace. */
function apply(ctx) {
	assertCompatibleDsh();
	new TranslationService(ctx);
	new PaintingService(ctx);
	new KnowledgeService(ctx);
	new SkillsService(ctx);
	new McpService(ctx);
	const contributions = [{
		package: "@dsh-control-center/control-center",
		face: "host",
		schemas: [],
		model: {
			services: [],
			events: [],
			objects: []
		},
		invocations: [
			...translationRemote.descriptors,
			...paintingRemote.descriptors,
			...knowledgeRemote.descriptors,
			...skillsRemote.descriptors,
			...mcpRemote.descriptors
		]
	}];
	for (const contribution of contributions) ctx.typert.register(contribution);
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE), OnboardingSettingsSchema);
	});
}
//#endregion
export { KnowledgeService, McpService, PaintingService, SkillsService, TranslationService, apply, assertCompatibleDsh, assertSecretSchemaSafe, auditSecretSchema, inject, name };
