window.__ModuleLoader__.load({
	id: "@dsh-control-center/bundle",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_web_react = require("@deepseek-ai/dsh-client-web-react");
		let _deepseek_ai_dsh_client_ui_slots = require("@deepseek-ai/dsh-client-ui-slots");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let _deepseek_ai_dsh_client_schema_form = require("@deepseek-ai/dsh-client-schema-form");
		const STRICT_JSON = {
			mode: "strict",
			typeSymbol: "@dsh-control-center/json",
			schema: { parse(value) {
				structuredClone(value);
				return value;
			} }
		};
		//#endregion
		//#region lib/types/translation-remote-client.js
		/** Client descriptor contribution for the Control Center translation service. */
		const translationRemote = {
			package: "@dsh-control-center/control-center",
			descriptors: [
				{
					method: "start",
					parameters: ["request"]
				},
				{
					method: "get",
					parameters: ["jobId"]
				},
				{
					method: "cancel",
					parameters: ["jobId"]
				},
				{
					method: "history",
					implementation: "listHistory",
					parameters: ["cursor", "limit"]
				},
				{
					method: "deleteHistory",
					parameters: ["id"]
				},
				{
					method: "languages",
					parameters: []
				},
				{
					method: "putLanguage",
					parameters: ["id", "label"]
				},
				{
					method: "deleteLanguage",
					parameters: ["id"]
				}
			].map(({ method, implementation, parameters }) => ({
				id: `@dsh-control-center/control-center#controlCenterTranslation/${method}`,
				service: "controlCenterTranslation",
				namespace: "controlCenterTranslation",
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
		const STRICT_JSON_PAINTING = {
			mode: "strict",
			typeSymbol: "@dsh-control-center/painting-json",
			schema: { parse(value) {
				structuredClone(value);
				return value;
			} }
		};
		//#endregion
		//#region lib/types/painting-remote-client.js
		/** Client descriptor contribution for the Control Center painting service. */
		const paintingRemote = {
			package: "@dsh-control-center/control-center",
			descriptors: [
				{
					method: "catalog",
					parameters: []
				},
				{
					method: "start",
					parameters: ["request"]
				},
				{
					method: "get",
					parameters: ["jobId"]
				},
				{
					method: "cancel",
					parameters: ["jobId"]
				},
				{
					method: "history",
					implementation: "listHistory",
					parameters: ["cursor", "limit"]
				},
				{
					method: "deleteHistory",
					parameters: ["id"]
				}
			].map(({ method, implementation, parameters }) => ({
				id: `@dsh-control-center/control-center#controlCenterPainting/${method}`,
				service: "controlCenterPainting",
				namespace: "controlCenterPainting",
				method,
				...implementation === void 0 ? {} : { implementation },
				invocation: { kind: "direct" },
				parameters: parameters.map((name) => ({
					name,
					wire: name,
					source: "json",
					codec: STRICT_JSON_PAINTING
				})),
				result: STRICT_JSON_PAINTING
			}))
		};
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\PaintingWorkspace.module.css.mjs
		const css$23 = "._-UrTq_root{background:var(--background);min-width:0;min-height:0;color:var(--foreground);flex-direction:column;flex:1;gap:16px;padding:24px;display:flex;overflow:auto}._-UrTq_header{justify-content:space-between;align-items:center;gap:16px;display:flex}._-UrTq_header h1{margin:2px 0 0;font-size:28px}._-UrTq_eyebrow{color:var(--foreground-tertiary);letter-spacing:.08em;text-transform:uppercase;margin:0;font-size:12px}._-UrTq_composer{border:1px solid var(--border-subtle);border-radius:14px;flex-direction:column;gap:10px;padding:14px;display:flex}._-UrTq_composer textarea{resize:vertical;border:1px solid var(--border);box-sizing:border-box;width:100%;min-height:96px;color:inherit;font:inherit;background:0 0;border-radius:10px;padding:12px;line-height:1.6}._-UrTq_controls{flex-wrap:wrap;align-items:center;gap:8px;display:flex}._-UrTq_controls select{border:1px solid var(--border);background:var(--background);min-height:34px;color:inherit;border-radius:9px;padding:0 10px}._-UrTq_controls button:last-child{background:var(--primary);min-height:34px;color:var(--primary-foreground);cursor:pointer;border:none;border-radius:9px;margin-left:auto;padding:0 16px}._-UrTq_controls button:disabled{opacity:.45;cursor:not-allowed}._-UrTq_secondary{border:1px solid var(--border);min-height:34px;color:inherit;cursor:pointer;background:0 0;border-radius:9px;padding:0 12px}._-UrTq_progress{color:var(--muted-foreground);margin:0}._-UrTq_error{color:var(--foreground);background:var(--error-subtle);border-radius:9px;margin:0;padding:10px 12px}._-UrTq_gallery,._-UrTq_history{padding-top:4px}._-UrTq_gallery>*,._-UrTq_historyImages{flex-wrap:wrap;gap:12px;display:flex}._-UrTq_history h2{margin:0 0 10px;font-size:18px}._-UrTq_figure{flex-direction:column;gap:6px;margin:0;display:flex}._-UrTq_figure img{border:1px solid var(--border-subtle);border-radius:10px;max-width:220px;height:auto}._-UrTq_figure figcaption{gap:10px;display:flex}._-UrTq_historyItem{border-top:1px solid var(--border-subtle);padding:14px 0}._-UrTq_historyItem>div:first-child{justify-content:space-between;gap:12px;display:flex}._-UrTq_historyItem time{color:var(--foreground-tertiary);font-size:12px}._-UrTq_link{color:var(--primary);cursor:pointer;background:0 0;border:none;margin-right:12px;padding:0}._-UrTq_empty{color:var(--foreground-tertiary)}@media (width<=760px){._-UrTq_root{padding:14px}._-UrTq_controls button:last-child{margin-left:0}}";
		const tagId$23 = "@dsh-control-center/bundle/PaintingWorkspace.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$23) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$23;
			tag.textContent = css$23;
			document.head.appendChild(tag);
		}
		var PaintingWorkspace_module_css_default = {
			"history": "_-UrTq_history",
			"controls": "_-UrTq_controls",
			"link": "_-UrTq_link",
			"error": "_-UrTq_error",
			"secondary": "_-UrTq_secondary",
			"eyebrow": "_-UrTq_eyebrow",
			"historyImages": "_-UrTq_historyImages",
			"figure": "_-UrTq_figure",
			"historyItem": "_-UrTq_historyItem",
			"empty": "_-UrTq_empty",
			"composer": "_-UrTq_composer",
			"gallery": "_-UrTq_gallery",
			"header": "_-UrTq_header",
			"progress": "_-UrTq_progress",
			"root": "_-UrTq_root"
		};
		//#endregion
		//#region lib/types/client/PaintingWorkspace.js
		/** Full Painting workspace over the real Control Center painting service. */
		function PaintingWorkspace({ getPainting, usePaintingReady, close }) {
			const paintingReady = usePaintingReady((value) => value);
			const painting = paintingReady ? getPainting() : void 0;
			const [catalog, setCatalog] = (0, react.useState)([]);
			const [selectedModel, setSelectedModel] = (0, react.useState)("");
			const [prompt, setPrompt] = (0, react.useState)("");
			const [sampleCount, setSampleCount] = (0, react.useState)(1);
			const [job, setJob] = (0, react.useState)(null);
			const [history, setHistory] = (0, react.useState)([]);
			const [nextCursor, setNextCursor] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const modelOptions = (0, react.useMemo)(() => {
				const seen = /* @__PURE__ */ new Map();
				for (const model of catalog) {
					const key = `${model.providerId}/${model.id}`;
					if (!seen.has(key)) seen.set(key, model);
				}
				return [...seen.values()].map((model) => ({
					value: `${model.providerId}/${model.id}`,
					label: `${model.providerId} · ${model.label}`,
					providerId: model.providerId,
					id: model.id
				}));
			}, [catalog]);
			(0, react.useEffect)(() => {
				if (!paintingReady || painting === void 0) return;
				let active = true;
				painting.catalog().then((catalogResult) => {
					if (!active) return;
					if (!catalogResult.ok) throw new Error(catalogResult.error.message);
					setCatalog(catalogResult.value.models);
					if (catalogResult.value.models.length > 0 && selectedModel === "") {
						const first = catalogResult.value.models[0];
						setSelectedModel(`${first.providerId}/${first.id}`);
					}
				}).catch((reason) => {
					if (active) setError(reason instanceof Error ? reason.message : String(reason));
				});
				painting.history(null, 20).then((historyResult) => {
					if (!active) return;
					if (!historyResult.ok) throw new Error(historyResult.error.message);
					setHistory(historyResult.value.items);
					setNextCursor(historyResult.value.nextCursor ?? null);
				}).catch((reason) => {
					if (active) setError(reason instanceof Error ? reason.message : String(reason));
				});
				return () => {
					active = false;
				};
			}, [
				paintingReady,
				painting,
				selectedModel
			]);
			(0, react.useEffect)(() => {
				if (job?.status !== "running" || painting === void 0) return;
				const timer = window.setInterval(() => {
					painting.get(job.jobId).then((result) => {
						if (!result.ok) {
							setError(result.error.message);
							return;
						}
						setJob(result.value);
						if (result.value.status === "completed") painting.history(null, 20).then((historyResult) => {
							if (historyResult.ok) {
								setHistory(historyResult.value.items);
								setNextCursor(historyResult.value.nextCursor ?? null);
							}
						});
					});
				}, 250);
				return () => {
					window.clearInterval(timer);
				};
			}, [
				job?.jobId,
				job?.status,
				painting
			]);
			const generate = async () => {
				if (painting === void 0 || selectedModel === "" || prompt.trim() === "") return;
				setError(null);
				const [providerId, model] = selectedModel.split("/");
				const result = await painting.start({
					providerId,
					model,
					prompt,
					params: { size: "1024x1024" },
					sampleCount
				});
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				const view = await painting.get(result.value.jobId);
				if (!view.ok) {
					setError(view.error.message);
					return;
				}
				setJob(view.value);
			};
			const cancel = async () => {
				if (painting === void 0 || job === null) return;
				const result = await painting.cancel(job.jobId);
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				setJob(result.value);
			};
			const download = (image) => {
				const anchor = document.createElement("a");
				anchor.href = image.dataUrl;
				anchor.download = `generated-${image.attachmentId}.png`;
				document.body.append(anchor);
				anchor.click();
				anchor.remove();
			};
			const deleteHistoryItem = async (id) => {
				if (painting === void 0) return;
				const result = await painting.deleteHistory(id);
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				setHistory((current) => current.filter((item) => item.id !== id));
			};
			if (!paintingReady) return (0, react_jsx_runtime.jsx)("main", {
				className: ` cc-surface`,
				children: (0, react_jsx_runtime.jsx)("p", {
					role: "status",
					children: "正在连接绘画服务…"
				})
			});
			return (0, react_jsx_runtime.jsxs)("main", {
				className: ` cc-surface`,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: PaintingWorkspace_module_css_default.header,
						children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("p", {
							className: PaintingWorkspace_module_css_default.eyebrow,
							children: "DSH Control Center"
						}), (0, react_jsx_runtime.jsx)("h1", { children: "绘画" })] }), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: PaintingWorkspace_module_css_default.secondary,
							onClick: close,
							children: "返回对话"
						})]
					}),
					error === null ? null : (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						className: PaintingWorkspace_module_css_default.error,
						children: error
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: PaintingWorkspace_module_css_default.composer,
						children: [
							(0, react_jsx_runtime.jsx)("textarea", {
								"aria-label": "绘画提示词",
								value: prompt,
								onChange: (event) => {
									setPrompt(event.target.value);
								},
								placeholder: "描述你想要生成的图像"
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: PaintingWorkspace_module_css_default.controls,
								children: [
									(0, react_jsx_runtime.jsx)("select", {
										"aria-label": "图像模型",
										value: selectedModel,
										onChange: (event) => {
											setSelectedModel(event.target.value);
										},
										children: modelOptions.map((option) => (0, react_jsx_runtime.jsx)("option", {
											value: option.value,
											children: option.label
										}, option.value))
									}),
									(0, react_jsx_runtime.jsx)("select", {
										"aria-label": "图像数量",
										value: String(sampleCount),
										onChange: (event) => {
											setSampleCount(Number(event.target.value));
										},
										children: [
											1,
											2,
											4
										].map((n) => (0, react_jsx_runtime.jsx)("option", {
											value: String(n),
											children: n
										}, n))
									}),
									job?.status !== "running" ? (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: selectedModel === "" || prompt.trim() === "",
										onClick: () => {
											generate();
										},
										children: "生成"
									}) : (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: PaintingWorkspace_module_css_default.secondary,
										onClick: () => {
											cancel();
										},
										children: "取消"
									})
								]
							}),
							job !== null && job.status === "running" && (0, react_jsx_runtime.jsxs)("p", {
								role: "status",
								className: PaintingWorkspace_module_css_default.progress,
								children: [
									"生成中… ",
									Math.round(job.progress * 100),
									"%"
								]
							}),
							job !== null && job.status === "error" && (0, react_jsx_runtime.jsx)("p", {
								role: "alert",
								className: PaintingWorkspace_module_css_default.error,
								children: job.error ?? "生成失败"
							})
						]
					}),
					job?.createdImages.length !== void 0 && job.createdImages.length > 0 && (0, react_jsx_runtime.jsx)("section", {
						className: PaintingWorkspace_module_css_default.gallery,
						"aria-label": "本次生成结果",
						children: job.createdImages.map((image) => (0, react_jsx_runtime.jsxs)("figure", {
							className: PaintingWorkspace_module_css_default.figure,
							children: [(0, react_jsx_runtime.jsx)("img", {
								src: image.dataUrl,
								alt: job.prompt,
								width: image.width,
								height: image.height
							}), (0, react_jsx_runtime.jsxs)("figcaption", { children: [(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PaintingWorkspace_module_css_default.link,
								onClick: () => {
									download(image);
								},
								children: "下载"
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PaintingWorkspace_module_css_default.link,
								onClick: () => {
									setPrompt(job.prompt);
								},
								children: "复用"
							})] })]
						}, image.attachmentId))
					}),
					(0, react_jsx_runtime.jsxs)("aside", {
						className: PaintingWorkspace_module_css_default.history,
						children: [
							(0, react_jsx_runtime.jsx)("h2", { children: "绘画历史" }),
							history.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
								className: PaintingWorkspace_module_css_default.empty,
								children: "暂无历史"
							}) : history.map((item) => (0, react_jsx_runtime.jsxs)("article", {
								className: PaintingWorkspace_module_css_default.historyItem,
								children: [
									(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("strong", { children: item.prompt }), (0, react_jsx_runtime.jsx)("time", { children: new Date(item.createdAt).toLocaleString() })] }),
									(0, react_jsx_runtime.jsx)("div", {
										className: PaintingWorkspace_module_css_default.historyImages,
										children: item.images.map((image) => (0, react_jsx_runtime.jsx)("figure", {
											className: PaintingWorkspace_module_css_default.figure,
											children: (0, react_jsx_runtime.jsx)("img", {
												src: image.dataUrl,
												alt: item.prompt,
												width: image.width,
												height: image.height
											})
										}, image.attachmentId))
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: PaintingWorkspace_module_css_default.link,
										onClick: () => {
											setPrompt(item.prompt);
										},
										children: "复用"
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: PaintingWorkspace_module_css_default.link,
										onClick: () => {
											deleteHistoryItem(item.id);
										},
										children: "删除"
									})
								]
							}, item.id)),
							nextCursor === null ? null : (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PaintingWorkspace_module_css_default.secondary,
								onClick: () => {
									if (painting === void 0) return;
									painting.history(nextCursor, 20).then((result) => {
										if (!result.ok) {
											setError(result.error.message);
											return;
										}
										setHistory((current) => [...current, ...result.value.items]);
										setNextCursor(result.value.nextCursor ?? null);
									});
								},
								children: "加载更多"
							})
						]
					})
				]
			});
		}
		const STRICT_JSON_KNOWLEDGE = {
			mode: "strict",
			typeSymbol: "@dsh-control-center/knowledge-json",
			schema: { parse(value) {
				structuredClone(value);
				return value;
			} }
		};
		//#endregion
		//#region lib/types/knowledge-remote-client.js
		/** Client descriptor contribution for the Control Center knowledge service. */
		const knowledgeRemote = {
			package: "@dsh-control-center/control-center",
			descriptors: [
				{
					method: "listBases",
					parameters: []
				},
				{
					method: "createBase",
					parameters: ["request"]
				},
				{
					method: "getBase",
					parameters: ["baseId"]
				},
				{
					method: "deleteBase",
					parameters: ["baseId"]
				},
				{
					method: "addText",
					parameters: ["request"]
				},
				{
					method: "addUrl",
					parameters: ["request"]
				},
				{
					method: "addFile",
					parameters: ["request"]
				},
				{
					method: "listSources",
					parameters: ["baseId"]
				},
				{
					method: "deleteSource",
					parameters: ["baseId", "sourceId"]
				},
				{
					method: "indexBase",
					parameters: ["baseId"]
				},
				{
					method: "listChunks",
					parameters: [
						"baseId",
						"cursor",
						"limit"
					]
				},
				{
					method: "retrieve",
					parameters: ["request"]
				}
			].map(({ method, implementation, parameters }) => ({
				id: `@dsh-control-center/control-center#controlCenterKnowledge/${method}`,
				service: "controlCenterKnowledge",
				namespace: "controlCenterKnowledge",
				method,
				...implementation === void 0 ? {} : { implementation },
				invocation: { kind: "direct" },
				parameters: parameters.map((name) => ({
					name,
					wire: name,
					source: "json",
					codec: STRICT_JSON_KNOWLEDGE
				})),
				result: STRICT_JSON_KNOWLEDGE
			}))
		};
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\KnowledgeWorkspace.module.css.mjs
		const css$22 = ".uHDY1a_root{background:var(--background);min-width:0;min-height:0;color:var(--foreground);flex-direction:column;flex:1;gap:16px;padding:24px;display:flex;overflow:auto}.uHDY1a_header{justify-content:space-between;align-items:center;gap:16px;display:flex}.uHDY1a_header h1{margin:2px 0 0;font-size:28px}.uHDY1a_eyebrow{color:var(--foreground-tertiary);letter-spacing:.08em;text-transform:uppercase;margin:0;font-size:12px}.uHDY1a_panel{border:1px solid var(--border-subtle);border-radius:14px;flex-direction:column;gap:10px;padding:14px;display:flex}.uHDY1a_panel h2{margin:0;font-size:16px}.uHDY1a_bases,.uHDY1a_hits,.uHDY1a_chunks{flex-direction:column;gap:10px;display:flex}.uHDY1a_bases h2{margin:0 0 4px;font-size:16px}.uHDY1a_row{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.uHDY1a_row input,.uHDY1a_row textarea{border:1px solid var(--border);min-width:0;color:inherit;font:inherit;background:0 0;border-radius:9px;flex:1;padding:9px 11px}.uHDY1a_row textarea{resize:vertical;flex-basis:100%;min-height:72px}.uHDY1a_row button{background:var(--primary);min-height:34px;color:var(--primary-foreground);cursor:pointer;border:none;border-radius:9px;padding:0 16px}.uHDY1a_row button:disabled{opacity:.45;cursor:not-allowed}.uHDY1a_primary{background:var(--primary);min-height:34px;color:var(--primary-foreground);cursor:pointer;border:none;border-radius:9px;padding:0 16px}.uHDY1a_secondary{border:1px solid var(--border);min-height:34px;color:inherit;cursor:pointer;background:0 0;border-radius:9px;padding:0 12px}.uHDY1a_link{color:var(--primary);cursor:pointer;background:0 0;border:none;padding:0}.uHDY1a_fileButton{border:1px solid var(--border);min-height:34px;color:inherit;cursor:pointer;border-radius:9px;align-items:center;padding:0 12px;font-size:14px;display:inline-flex}.uHDY1a_fileButton input{display:none}.uHDY1a_baseCard{border:1px solid var(--border-subtle);border-radius:10px;justify-content:space-between;align-items:center;gap:12px;padding:12px;display:flex}.uHDY1a_baseMeta{flex-direction:column;gap:3px;min-width:0;display:flex}.uHDY1a_baseMeta span{color:var(--foreground-tertiary);font-size:12px}.uHDY1a_baseActions{flex-shrink:0;align-items:center;gap:10px;display:flex}.uHDY1a_sourceTabs{flex-direction:column;gap:10px;display:flex}.uHDY1a_sourceItem{border-top:1px solid var(--border-subtle);justify-content:space-between;align-items:center;gap:12px;padding:10px 0;display:flex}.uHDY1a_sourceMeta{flex-direction:column;gap:2px;min-width:0;display:flex}.uHDY1a_sourceMeta span{color:var(--foreground-tertiary);font-size:12px}.uHDY1a_muted{color:var(--muted-foreground);margin:0;font-size:13px}.uHDY1a_hits{margin:0;padding-left:20px}.uHDY1a_hit{border:1px solid var(--border-subtle);border-radius:10px;padding:10px}.uHDY1a_hitMeta{justify-content:space-between;gap:12px;display:flex}.uHDY1a_hitMeta span{color:var(--foreground-tertiary);font-size:12px}.uHDY1a_hit p{margin:6px 0 0;line-height:1.6}.uHDY1a_chunk{border:1px solid var(--border-subtle);border-radius:8px;padding:8px 10px}.uHDY1a_chunk summary{cursor:pointer;color:var(--muted-foreground)}.uHDY1a_chunk p{white-space:pre-wrap;margin:8px 0 0;line-height:1.6}.uHDY1a_error{color:var(--foreground);background:var(--error-subtle);border-radius:9px;margin:0;padding:10px 12px}.uHDY1a_empty{color:var(--foreground-tertiary)}@media (width<=760px){.uHDY1a_root{padding:14px}.uHDY1a_baseCard{flex-direction:column;align-items:flex-start}}";
		const tagId$22 = "@dsh-control-center/bundle/KnowledgeWorkspace.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$22) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$22;
			tag.textContent = css$22;
			document.head.appendChild(tag);
		}
		var KnowledgeWorkspace_module_css_default = {
			"hit": "uHDY1a_hit",
			"empty": "uHDY1a_empty",
			"panel": "uHDY1a_panel",
			"primary": "uHDY1a_primary",
			"chunks": "uHDY1a_chunks",
			"hitMeta": "uHDY1a_hitMeta",
			"sourceTabs": "uHDY1a_sourceTabs",
			"chunk": "uHDY1a_chunk",
			"header": "uHDY1a_header",
			"hits": "uHDY1a_hits",
			"link": "uHDY1a_link",
			"baseActions": "uHDY1a_baseActions",
			"bases": "uHDY1a_bases",
			"error": "uHDY1a_error",
			"fileButton": "uHDY1a_fileButton",
			"baseMeta": "uHDY1a_baseMeta",
			"baseCard": "uHDY1a_baseCard",
			"eyebrow": "uHDY1a_eyebrow",
			"sourceItem": "uHDY1a_sourceItem",
			"row": "uHDY1a_row",
			"root": "uHDY1a_root",
			"secondary": "uHDY1a_secondary",
			"sourceMeta": "uHDY1a_sourceMeta",
			"muted": "uHDY1a_muted"
		};
		//#endregion
		//#region lib/types/client/KnowledgeWorkspace.js
		/** Full Knowledge Base workspace over the real Control Center knowledge service. */
		function KnowledgeWorkspace({ getKnowledge, useKnowledgeReady, close }) {
			const knowledgeReady = useKnowledgeReady((value) => value);
			const knowledge = knowledgeReady ? getKnowledge() : void 0;
			const [bases, setBases] = (0, react.useState)([]);
			const [selectedId, setSelectedId] = (0, react.useState)("");
			const [sources, setSources] = (0, react.useState)([]);
			const [chunks, setChunks] = (0, react.useState)([]);
			const [nextChunkCursor, setNextChunkCursor] = (0, react.useState)(null);
			const [indexing, setIndexing] = (0, react.useState)(null);
			const [indexResult, setIndexResult] = (0, react.useState)(null);
			const [baseName, setBaseName] = (0, react.useState)("");
			const [baseDescription, setBaseDescription] = (0, react.useState)("");
			const [textName, setTextName] = (0, react.useState)("");
			const [textBody, setTextBody] = (0, react.useState)("");
			const [urlText, setUrlText] = (0, react.useState)("");
			const [fileName, setFileName] = (0, react.useState)("");
			const [query, setQuery] = (0, react.useState)("");
			const [topK, setTopK] = (0, react.useState)(8);
			const [hits, setHits] = (0, react.useState)([]);
			const [retrievalProvider, setRetrievalProvider] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const selected = (0, react.useMemo)(() => bases.find((base) => base.id === selectedId) ?? null, [bases, selectedId]);
			const refreshBases = () => {
				if (knowledge === void 0) return;
				knowledge.listBases().then((result) => {
					if (!result.ok) {
						setError(result.error.message);
						return;
					}
					setBases(result.value.bases);
					if (result.value.bases.length === 0) {
						setSelectedId("");
						setSources([]);
						setChunks([]);
					} else if (!result.value.bases.some((base) => base.id === selectedId)) setSelectedId(result.value.bases[0].id);
				}).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
			};
			(0, react.useEffect)(() => {
				if (!knowledgeReady || knowledge === void 0) return;
				refreshBases();
			}, [knowledgeReady, knowledge]);
			(0, react.useEffect)(() => {
				if (!knowledgeReady || knowledge === void 0 || selectedId === "") return;
				let active = true;
				knowledge.listSources(selectedId).then((result) => {
					if (!active || !result.ok) return;
					setSources(result.value.sources);
				});
				knowledge.listChunks(selectedId, null, 50).then((result) => {
					if (!active || !result.ok) return;
					setChunks(result.value.chunks);
					setNextChunkCursor(result.value.nextCursor ?? null);
				});
				return () => {
					active = false;
				};
			}, [
				knowledgeReady,
				knowledge,
				selectedId
			]);
			const createBase = async () => {
				if (knowledge === void 0 || baseName.trim() === "") return;
				setError(null);
				const result = await knowledge.createBase({
					name: baseName,
					description: baseDescription,
					embeddingProvider: "local-hash"
				});
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				setBaseName("");
				setBaseDescription("");
				setSelectedId(result.value.id);
				refreshBases();
			};
			const deleteBase = async (id) => {
				if (knowledge === void 0) return;
				setError(null);
				const result = await knowledge.deleteBase(id);
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				refreshBases();
			};
			const addText = async () => {
				if (knowledge === void 0 || selectedId === "" || textBody.trim() === "") return;
				setError(null);
				const result = await knowledge.addText({
					baseId: selectedId,
					name: textName.trim() || `text-${Date.now()}`,
					text: textBody
				});
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				setTextName("");
				setTextBody("");
				reloadSources();
			};
			const addUrl = async () => {
				if (knowledge === void 0 || selectedId === "" || urlText.trim() === "") return;
				setError(null);
				setBusy(true);
				try {
					const result = await knowledge.addUrl({
						baseId: selectedId,
						url: urlText.trim()
					});
					if (!result.ok) {
						setError(result.error.message);
						return;
					}
					setUrlText("");
					reloadSources();
				} finally {
					setBusy(false);
				}
			};
			const addFile = async (file) => {
				if (knowledge === void 0 || selectedId === "") return;
				setError(null);
				const dataBase64 = await file.arrayBuffer().then((buffer) => {
					const bytes = new Uint8Array(buffer);
					let binary = "";
					for (const byte of bytes) binary += String.fromCharCode(byte);
					return btoa(binary);
				});
				const result = await knowledge.addFile({
					baseId: selectedId,
					name: fileName.trim() || file.name,
					dataBase64,
					mediaType: file.type || "text/plain"
				});
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				setFileName("");
				reloadSources();
			};
			const reloadSources = () => {
				if (knowledge === void 0 || selectedId === "") return;
				knowledge.listSources(selectedId).then((result) => {
					if (result.ok) setSources(result.value.sources);
				});
			};
			const deleteSource = async (id) => {
				if (knowledge === void 0 || selectedId === "") return;
				setError(null);
				const result = await knowledge.deleteSource(selectedId, id);
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				reloadSources();
				knowledge.listChunks(selectedId, null, 50).then((listResult) => {
					if (listResult.ok) {
						setChunks(listResult.value.chunks);
						setNextChunkCursor(listResult.value.nextCursor ?? null);
					}
				});
			};
			const indexBase = async () => {
				if (knowledge === void 0 || selectedId === "") return;
				setError(null);
				setIndexing(selectedId);
				try {
					const result = await knowledge.indexBase(selectedId);
					if (!result.ok) {
						setError(result.error.message);
						return;
					}
					setIndexResult(`已索引 ${result.value.sourcesIndexed} 个来源，写入 ${result.value.chunksWritten} 个分块`);
					reloadSources();
					knowledge.listChunks(selectedId, null, 50).then((listResult) => {
						if (listResult.ok) {
							setChunks(listResult.value.chunks);
							setNextChunkCursor(listResult.value.nextCursor ?? null);
						}
					});
				} finally {
					setIndexing(null);
				}
			};
			const recall = async () => {
				if (knowledge === void 0 || selectedId === "" || query.trim() === "") return;
				setError(null);
				const result = await knowledge.retrieve({
					baseId: selectedId,
					query: query.trim(),
					topK
				});
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				setHits(result.value.hits);
				setRetrievalProvider(result.value.embeddingProvider);
			};
			const loadMoreChunks = () => {
				if (knowledge === void 0 || selectedId === "" || nextChunkCursor === null) return;
				knowledge.listChunks(selectedId, nextChunkCursor, 50).then((result) => {
					if (!result.ok) {
						setError(result.error.message);
						return;
					}
					setChunks((current) => [...current, ...result.value.chunks]);
					setNextChunkCursor(result.value.nextCursor ?? null);
				});
			};
			if (!knowledgeReady) return (0, react_jsx_runtime.jsx)("main", {
				className: ` cc-surface`,
				children: (0, react_jsx_runtime.jsx)("p", {
					role: "status",
					children: "正在连接知识库服务…"
				})
			});
			return (0, react_jsx_runtime.jsxs)("main", {
				className: ` cc-surface`,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: KnowledgeWorkspace_module_css_default.header,
						children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("p", {
							className: KnowledgeWorkspace_module_css_default.eyebrow,
							children: "DSH Control Center"
						}), (0, react_jsx_runtime.jsx)("h1", { children: "知识库" })] }), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: KnowledgeWorkspace_module_css_default.secondary,
							onClick: close,
							children: "返回对话"
						})]
					}),
					error === null ? null : (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						className: KnowledgeWorkspace_module_css_default.error,
						children: error
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: KnowledgeWorkspace_module_css_default.panel,
						"aria-label": "新建知识库",
						children: [(0, react_jsx_runtime.jsx)("h2", { children: "新建知识库" }), (0, react_jsx_runtime.jsxs)("div", {
							className: KnowledgeWorkspace_module_css_default.row,
							children: [
								(0, react_jsx_runtime.jsx)("input", {
									"aria-label": "知识库名称",
									placeholder: "名称（必填）",
									value: baseName,
									onChange: (event) => {
										setBaseName(event.target.value);
									}
								}),
								(0, react_jsx_runtime.jsx)("input", {
									"aria-label": "知识库描述",
									placeholder: "描述（可选）",
									value: baseDescription,
									onChange: (event) => {
										setBaseDescription(event.target.value);
									}
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: baseName.trim() === "",
									onClick: () => {
										createBase();
									},
									children: "创建"
								})
							]
						})]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: KnowledgeWorkspace_module_css_default.bases,
						"aria-label": "知识库列表",
						children: [(0, react_jsx_runtime.jsxs)("h2", { children: [
							"知识库（",
							bases.length,
							"）"
						] }), bases.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
							className: KnowledgeWorkspace_module_css_default.empty,
							children: "暂无知识库，先创建一个。"
						}) : bases.map((base) => (0, react_jsx_runtime.jsxs)("article", {
							className: KnowledgeWorkspace_module_css_default.baseCard,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: KnowledgeWorkspace_module_css_default.baseMeta,
								children: [
									(0, react_jsx_runtime.jsx)("strong", { children: base.name }),
									(0, react_jsx_runtime.jsx)("span", { children: base.embedding.providerId === "local-hash" ? "本地 Hash Embedding" : `${base.embedding.providerId} · ${base.embedding.model ?? ""}` }),
									(0, react_jsx_runtime.jsxs)("span", { children: [
										base.sourceCount,
										" 个来源 · ",
										base.chunkCount,
										" 个分块"
									] })
								]
							}), (0, react_jsx_runtime.jsxs)("div", {
								className: KnowledgeWorkspace_module_css_default.baseActions,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: selected?.id === base.id ? KnowledgeWorkspace_module_css_default.primary : KnowledgeWorkspace_module_css_default.secondary,
									onClick: () => {
										setSelectedId(base.id);
										setHits([]);
									},
									children: "打开"
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: KnowledgeWorkspace_module_css_default.link,
									onClick: () => {
										deleteBase(base.id);
									},
									children: "删除"
								})]
							})]
						}, base.id))]
					}),
					selected !== null && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						(0, react_jsx_runtime.jsxs)("section", {
							className: KnowledgeWorkspace_module_css_default.panel,
							"aria-label": "添加来源",
							children: [(0, react_jsx_runtime.jsxs)("h2", { children: [
								"向「",
								selected.name,
								"」添加来源"
							] }), (0, react_jsx_runtime.jsxs)("div", {
								className: KnowledgeWorkspace_module_css_default.sourceTabs,
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										className: KnowledgeWorkspace_module_css_default.row,
										children: [
											(0, react_jsx_runtime.jsx)("input", {
												"aria-label": "文本名称",
												placeholder: "名称（可选）",
												value: textName,
												onChange: (event) => {
													setTextName(event.target.value);
												}
											}),
											(0, react_jsx_runtime.jsx)("textarea", {
												"aria-label": "文本内容",
												placeholder: "粘贴文本内容",
												value: textBody,
												onChange: (event) => {
													setTextBody(event.target.value);
												}
											}),
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: textBody.trim() === "",
												onClick: () => {
													addText();
												},
												children: "添加文本"
											})
										]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: KnowledgeWorkspace_module_css_default.row,
										children: [(0, react_jsx_runtime.jsx)("input", {
											"aria-label": "网页地址",
											placeholder: "https://…",
											value: urlText,
											onChange: (event) => {
												setUrlText(event.target.value);
											}
										}), (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: urlText.trim() === "" || busy,
											onClick: () => {
												addUrl();
											},
											children: busy ? "抓取中…" : "抓取网页"
										})]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: KnowledgeWorkspace_module_css_default.row,
										children: [(0, react_jsx_runtime.jsx)("input", {
											"aria-label": "文件名称",
											placeholder: "文件显示名（可选）",
											value: fileName,
											onChange: (event) => {
												setFileName(event.target.value);
											}
										}), (0, react_jsx_runtime.jsxs)("label", {
											className: KnowledgeWorkspace_module_css_default.fileButton,
											children: ["选择文本文件", (0, react_jsx_runtime.jsx)("input", {
												type: "file",
												accept: ".txt,.md,.html,.csv,.json,.yaml,.yml,text/plain,text/markdown,text/html,application/json,application/xml",
												onChange: (event) => {
													const file = event.target.files?.[0];
													if (file !== void 0) addFile(file);
													event.target.value = "";
												}
											})]
										})]
									})
								]
							})]
						}),
						(0, react_jsx_runtime.jsxs)("section", {
							className: KnowledgeWorkspace_module_css_default.panel,
							"aria-label": "索引与检索",
							children: [
								(0, react_jsx_runtime.jsx)("h2", { children: "索引与检索" }),
								(0, react_jsx_runtime.jsxs)("div", {
									className: KnowledgeWorkspace_module_css_default.row,
									children: [
										(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: indexing !== null,
											onClick: () => {
												indexBase();
											},
											children: indexing !== null ? "索引中…" : "建立索引"
										}),
										(0, react_jsx_runtime.jsx)("input", {
											"aria-label": "检索查询",
											placeholder: "输入查询，回车检索",
											value: query,
											onChange: (event) => {
												setQuery(event.target.value);
											},
											onKeyDown: (event) => {
												if (event.key === "Enter") recall();
											}
										}),
										(0, react_jsx_runtime.jsx)("select", {
											"aria-label": "返回条数",
											value: String(topK),
											onChange: (event) => {
												setTopK(Number(event.target.value));
											},
											children: [
												4,
												8,
												16
											].map((n) => (0, react_jsx_runtime.jsx)("option", {
												value: String(n),
												children: n
											}, n))
										}),
										(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: KnowledgeWorkspace_module_css_default.primary,
											disabled: query.trim() === "",
											onClick: () => {
												recall();
											},
											children: "检索"
										})
									]
								}),
								indexResult === null ? null : (0, react_jsx_runtime.jsx)("p", {
									className: KnowledgeWorkspace_module_css_default.muted,
									children: indexResult
								}),
								retrievalProvider === null ? null : (0, react_jsx_runtime.jsxs)("p", {
									className: KnowledgeWorkspace_module_css_default.muted,
									children: ["检索模式：", retrievalProvider]
								}),
								hits.length === 0 ? null : (0, react_jsx_runtime.jsx)("ol", {
									className: KnowledgeWorkspace_module_css_default.hits,
									"aria-label": "检索结果",
									children: hits.map((hit) => (0, react_jsx_runtime.jsxs)("li", {
										className: KnowledgeWorkspace_module_css_default.hit,
										children: [(0, react_jsx_runtime.jsxs)("div", {
											className: KnowledgeWorkspace_module_css_default.hitMeta,
											children: [(0, react_jsx_runtime.jsx)("strong", { children: hit.sourceName }), (0, react_jsx_runtime.jsxs)("span", { children: ["得分 ", hit.score.toFixed(3)] })]
										}), (0, react_jsx_runtime.jsx)("p", { children: hit.text })]
									}, hit.chunkId))
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("section", {
							className: KnowledgeWorkspace_module_css_default.panel,
							"aria-label": "来源与分块",
							children: [
								(0, react_jsx_runtime.jsxs)("h2", { children: [
									"来源（",
									sources.length,
									"）"
								] }),
								sources.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
									className: KnowledgeWorkspace_module_css_default.empty,
									children: "还没有来源。"
								}) : sources.map((source) => (0, react_jsx_runtime.jsxs)("article", {
									className: KnowledgeWorkspace_module_css_default.sourceItem,
									children: [(0, react_jsx_runtime.jsxs)("div", {
										className: KnowledgeWorkspace_module_css_default.sourceMeta,
										children: [(0, react_jsx_runtime.jsx)("strong", { children: source.name }), (0, react_jsx_runtime.jsxs)("span", { children: [
											source.kind,
											" · ",
											source.chunks,
											" 个分块 · ",
											source.tokens,
											" tokens · ",
											source.status
										] })]
									}), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: KnowledgeWorkspace_module_css_default.link,
										onClick: () => {
											deleteSource(source.id);
										},
										children: "删除"
									})]
								}, source.id)),
								(0, react_jsx_runtime.jsxs)("h2", { children: [
									"分块（",
									chunks.length,
									"）"
								] }),
								chunks.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
									className: KnowledgeWorkspace_module_css_default.empty,
									children: "索引后才会生成分块。"
								}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [chunks.map((chunk) => (0, react_jsx_runtime.jsxs)("details", {
									className: KnowledgeWorkspace_module_css_default.chunk,
									children: [(0, react_jsx_runtime.jsxs)("summary", { children: [
										chunk.sourceName,
										" · #",
										chunk.position,
										" · ",
										chunk.tokens,
										" tokens"
									] }), (0, react_jsx_runtime.jsx)("p", { children: chunk.text })]
								}, chunk.id)), nextChunkCursor === null ? null : (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: KnowledgeWorkspace_module_css_default.secondary,
									onClick: loadMoreChunks,
									children: "加载更多分块"
								})] })
							]
						})
					] })
				]
			});
		}
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
					method: "installSkill",
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
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\SkillsSection.module.css.mjs
		const css$21 = ".pyHmqW_searchRow{gap:8px;display:flex}.pyHmqW_searchInput{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 10px;font-family:inherit;font-size:14px}.pyHmqW_searchInput:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.pyHmqW_searchInput::placeholder{color:var(--foreground-tertiary)}.pyHmqW_grid{grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;display:grid}.pyHmqW_card{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;flex-direction:column;gap:8px;padding:14px 16px;display:flex}.pyHmqW_cardHeader{justify-content:space-between;align-items:center;gap:8px;display:flex}.pyHmqW_cardTitle{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:14px;font-weight:600;overflow:hidden}.pyHmqW_cardActions{align-items:center;gap:4px;display:flex}.pyHmqW_cardDescription{color:var(--muted-foreground);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:13px;line-height:20px;display:-webkit-box;overflow:hidden}.pyHmqW_cardMeta{flex-wrap:wrap;align-items:center;gap:4px 12px;display:flex}.pyHmqW_cardMetaItem{color:var(--foreground-tertiary);align-items:center;gap:4px;font-size:12px;display:inline-flex}.pyHmqW_cardFooter{border-top:1px solid var(--border-subtle);justify-content:space-between;align-items:center;gap:8px;padding-top:8px;display:flex}.pyHmqW_cardTags{flex-wrap:wrap;gap:4px;min-width:0;display:flex}.pyHmqW_tag{background:var(--muted);height:20px;color:var(--muted-foreground);border-radius:9999px;align-items:center;padding:0 8px;font-size:12px;display:inline-flex}";
		const tagId$21 = "@dsh-control-center/bundle/SkillsSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$21) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$21;
			tag.textContent = css$21;
			document.head.appendChild(tag);
		}
		var SkillsSection_module_css_default = {
			"cardMeta": "pyHmqW_cardMeta",
			"cardTags": "pyHmqW_cardTags",
			"card": "pyHmqW_card",
			"cardMetaItem": "pyHmqW_cardMetaItem",
			"tag": "pyHmqW_tag",
			"cardTitle": "pyHmqW_cardTitle",
			"searchInput": "pyHmqW_searchInput",
			"cardDescription": "pyHmqW_cardDescription",
			"cardFooter": "pyHmqW_cardFooter",
			"grid": "pyHmqW_grid",
			"cardHeader": "pyHmqW_cardHeader",
			"cardActions": "pyHmqW_cardActions",
			"searchRow": "pyHmqW_searchRow"
		};
		//#endregion
		//#region lib/types/client/SkillsSection.js
		/**
		* Skills catalog section component.
		*
		* Cherry-style skills management UI over the controlCenterSkills Remote service.
		* Displays installed skills in a card grid with search, enable/disable, and uninstall actions.
		*
		* AGPL-3.0-only – adapted from Cherry Studio ResourceCatalog pattern for skills.
		*/
		function SkillsSection(props) {
			const { skills: skillsService } = props;
			const [skills, setSkills] = (0, react.useState)([]);
			const [search, setSearch] = (0, react.useState)("");
			const [loading, setLoading] = (0, react.useState)(true);
			const [error, setError] = (0, react.useState)(null);
			const loadSkills = (0, react.useCallback)(async () => {
				if (!skillsService) {
					setError("Skills service not available");
					setLoading(false);
					return;
				}
				try {
					setLoading(true);
					setError(null);
					const params = search ? { search } : {};
					const result = await skillsService.list(params);
					if (!result.ok) throw new Error(result.error.message);
					setSkills(result.value);
				} catch (err) {
					setError(err instanceof Error ? err.message : "Failed to load skills");
				} finally {
					setLoading(false);
				}
			}, [skillsService, search]);
			(0, react.useEffect)(() => {
				loadSkills();
			}, [loadSkills]);
			const handleToggleEnable = (0, react.useCallback)(async (skillId, currentEnabled) => {
				if (!skillsService) return;
				try {
					const result = await skillsService.update(skillId, { isGlobalEnabled: !currentEnabled });
					if (!result.ok) throw new Error(result.error.message);
					await loadSkills();
				} catch (err) {
					setError(err instanceof Error ? err.message : "Failed to update skill");
				}
			}, [skillsService, loadSkills]);
			const handleUninstall = (0, react.useCallback)(async (skillId, skillName) => {
				if (!skillsService) return;
				if (!window.confirm(`确定要卸载 "${skillName}" 吗？`)) return;
				try {
					const result = await skillsService.uninstall(skillId);
					if (!result.ok) throw new Error(result.error.message);
					await loadSkills();
				} catch (err) {
					setError(err instanceof Error ? err.message : "Failed to uninstall skill");
				}
			}, [skillsService, loadSkills]);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "cc-settings-column",
				children: [
					(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h1", {
						className: "cc-page-title",
						children: "Skills"
					}), (0, react_jsx_runtime.jsx)("p", {
						className: "cc-page-description",
						children: "管理已安装的 Skills，启用或禁用功能"
					})] }),
					(0, react_jsx_runtime.jsxs)("div", {
						className: "cc-field-row",
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: "cc-field-label",
							children: "技能市场"
						}), (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								gap: 8
							},
							children: [(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "cc-btn cc-btn-secondary",
								disabled: true,
								children: "从市场安装"
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "cc-btn cc-btn-primary",
								disabled: true,
								children: "从本地安装"
							})]
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: SkillsSection_module_css_default.searchRow,
						children: (0, react_jsx_runtime.jsx)("input", {
							type: "text",
							className: SkillsSection_module_css_default.searchInput,
							placeholder: "搜索 Skills...",
							value: search,
							onChange: (e) => setSearch(e.target.value)
						})
					}),
					loading ? (0, react_jsx_runtime.jsx)("div", {
						className: "cc-loading",
						children: "加载中..."
					}) : error ? (0, react_jsx_runtime.jsxs)("div", {
						className: "cc-notice-error",
						children: [error, (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "cc-btn cc-btn-ghost",
							onClick: () => loadSkills(),
							style: { marginLeft: 8 },
							children: "重试"
						})]
					}) : skills.length === 0 ? (0, react_jsx_runtime.jsxs)("div", {
						className: "cc-empty",
						children: [(0, react_jsx_runtime.jsx)("div", {
							className: "cc-empty-title",
							children: "暂无已安装的 Skills"
						}), (0, react_jsx_runtime.jsx)("div", {
							className: "cc-empty-description",
							children: search ? "没有找到匹配的 Skills" : "点击上方按钮安装新的 Skill"
						})]
					}) : (0, react_jsx_runtime.jsx)("div", {
						className: SkillsSection_module_css_default.grid,
						children: skills.map((skill) => (0, react_jsx_runtime.jsxs)("div", {
							className: SkillsSection_module_css_default.card,
							children: [
								(0, react_jsx_runtime.jsxs)("div", {
									className: SkillsSection_module_css_default.cardHeader,
									children: [(0, react_jsx_runtime.jsx)("h3", {
										className: SkillsSection_module_css_default.cardTitle,
										children: skill.name
									}), (0, react_jsx_runtime.jsxs)("div", {
										className: SkillsSection_module_css_default.cardActions,
										children: [(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "cc-icon-btn",
											title: skill.isGlobalEnabled ? "禁用" : "启用",
											onClick: () => handleToggleEnable(skill.id, skill.isGlobalEnabled),
											children: skill.isGlobalEnabled ? (0, react_jsx_runtime.jsx)("svg", {
												width: "16",
												height: "16",
												viewBox: "0 0 16 16",
												fill: "none",
												children: (0, react_jsx_runtime.jsx)("path", {
													d: "M8 2C4.7 2 2 4.7 2 8C2 11.3 4.7 14 8 14C11.3 14 14 11.3 14 8C14 4.7 11.3 2 8 2ZM6.5 11L3 7.5L4.4 6.1L6.5 8.2L11.6 3.1L13 4.5L6.5 11Z",
													fill: "currentColor"
												})
											}) : (0, react_jsx_runtime.jsx)("svg", {
												width: "16",
												height: "16",
												viewBox: "0 0 16 16",
												fill: "none",
												children: (0, react_jsx_runtime.jsx)("circle", {
													cx: "8",
													cy: "8",
													r: "6",
													stroke: "currentColor",
													strokeWidth: "2",
													fill: "none"
												})
											})
										}), (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "cc-icon-btn",
											title: "卸载",
											onClick: () => handleUninstall(skill.id, skill.name),
											children: (0, react_jsx_runtime.jsx)("svg", {
												width: "16",
												height: "16",
												viewBox: "0 0 16 16",
												fill: "none",
												children: (0, react_jsx_runtime.jsx)("path", {
													d: "M3 5H13L12 14H4L3 5ZM6 2H10V3H6V2ZM7 7V12H8V7H7ZM9 7V12H10V7H9Z",
													fill: "currentColor"
												})
											})
										})]
									})]
								}),
								skill.description && (0, react_jsx_runtime.jsx)("p", {
									className: SkillsSection_module_css_default.cardDescription,
									children: skill.description
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: SkillsSection_module_css_default.cardMeta,
									children: [
										skill.author && (0, react_jsx_runtime.jsxs)("span", {
											className: SkillsSection_module_css_default.cardMetaItem,
											children: [(0, react_jsx_runtime.jsxs)("svg", {
												width: "12",
												height: "12",
												viewBox: "0 0 12 12",
												fill: "none",
												children: [(0, react_jsx_runtime.jsx)("circle", {
													cx: "6",
													cy: "4",
													r: "2",
													stroke: "currentColor",
													strokeWidth: "1.5"
												}), (0, react_jsx_runtime.jsx)("path", {
													d: "M2 10C2 8.34315 3.34315 7 5 7H7C8.65685 7 10 8.34315 10 10",
													stroke: "currentColor",
													strokeWidth: "1.5",
													strokeLinecap: "round"
												})]
											}), skill.author]
										}),
										skill.version && (0, react_jsx_runtime.jsxs)("span", {
											className: SkillsSection_module_css_default.cardMetaItem,
											children: [
												(0, react_jsx_runtime.jsx)("svg", {
													width: "12",
													height: "12",
													viewBox: "0 0 12 12",
													fill: "none",
													children: (0, react_jsx_runtime.jsx)("path", {
														d: "M6 2L3 4V8L6 10L9 8V4L6 2Z",
														stroke: "currentColor",
														strokeWidth: "1.5",
														strokeLinecap: "round",
														strokeLinejoin: "round"
													})
												}),
												"v",
												skill.version
											]
										}),
										skill.source && (0, react_jsx_runtime.jsxs)("span", {
											className: SkillsSection_module_css_default.cardMetaItem,
											children: [(0, react_jsx_runtime.jsx)("svg", {
												width: "12",
												height: "12",
												viewBox: "0 0 12 12",
												fill: "none",
												children: (0, react_jsx_runtime.jsx)("rect", {
													x: "2",
													y: "2",
													width: "8",
													height: "8",
													rx: "1",
													stroke: "currentColor",
													strokeWidth: "1.5"
												})
											}), skill.source]
										})
									]
								}),
								(skill.sourceTags.length > 0 || skill.isGlobalEnabled) && (0, react_jsx_runtime.jsxs)("div", {
									className: SkillsSection_module_css_default.cardFooter,
									children: [(0, react_jsx_runtime.jsx)("div", {
										className: SkillsSection_module_css_default.cardTags,
										children: skill.sourceTags.slice(0, 3).map((tag) => (0, react_jsx_runtime.jsx)("span", {
											className: SkillsSection_module_css_default.tag,
											children: tag
										}, tag))
									}), (0, react_jsx_runtime.jsx)("div", { children: skill.isGlobalEnabled ? (0, react_jsx_runtime.jsx)("span", {
										className: "cc-badge-enabled",
										children: "已启用"
									}) : (0, react_jsx_runtime.jsx)("span", {
										className: "cc-badge-disabled",
										children: "未启用"
									}) })]
								})
							]
						}, skill.id))
					})
				]
			});
		}
		//#endregion
		//#region lib/types/provider-remote-client.js
		/** Client descriptor contribution for the Control Center providers service. */
		const providersRemote = {
			package: "@dsh-control-center/control-center",
			descriptors: [
				{
					method: "list",
					parameters: []
				},
				{
					method: "get",
					parameters: ["providerId"]
				},
				{
					method: "create",
					parameters: ["dto"]
				},
				{
					method: "update",
					parameters: ["providerId", "dto"]
				},
				{
					method: "delete",
					parameters: ["providerId"]
				},
				{
					method: "testConnection",
					parameters: ["providerId"]
				},
				{
					method: "discoverModels",
					parameters: ["providerId"]
				},
				{
					method: "updateModel",
					parameters: [
						"providerId",
						"modelId",
						"dto"
					]
				}
			].map(({ method, implementation, parameters }) => ({
				id: `@dsh-control-center/control-center#controlCenterProviders/${method}`,
				service: "controlCenterProviders",
				namespace: "controlCenterProviders",
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
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\ProviderAuthentication.module.css.mjs
		const css$20 = ".AU4RWG_section{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;flex-direction:column;gap:12px;padding:16px;display:flex}.AU4RWG_sectionTitle{color:var(--foreground);font-size:15px;font-weight:600}.AU4RWG_field{flex-direction:column;gap:6px;display:flex}.AU4RWG_fieldLabel{color:var(--foreground);font-size:13px;font-weight:500}.AU4RWG_fieldLink{color:var(--muted-foreground);font-size:12px}.AU4RWG_inputGroup{align-items:center;display:flex;position:relative}.AU4RWG_input{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 10px;font-family:inherit;font-size:14px}.AU4RWG_input:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.AU4RWG_inputAddon{color:var(--foreground-tertiary);pointer-events:none;font-size:12px;position:absolute;right:10px}.AU4RWG_inputRow{align-items:center;gap:8px;display:flex}.AU4RWG_inputRow .AU4RWG_input{flex:1;min-width:0}.AU4RWG_iconButton{width:32px;height:32px;color:var(--muted-foreground);cursor:pointer;background:0 0;border:none;border-radius:8px;justify-content:center;align-items:center;padding:0;display:inline-flex}.AU4RWG_iconButton:hover{background:var(--muted);color:var(--foreground)}.AU4RWG_actionRow{align-items:center;gap:8px;display:flex}.AU4RWG_primaryButton{background:var(--primary);height:32px;color:var(--primary-foreground);cursor:pointer;border:1px solid #0000;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.AU4RWG_primaryButton:hover:not(:disabled){background:var(--cs-brand-600)}.AU4RWG_primaryButton:disabled{opacity:.5;cursor:not-allowed}.AU4RWG_secondaryButton{border:1px solid var(--border-subtle);background:var(--secondary);height:32px;color:var(--secondary-foreground);cursor:pointer;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.AU4RWG_secondaryButton:hover:not(:disabled){background:var(--secondary-hover)}.AU4RWG_secondaryButton:disabled{opacity:.5;cursor:not-allowed}.AU4RWG_successMessage{color:var(--success);font-size:13px}.AU4RWG_errorMessage{color:var(--error);font-size:13px}.AU4RWG_timestamp{color:var(--foreground-tertiary);font-size:12px}.AU4RWG_spin{animation:1s linear infinite AU4RWG_cc-spin}@keyframes AU4RWG_cc-spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}";
		const tagId$20 = "@dsh-control-center/bundle/ProviderAuthentication.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$20) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$20;
			tag.textContent = css$20;
			document.head.appendChild(tag);
		}
		var ProviderAuthentication_module_css_default = {
			"secondaryButton": "AU4RWG_secondaryButton",
			"fieldLabel": "AU4RWG_fieldLabel",
			"spin": "AU4RWG_spin",
			"input": "AU4RWG_input",
			"cc-spin": "AU4RWG_cc-spin",
			"section": "AU4RWG_section",
			"errorMessage": "AU4RWG_errorMessage",
			"fieldLink": "AU4RWG_fieldLink",
			"iconButton": "AU4RWG_iconButton",
			"primaryButton": "AU4RWG_primaryButton",
			"inputGroup": "AU4RWG_inputGroup",
			"successMessage": "AU4RWG_successMessage",
			"field": "AU4RWG_field",
			"sectionTitle": "AU4RWG_sectionTitle",
			"inputAddon": "AU4RWG_inputAddon",
			"inputRow": "AU4RWG_inputRow",
			"actionRow": "AU4RWG_actionRow",
			"timestamp": "AU4RWG_timestamp"
		};
		//#endregion
		//#region lib/types/client/ProviderAuthentication.js
		function ProviderAuthentication({ provider, onUpdateProvider, onTestConnection, onDiscoverModels, isTestingConnection, isDiscoveringModels, connectionTestResult }) {
			const [apiKey, setApiKey] = (0, react.useState)("");
			const [baseURL, setBaseURL] = (0, react.useState)(provider.baseURL || "");
			const [showApiKey, setShowApiKey] = (0, react.useState)(false);
			const [hasEdits, setHasEdits] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				setBaseURL(provider.baseURL || "");
				setApiKey("");
				setHasEdits(false);
			}, [provider.id, provider.baseURL]);
			const handleApiKeyChange = (0, react.useCallback)((value) => {
				setApiKey(value);
				setHasEdits(true);
			}, []);
			const handleBaseURLChange = (0, react.useCallback)((value) => {
				setBaseURL(value);
				setHasEdits(true);
			}, []);
			const handleSave = (0, react.useCallback)(async () => {
				if (!hasEdits) return;
				await onUpdateProvider({
					...apiKey ? { apiKey } : {},
					...baseURL !== provider.baseURL ? { baseURL } : {}
				});
				setHasEdits(false);
				setApiKey("");
			}, [
				hasEdits,
				apiKey,
				baseURL,
				provider.baseURL,
				onUpdateProvider
			]);
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ProviderAuthentication_module_css_default.section,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: ProviderAuthentication_module_css_default.sectionTitle,
						children: "Authentication"
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ProviderAuthentication_module_css_default.field,
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								className: ProviderAuthentication_module_css_default.fieldLabel,
								children: [(0, react_jsx_runtime.jsx)("span", { children: "API Key" }), (0, react_jsx_runtime.jsx)("a", {
									href: getApiKeyUrl(provider.type),
									target: "_blank",
									rel: "noopener noreferrer",
									className: ProviderAuthentication_module_css_default.fieldLink,
									children: "Get API Key"
								})]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: ProviderAuthentication_module_css_default.inputRow,
								children: [(0, react_jsx_runtime.jsxs)("div", {
									className: ProviderAuthentication_module_css_default.inputGroup,
									children: [(0, react_jsx_runtime.jsx)("input", {
										type: showApiKey ? "text" : "password",
										className: ProviderAuthentication_module_css_default.input,
										value: apiKey,
										placeholder: provider.hasApiKey ? "••••••••••••••••" : "Enter your API key",
										onChange: (e) => handleApiKeyChange(e.target.value)
									}), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ProviderAuthentication_module_css_default.inputAddon,
										onClick: () => setShowApiKey(!showApiKey),
										title: showApiKey ? "Hide API key" : "Show API key",
										children: (0, react_jsx_runtime.jsx)("svg", {
											width: "14",
											height: "14",
											viewBox: "0 0 24 24",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "2",
											children: showApiKey ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("path", { d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" }), (0, react_jsx_runtime.jsx)("line", {
												x1: "1",
												y1: "1",
												x2: "23",
												y2: "23"
											})] }) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), (0, react_jsx_runtime.jsx)("circle", {
												cx: "12",
												cy: "12",
												r: "3"
											})] })
										})
									})]
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ProviderAuthentication_module_css_default.iconButton,
									onClick: onTestConnection,
									disabled: isTestingConnection || !provider.hasApiKey && !apiKey,
									title: "Test connection",
									children: isTestingConnection ? (0, react_jsx_runtime.jsx)("svg", {
										width: "14",
										height: "14",
										viewBox: "0 0 24 24",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "2",
										className: ProviderAuthentication_module_css_default.spin,
										children: (0, react_jsx_runtime.jsx)("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })
									}) : (0, react_jsx_runtime.jsx)("svg", {
										width: "14",
										height: "14",
										viewBox: "0 0 24 24",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "2",
										children: (0, react_jsx_runtime.jsx)("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" })
									})
								})]
							}),
							connectionTestResult && (0, react_jsx_runtime.jsx)("div", {
								className: connectionTestResult.success ? ProviderAuthentication_module_css_default.successMessage : ProviderAuthentication_module_css_default.errorMessage,
								children: connectionTestResult.success ? `Connected successfully (${connectionTestResult.latencyMs}ms)` : connectionTestResult.error
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ProviderAuthentication_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("div", {
							className: ProviderAuthentication_module_css_default.fieldLabel,
							children: (0, react_jsx_runtime.jsx)("span", { children: "Base URL" })
						}), (0, react_jsx_runtime.jsx)("input", {
							type: "text",
							className: ProviderAuthentication_module_css_default.input,
							value: baseURL,
							placeholder: "https://api.example.com",
							onChange: (e) => handleBaseURLChange(e.target.value)
						})]
					}),
					hasEdits && (0, react_jsx_runtime.jsxs)("div", {
						className: ProviderAuthentication_module_css_default.actionRow,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ProviderAuthentication_module_css_default.primaryButton,
							onClick: handleSave,
							children: "Save Changes"
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ProviderAuthentication_module_css_default.secondaryButton,
							onClick: () => {
								setApiKey("");
								setBaseURL(provider.baseURL || "");
								setHasEdits(false);
							},
							children: "Cancel"
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ProviderAuthentication_module_css_default.actionRow,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ProviderAuthentication_module_css_default.secondaryButton,
							onClick: onDiscoverModels,
							disabled: isDiscoveringModels || !provider.hasApiKey && !apiKey,
							children: isDiscoveringModels ? "Discovering..." : "Discover Models"
						}), provider.lastDiscoveredAt && (0, react_jsx_runtime.jsxs)("span", {
							className: ProviderAuthentication_module_css_default.timestamp,
							children: ["Last discovered: ", new Date(provider.lastDiscoveredAt).toLocaleString()]
						})]
					})
				]
			});
		}
		function getApiKeyUrl(providerType) {
			return {
				openai: "https://platform.openai.com/api-keys",
				anthropic: "https://console.anthropic.com/settings/keys",
				gemini: "https://aistudio.google.com/app/apikey",
				deepseek: "https://platform.deepseek.com/api_keys",
				groq: "https://console.groq.com/keys",
				"mistral-ai": "https://console.mistral.ai/api-keys",
				cohere: "https://dashboard.cohere.com/api-keys"
			}[providerType] || "#";
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\ProviderModelList.module.css.mjs
		const css$19 = "._2yiUCa_section{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;flex-direction:column;gap:12px;padding:16px;display:flex}._2yiUCa_sectionHeaderRow{justify-content:space-between;align-items:center;gap:8px;display:flex}._2yiUCa_sectionHeading{color:var(--foreground);font-size:15px;font-weight:600}._2yiUCa_headerMeta{align-items:center;gap:8px;display:flex}._2yiUCa_enabledCount{color:var(--success);font-size:12px}._2yiUCa_groupCount{color:var(--foreground-tertiary);font-size:12px}._2yiUCa_modelList{flex-direction:column;gap:2px;display:flex}._2yiUCa_modelGroup{flex-direction:column;gap:2px;margin-top:8px;display:flex}._2yiUCa_modelGroup:first-child{margin-top:0}._2yiUCa_groupHeader{align-items:center;gap:8px;padding:4px 8px;display:flex}._2yiUCa_groupTitle{color:var(--foreground-tertiary);text-transform:uppercase;letter-spacing:.04em;font-size:12px;font-weight:500}._2yiUCa_countBadge{background:var(--muted);height:18px;color:var(--muted-foreground);border-radius:9999px;align-items:center;padding:0 6px;font-size:11px;display:inline-flex}._2yiUCa_modelItem{box-sizing:border-box;cursor:pointer;text-align:left;background:0 0;border:none;border-radius:8px;align-items:center;gap:10px;width:100%;padding:6px 8px;display:flex}._2yiUCa_modelItem:hover{background:var(--muted)}._2yiUCa_modelItemDisabled{opacity:.55}._2yiUCa_modelIcon{color:var(--muted-foreground);flex:none}._2yiUCa_modelMain{flex:1;min-width:0}._2yiUCa_modelInfo{min-width:0}._2yiUCa_modelName{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:14px;overflow:hidden}._2yiUCa_modelMeta{flex-wrap:wrap;gap:4px 10px;margin-top:1px;display:flex}._2yiUCa_metaItem{color:var(--foreground-tertiary);font-size:12px}._2yiUCa_toggleButton{background:var(--input);cursor:pointer;border:none;border-radius:9999px;flex:none;width:36px;height:20px;padding:0;transition:background .15s;position:relative}._2yiUCa_toggleThumb{background:var(--popover-foreground);border-radius:50%;width:16px;height:16px;transition:transform .15s;position:absolute;top:2px;left:2px}._2yiUCa_toggleButtonEnabled{background:var(--primary)}._2yiUCa_toggleButtonEnabled ._2yiUCa_toggleThumb{transform:translate(16px)}._2yiUCa_toggleButtonDisabled{background:var(--input)}._2yiUCa_emptyState{color:var(--muted-foreground);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:6px;padding:32px 16px;display:flex}._2yiUCa_emptyIcon{color:var(--foreground-tertiary)}._2yiUCa_emptyText{color:var(--foreground);font-size:14px}._2yiUCa_emptyHint{color:var(--muted-foreground);font-size:12px}._2yiUCa_discoveryInfo{color:var(--info);font-size:12px}";
		const tagId$19 = "@dsh-control-center/bundle/ProviderModelList.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$19) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$19;
			tag.textContent = css$19;
			document.head.appendChild(tag);
		}
		var ProviderModelList_module_css_default = {
			"section": "_2yiUCa_section",
			"headerMeta": "_2yiUCa_headerMeta",
			"modelGroup": "_2yiUCa_modelGroup",
			"sectionHeading": "_2yiUCa_sectionHeading",
			"modelMeta": "_2yiUCa_modelMeta",
			"modelMain": "_2yiUCa_modelMain",
			"groupHeader": "_2yiUCa_groupHeader",
			"countBadge": "_2yiUCa_countBadge",
			"modelItem": "_2yiUCa_modelItem",
			"modelName": "_2yiUCa_modelName",
			"toggleButton": "_2yiUCa_toggleButton",
			"modelItemDisabled": "_2yiUCa_modelItemDisabled",
			"toggleThumb": "_2yiUCa_toggleThumb",
			"toggleButtonDisabled": "_2yiUCa_toggleButtonDisabled",
			"emptyState": "_2yiUCa_emptyState",
			"groupTitle": "_2yiUCa_groupTitle",
			"sectionHeaderRow": "_2yiUCa_sectionHeaderRow",
			"modelIcon": "_2yiUCa_modelIcon",
			"modelInfo": "_2yiUCa_modelInfo",
			"enabledCount": "_2yiUCa_enabledCount",
			"emptyIcon": "_2yiUCa_emptyIcon",
			"toggleButtonEnabled": "_2yiUCa_toggleButtonEnabled",
			"modelList": "_2yiUCa_modelList",
			"emptyText": "_2yiUCa_emptyText",
			"discoveryInfo": "_2yiUCa_discoveryInfo",
			"groupCount": "_2yiUCa_groupCount",
			"metaItem": "_2yiUCa_metaItem",
			"emptyHint": "_2yiUCa_emptyHint"
		};
		//#endregion
		//#region lib/types/client/ProviderModelList.js
		function ProviderModelList({ provider, onToggleModel }) {
			const { enabledModels, disabledModels } = (0, react.useMemo)(() => {
				return {
					enabledModels: provider.models.filter((m) => m.enabled),
					disabledModels: provider.models.filter((m) => !m.enabled)
				};
			}, [provider.models]);
			if (provider.models.length === 0) return (0, react_jsx_runtime.jsxs)("section", {
				className: ProviderModelList_module_css_default.section,
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: ProviderModelList_module_css_default.sectionHeaderRow,
					children: [(0, react_jsx_runtime.jsx)("h3", {
						className: ProviderModelList_module_css_default.sectionHeading,
						children: "Models"
					}), (0, react_jsx_runtime.jsx)("span", {
						className: ProviderModelList_module_css_default.countBadge,
						children: "0"
					})]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: ProviderModelList_module_css_default.emptyState,
					children: [
						(0, react_jsx_runtime.jsxs)("svg", {
							width: "40",
							height: "40",
							viewBox: "0 0 40 40",
							fill: "none",
							className: ProviderModelList_module_css_default.emptyIcon,
							children: [(0, react_jsx_runtime.jsx)("rect", {
								x: "8",
								y: "8",
								width: "24",
								height: "24",
								rx: "4",
								stroke: "currentColor",
								strokeWidth: "2",
								opacity: "0.3"
							}), (0, react_jsx_runtime.jsx)("path", {
								d: "M14 20H26M20 14V26",
								stroke: "currentColor",
								strokeWidth: "2",
								strokeLinecap: "round",
								opacity: "0.3"
							})]
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: ProviderModelList_module_css_default.emptyText,
							children: "No models discovered yet"
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: ProviderModelList_module_css_default.emptyHint,
							children: "Click \"Discover Models\" to fetch available models from this provider"
						})
					]
				})]
			});
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ProviderModelList_module_css_default.section,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: ProviderModelList_module_css_default.sectionHeaderRow,
						children: [(0, react_jsx_runtime.jsx)("h3", {
							className: ProviderModelList_module_css_default.sectionHeading,
							children: "Models"
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: ProviderModelList_module_css_default.headerMeta,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: ProviderModelList_module_css_default.countBadge,
								children: provider.models.length
							}), enabledModels.length > 0 && (0, react_jsx_runtime.jsxs)("span", {
								className: ProviderModelList_module_css_default.enabledCount,
								children: [enabledModels.length, " enabled"]
							})]
						})]
					}),
					enabledModels.length > 0 && (0, react_jsx_runtime.jsxs)("div", {
						className: ProviderModelList_module_css_default.modelGroup,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: ProviderModelList_module_css_default.groupHeader,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: ProviderModelList_module_css_default.groupTitle,
								children: "Enabled"
							}), (0, react_jsx_runtime.jsx)("span", {
								className: ProviderModelList_module_css_default.groupCount,
								children: enabledModels.length
							})]
						}), (0, react_jsx_runtime.jsx)("div", {
							className: ProviderModelList_module_css_default.modelList,
							children: enabledModels.map((model) => (0, react_jsx_runtime.jsx)(ModelItem, {
								model,
								onToggle: onToggleModel
							}, model.id))
						})]
					}),
					disabledModels.length > 0 && (0, react_jsx_runtime.jsxs)("div", {
						className: ProviderModelList_module_css_default.modelGroup,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: ProviderModelList_module_css_default.groupHeader,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: ProviderModelList_module_css_default.groupTitle,
								children: "Disabled"
							}), (0, react_jsx_runtime.jsx)("span", {
								className: ProviderModelList_module_css_default.groupCount,
								children: disabledModels.length
							})]
						}), (0, react_jsx_runtime.jsx)("div", {
							className: ProviderModelList_module_css_default.modelList,
							children: disabledModels.map((model) => (0, react_jsx_runtime.jsx)(ModelItem, {
								model,
								onToggle: onToggleModel
							}, model.id))
						})]
					}),
					provider.lastDiscoveredAt && (0, react_jsx_runtime.jsxs)("div", {
						className: ProviderModelList_module_css_default.discoveryInfo,
						children: ["Last discovered: ", new Date(provider.lastDiscoveredAt).toLocaleString()]
					})
				]
			});
		}
		function ModelItem({ model, onToggle }) {
			const handleToggle = async () => {
				if (onToggle) await onToggle(model.id, !model.enabled);
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: `${ProviderModelList_module_css_default.modelItem} ${model.enabled ? ProviderModelList_module_css_default.modelItemEnabled : ProviderModelList_module_css_default.modelItemDisabled}`,
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: ProviderModelList_module_css_default.modelMain,
					children: [(0, react_jsx_runtime.jsx)("div", {
						className: ProviderModelList_module_css_default.modelIcon,
						children: (0, react_jsx_runtime.jsxs)("svg", {
							width: "16",
							height: "16",
							viewBox: "0 0 16 16",
							fill: "none",
							children: [(0, react_jsx_runtime.jsx)("rect", {
								width: "16",
								height: "16",
								rx: "3",
								fill: "currentColor",
								opacity: "0.1"
							}), (0, react_jsx_runtime.jsx)("path", {
								d: "M8 5V8L10 10",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round",
								strokeLinejoin: "round"
							})]
						})
					}), (0, react_jsx_runtime.jsxs)("div", {
						className: ProviderModelList_module_css_default.modelInfo,
						children: [(0, react_jsx_runtime.jsx)("div", {
							className: ProviderModelList_module_css_default.modelName,
							children: model.name
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: ProviderModelList_module_css_default.modelMeta,
							children: [
								model.contextWindow && (0, react_jsx_runtime.jsxs)("span", {
									className: ProviderModelList_module_css_default.metaItem,
									children: [(0, react_jsx_runtime.jsx)("svg", {
										width: "10",
										height: "10",
										viewBox: "0 0 10 10",
										fill: "none",
										children: (0, react_jsx_runtime.jsx)("rect", {
											x: "2",
											y: "2",
											width: "6",
											height: "6",
											rx: "1",
											stroke: "currentColor",
											strokeWidth: "1"
										})
									}), formatContextWindow(model.contextWindow)]
								}),
								model.maxOutputTokens && (0, react_jsx_runtime.jsxs)("span", {
									className: ProviderModelList_module_css_default.metaItem,
									children: [
										(0, react_jsx_runtime.jsx)("svg", {
											width: "10",
											height: "10",
											viewBox: "0 0 10 10",
											fill: "none",
											children: (0, react_jsx_runtime.jsx)("path", {
												d: "M2 5H8M5 2V8",
												stroke: "currentColor",
												strokeWidth: "1",
												strokeLinecap: "round"
											})
										}),
										formatTokens(model.maxOutputTokens),
										" out"
									]
								}),
								model.capabilities && (0, react_jsx_runtime.jsx)("span", {
									className: ProviderModelList_module_css_default.metaItem,
									children: getCapabilityBadges(model.capabilities)
								})
							]
						})]
					})]
				}), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: `${ProviderModelList_module_css_default.toggleButton} ${model.enabled ? ProviderModelList_module_css_default.toggleButtonEnabled : ProviderModelList_module_css_default.toggleButtonDisabled}`,
					onClick: handleToggle,
					"aria-label": model.enabled ? "Disable model" : "Enable model",
					children: (0, react_jsx_runtime.jsx)("span", {
						className: ProviderModelList_module_css_default.toggleTrack,
						children: (0, react_jsx_runtime.jsx)("span", { className: ProviderModelList_module_css_default.toggleThumb })
					})
				})]
			});
		}
		function formatContextWindow(tokens) {
			if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(1)}M ctx`;
			if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(0)}K ctx`;
			return `${tokens} ctx`;
		}
		function formatTokens(tokens) {
			if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(0)}K`;
			return `${tokens}`;
		}
		function getCapabilityBadges(capabilities) {
			const badges = [];
			if (capabilities?.chat) badges.push("chat");
			if (capabilities?.vision) badges.push("vision");
			if (capabilities?.functionCalling) badges.push("tools");
			if (capabilities?.embedding) badges.push("embedding");
			return badges.join(" · ");
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\ProviderDialog.module.css.mjs
		const css$18 = ".Y2Uoaq_overlay{z-index:1100;background:var(--dsw-alias-bg-mask-1);justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.Y2Uoaq_dialog{background:var(--popover);width:480px;max-width:calc(100vw - 48px);max-height:calc(100vh - 96px);box-shadow:var(--dsw-shadow-lv3);font-family:var(--cs-font-family-body), -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", sans-serif;color:var(--foreground);border-radius:14px;flex-direction:column;display:flex;overflow:hidden}.Y2Uoaq_header{box-sizing:border-box;justify-content:space-between;align-items:center;gap:8px;padding:16px 20px 12px;display:flex}.Y2Uoaq_title{color:var(--foreground);font-size:16px;font-weight:600}.Y2Uoaq_content{box-sizing:border-box;flex-direction:column;flex:1;gap:14px;min-height:0;padding:0 20px 16px;display:flex;overflow-y:auto}.Y2Uoaq_field{flex-direction:column;gap:6px;display:flex}.Y2Uoaq_label{color:var(--foreground);font-size:13px;font-weight:500}.Y2Uoaq_required{color:var(--destructive);margin-left:2px}.Y2Uoaq_hint{color:var(--foreground-tertiary);font-size:12px}.Y2Uoaq_input{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 10px;font-family:inherit;font-size:14px}.Y2Uoaq_input:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.Y2Uoaq_input::placeholder{color:var(--foreground-tertiary)}.Y2Uoaq_textarea{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;color:var(--foreground);font-family:var(--ds-font-family-code), monospace;box-sizing:border-box;resize:vertical;border-radius:8px;outline:none;min-height:72px;padding:8px 10px;font-size:13px;line-height:20px}.Y2Uoaq_textarea:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.Y2Uoaq_select{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 28px 0 10px;font-family:inherit;font-size:14px}.Y2Uoaq_select:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.Y2Uoaq_checkboxField{align-items:center;gap:8px;display:flex}.Y2Uoaq_checkbox{width:16px;height:16px;accent-color:var(--primary);cursor:pointer}.Y2Uoaq_checkboxLabel{color:var(--foreground);font-size:14px}.Y2Uoaq_error{border:1px solid var(--error-border);background:var(--error-subtle);color:var(--error-subtle-foreground);border-radius:8px;padding:8px 12px;font-size:13px}.Y2Uoaq_footer{box-sizing:border-box;border-top:.5px solid var(--border);justify-content:flex-end;align-items:center;gap:8px;padding:12px 20px 16px;display:flex}.Y2Uoaq_cancelButton{border:1px solid var(--border-subtle);background:var(--secondary);height:32px;color:var(--secondary-foreground);cursor:pointer;border-radius:8px;justify-content:center;align-items:center;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.Y2Uoaq_cancelButton:hover{background:var(--secondary-hover)}.Y2Uoaq_submitButton{background:var(--primary);height:32px;color:var(--primary-foreground);cursor:pointer;border:1px solid #0000;border-radius:8px;justify-content:center;align-items:center;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.Y2Uoaq_submitButton:hover:not(:disabled){background:var(--cs-brand-600)}.Y2Uoaq_submitButton:disabled{opacity:.5;cursor:not-allowed}";
		const tagId$18 = "@dsh-control-center/bundle/ProviderDialog.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$18) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$18;
			tag.textContent = css$18;
			document.head.appendChild(tag);
		}
		var ProviderDialog_module_css_default = {
			"overlay": "Y2Uoaq_overlay",
			"field": "Y2Uoaq_field",
			"select": "Y2Uoaq_select",
			"title": "Y2Uoaq_title",
			"checkbox": "Y2Uoaq_checkbox",
			"dialog": "Y2Uoaq_dialog",
			"label": "Y2Uoaq_label",
			"footer": "Y2Uoaq_footer",
			"hint": "Y2Uoaq_hint",
			"checkboxLabel": "Y2Uoaq_checkboxLabel",
			"header": "Y2Uoaq_header",
			"input": "Y2Uoaq_input",
			"textarea": "Y2Uoaq_textarea",
			"required": "Y2Uoaq_required",
			"content": "Y2Uoaq_content",
			"submitButton": "Y2Uoaq_submitButton",
			"cancelButton": "Y2Uoaq_cancelButton",
			"checkboxField": "Y2Uoaq_checkboxField",
			"error": "Y2Uoaq_error"
		};
		//#endregion
		//#region lib/types/client/ProviderDialog.js
		/**
		* Provider Add/Edit Dialog Component
		*
		* Modal dialog for creating new providers or editing existing ones.
		* Follows the Settings + Credentials + TypertRemote pattern.
		*/
		const PROVIDER_TYPES = [
			{
				value: "openai",
				label: "OpenAI"
			},
			{
				value: "anthropic",
				label: "Anthropic"
			},
			{
				value: "google",
				label: "Google (Gemini)"
			},
			{
				value: "azure",
				label: "Azure OpenAI"
			},
			{
				value: "deepseek",
				label: "DeepSeek"
			},
			{
				value: "openai-compatible",
				label: "OpenAI Compatible"
			},
			{
				value: "custom",
				label: "Custom"
			}
		];
		const DEFAULT_BASE_URLS = {
			openai: "https://api.openai.com/v1",
			anthropic: "https://api.anthropic.com/v1",
			google: "https://generativelanguage.googleapis.com/v1",
			azure: "https://<resource>.openai.azure.com",
			deepseek: "https://api.deepseek.com/v1",
			"openai-compatible": "",
			custom: ""
		};
		function ProviderDialog({ open, mode, provider, providersService, onClose, onSuccess }) {
			const [name, setName] = (0, react.useState)("");
			const [type, setType] = (0, react.useState)("openai-compatible");
			const [baseURL, setBaseURL] = (0, react.useState)("");
			const [apiKey, setApiKey] = (0, react.useState)("");
			const [customHeaders, setCustomHeaders] = (0, react.useState)("");
			const [enabled, setEnabled] = (0, react.useState)(true);
			const [saving, setSaving] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (mode === "edit" && provider) {
					setName(provider.name);
					setType(provider.type);
					setBaseURL(provider.baseURL);
					setApiKey("");
					setCustomHeaders(provider.customHeaders ? JSON.stringify(provider.customHeaders, null, 2) : "");
					setEnabled(provider.enabled);
				} else if (mode === "create") {
					setName("");
					setType("openai-compatible");
					setBaseURL("");
					setApiKey("");
					setCustomHeaders("");
					setEnabled(true);
				}
				setError(null);
			}, [
				mode,
				provider,
				open
			]);
			(0, react.useEffect)(() => {
				if (mode === "create" && type) setBaseURL(DEFAULT_BASE_URLS[type]);
			}, [type, mode]);
			const handleSubmit = (0, react.useCallback)(async (e) => {
				e.preventDefault();
				if (!providersService) {
					setError("Providers service not available");
					return;
				}
				setError(null);
				setSaving(true);
				try {
					let parsedHeaders;
					if (customHeaders.trim()) try {
						parsedHeaders = JSON.parse(customHeaders);
						if (typeof parsedHeaders !== "object" || Array.isArray(parsedHeaders)) throw new Error("Headers must be a JSON object");
					} catch (err) {
						setError(`Invalid JSON in custom headers: ${err instanceof Error ? err.message : String(err)}`);
						setSaving(false);
						return;
					}
					if (mode === "create") {
						const dto = {
							name: name.trim(),
							type,
							baseURL: baseURL.trim(),
							...apiKey.trim() ? { apiKey: apiKey.trim() } : {},
							...parsedHeaders ? { customHeaders: parsedHeaders } : {},
							enabled
						};
						const result = await providersService.create(dto);
						if (!result.ok) throw new Error(result.error.message);
					} else if (mode === "edit" && provider) {
						const dto = {
							name: name.trim(),
							baseURL: baseURL.trim(),
							...apiKey.trim() ? { apiKey: apiKey.trim() } : {},
							...parsedHeaders ? { customHeaders: parsedHeaders } : {},
							enabled
						};
						const result = await providersService.update(provider.id, dto);
						if (!result.ok) throw new Error(result.error.message);
					}
					onSuccess?.();
					onClose();
				} catch (err) {
					setError(err instanceof Error ? err.message : String(err));
				} finally {
					setSaving(false);
				}
			}, [
				providersService,
				mode,
				provider,
				name,
				type,
				baseURL,
				apiKey,
				customHeaders,
				enabled,
				onSuccess,
				onClose
			]);
			const handleCancel = (0, react.useCallback)(() => {
				onClose();
			}, [onClose]);
			if (!open) return null;
			return (0, react_jsx_runtime.jsx)("div", {
				className: ProviderDialog_module_css_default.overlay,
				onClick: handleCancel,
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: `${ProviderDialog_module_css_default.dialog} cc-surface`,
					onClick: (e) => e.stopPropagation(),
					children: [(0, react_jsx_runtime.jsx)("div", {
						className: ProviderDialog_module_css_default.header,
						children: (0, react_jsx_runtime.jsx)("h2", {
							className: ProviderDialog_module_css_default.title,
							children: mode === "create" ? "添加提供商" : "编辑提供商"
						})
					}), (0, react_jsx_runtime.jsxs)("form", {
						className: ProviderDialog_module_css_default.content,
						onSubmit: handleSubmit,
						children: [
							error && (0, react_jsx_runtime.jsx)("div", {
								className: ProviderDialog_module_css_default.error,
								children: error
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: ProviderDialog_module_css_default.field,
								children: [(0, react_jsx_runtime.jsxs)("label", {
									className: ProviderDialog_module_css_default.label,
									htmlFor: "provider-name",
									children: ["名称 ", (0, react_jsx_runtime.jsx)("span", {
										className: ProviderDialog_module_css_default.required,
										children: "*"
									})]
								}), (0, react_jsx_runtime.jsx)("input", {
									id: "provider-name",
									className: ProviderDialog_module_css_default.input,
									type: "text",
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "例如：My OpenAI Provider",
									required: true,
									autoFocus: true
								})]
							}),
							mode === "create" && (0, react_jsx_runtime.jsxs)("div", {
								className: ProviderDialog_module_css_default.field,
								children: [(0, react_jsx_runtime.jsxs)("label", {
									className: ProviderDialog_module_css_default.label,
									htmlFor: "provider-type",
									children: ["类型 ", (0, react_jsx_runtime.jsx)("span", {
										className: ProviderDialog_module_css_default.required,
										children: "*"
									})]
								}), (0, react_jsx_runtime.jsx)("select", {
									id: "provider-type",
									className: ProviderDialog_module_css_default.select,
									value: type,
									onChange: (e) => setType(e.target.value),
									required: true,
									children: PROVIDER_TYPES.map((pt) => (0, react_jsx_runtime.jsx)("option", {
										value: pt.value,
										children: pt.label
									}, pt.value))
								})]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: ProviderDialog_module_css_default.field,
								children: [
									(0, react_jsx_runtime.jsxs)("label", {
										className: ProviderDialog_module_css_default.label,
										htmlFor: "provider-baseurl",
										children: ["Base URL ", (0, react_jsx_runtime.jsx)("span", {
											className: ProviderDialog_module_css_default.required,
											children: "*"
										})]
									}),
									(0, react_jsx_runtime.jsx)("input", {
										id: "provider-baseurl",
										className: ProviderDialog_module_css_default.input,
										type: "text",
										value: baseURL,
										onChange: (e) => setBaseURL(e.target.value),
										placeholder: "https://api.example.com/v1",
										required: true
									}),
									(0, react_jsx_runtime.jsx)("div", {
										className: ProviderDialog_module_css_default.hint,
										children: "完整的 API 端点地址（不含路径后缀）"
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: ProviderDialog_module_css_default.field,
								children: [
									(0, react_jsx_runtime.jsx)("label", {
										className: ProviderDialog_module_css_default.label,
										htmlFor: "provider-apikey",
										children: "API Key"
									}),
									(0, react_jsx_runtime.jsx)("input", {
										id: "provider-apikey",
										className: ProviderDialog_module_css_default.input,
										type: "password",
										value: apiKey,
										onChange: (e) => setApiKey(e.target.value),
										placeholder: mode === "edit" ? "留空则不修改" : "可选"
									}),
									(0, react_jsx_runtime.jsx)("div", {
										className: ProviderDialog_module_css_default.hint,
										children: mode === "edit" ? "仅在需要更新时填写" : "API 密钥将安全存储"
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: ProviderDialog_module_css_default.field,
								children: [
									(0, react_jsx_runtime.jsx)("label", {
										className: ProviderDialog_module_css_default.label,
										htmlFor: "provider-headers",
										children: "自定义 Headers (JSON)"
									}),
									(0, react_jsx_runtime.jsx)("textarea", {
										id: "provider-headers",
										className: ProviderDialog_module_css_default.textarea,
										value: customHeaders,
										onChange: (e) => setCustomHeaders(e.target.value),
										placeholder: "{\"X-Custom-Header\": \"value\"}",
										rows: 3
									}),
									(0, react_jsx_runtime.jsx)("div", {
										className: ProviderDialog_module_css_default.hint,
										children: "可选，JSON 格式的额外请求头"
									})
								]
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: ProviderDialog_module_css_default.checkboxField,
								children: (0, react_jsx_runtime.jsxs)("label", {
									className: ProviderDialog_module_css_default.checkboxLabel,
									children: [(0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: ProviderDialog_module_css_default.checkbox,
										checked: enabled,
										onChange: (e) => setEnabled(e.target.checked)
									}), (0, react_jsx_runtime.jsx)("span", { children: "启用此提供商" })]
								})
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: ProviderDialog_module_css_default.footer,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ProviderDialog_module_css_default.cancelButton,
									onClick: handleCancel,
									disabled: saving,
									children: "取消"
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "submit",
									className: ProviderDialog_module_css_default.submitButton,
									disabled: saving,
									children: saving ? "保存中..." : mode === "create" ? "创建" : "保存"
								})]
							})
						]
					})]
				})
			});
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\ProvidersSection.module.css.mjs
		const css$17 = ".ExuySa_splitRoot{box-sizing:border-box;gap:0;width:100%;height:100%;min-height:0;display:flex}.ExuySa_providerList{box-sizing:border-box;border-right:.5px solid var(--border);flex-direction:column;flex:none;width:240px;min-width:200px;padding-right:16px;display:flex}.ExuySa_searchRow{flex:none;margin-bottom:8px;position:relative}.ExuySa_searchWrap{position:relative}.ExuySa_searchIcon{color:var(--foreground-tertiary);pointer-events:none;position:absolute;top:50%;left:10px;transform:translateY(-50%)}.ExuySa_searchInput{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 28px 0 30px;font-family:inherit;font-size:14px}.ExuySa_searchInput:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.ExuySa_searchInput::placeholder{color:var(--foreground-tertiary)}.ExuySa_searchClearButton{width:20px;height:20px;color:var(--foreground-tertiary);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:0;display:inline-flex;position:absolute;top:50%;right:6px;transform:translateY(-50%)}.ExuySa_searchClearButton:hover{background:var(--muted);color:var(--foreground)}.ExuySa_addButton{border:1px solid var(--border-subtle);background:var(--secondary);height:32px;color:var(--secondary-foreground);cursor:pointer;border-radius:8px;justify-content:center;align-items:center;gap:6px;margin-top:8px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.ExuySa_addButton:hover{background:var(--secondary-hover)}.ExuySa_listScroller{flex:1;min-height:0;overflow-y:auto}.ExuySa_listItems{flex-direction:column;gap:2px;padding:8px 4px 8px 0;display:flex}.ExuySa_listItem{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;color:var(--foreground);background:0 0;border:none;border-radius:10px;align-items:center;gap:10px;padding:8px 10px;font-family:inherit;display:flex}.ExuySa_listItem:hover,.ExuySa_listItemSelected{background:var(--muted)}.ExuySa_listItemMain{flex:1;min-width:0}.ExuySa_listItemLabel{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:14px;font-weight:500;overflow:hidden}.ExuySa_listItemIdle{color:var(--foreground-tertiary);white-space:nowrap;text-overflow:ellipsis;font-size:12px;overflow:hidden}.ExuySa_listItemAvatar{background:var(--muted);width:28px;height:28px;color:var(--muted-foreground);border-radius:8px;flex:none;justify-content:center;align-items:center;font-size:13px;font-weight:600;display:inline-flex}.ExuySa_providerDetail{box-sizing:border-box;flex-direction:column;flex:1;min-width:0;padding-left:24px;display:flex}.ExuySa_detailHeader{flex:none;justify-content:space-between;align-items:center;gap:8px;padding-bottom:12px;display:flex}.ExuySa_detailHeaderContent{min-width:0}.ExuySa_detailTitle{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:15px;font-weight:600;overflow:hidden}.ExuySa_detailMeta{flex-wrap:wrap;gap:4px 12px;margin-top:2px;display:flex}.ExuySa_detailMetaItem{color:var(--muted-foreground);align-items:center;gap:4px;font-size:12px;display:inline-flex}.ExuySa_enabledDot{background:var(--success);border-radius:50%;width:6px;height:6px}.ExuySa_editButton{border:1px solid var(--border-subtle);height:32px;color:var(--foreground);cursor:pointer;background:0 0;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.ExuySa_editButton:hover{background:var(--muted)}.ExuySa_detailScroll{flex:1;min-height:0;overflow-y:auto}.ExuySa_detailContentMaxWidth{flex-direction:column;gap:16px;width:100%;max-width:640px;display:flex}.ExuySa_section{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;flex-direction:column;gap:12px;padding:16px;display:flex}.ExuySa_sectionHeading{color:var(--foreground);font-size:15px;font-weight:600}.ExuySa_sectionBody{flex-direction:column;gap:12px;display:flex}.ExuySa_dangerZone{border:1px solid var(--error-border);background:var(--error-subtle);border-radius:10px;flex-direction:column;gap:8px;padding:16px;display:flex}.ExuySa_dangerZoneTitle{color:var(--error-subtle-foreground);font-size:15px;font-weight:600}.ExuySa_dangerZoneText{color:var(--error-subtle-foreground);font-size:13px}.ExuySa_dangerZoneDescription{color:var(--muted-foreground);font-size:12px}.ExuySa_dangerButton{border:1px solid var(--error-border);height:32px;color:var(--destructive);cursor:pointer;background:0 0;border-radius:8px;justify-content:center;align-self:flex-start;align-items:center;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.ExuySa_dangerButton:hover{background:var(--error-subtle)}.ExuySa_loading{min-height:200px;color:var(--muted-foreground);justify-content:center;align-items:center;font-size:14px;display:flex}.ExuySa_error{border:1px solid var(--error-border);background:var(--error-subtle);color:var(--error-subtle-foreground);border-radius:8px;align-items:center;gap:8px;padding:8px 12px;font-size:13px;display:flex}.ExuySa_emptyState{color:var(--muted-foreground);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:6px;padding:48px 16px;display:flex}.ExuySa_emptyTitle{color:var(--foreground);font-size:15px;font-weight:600}.ExuySa_emptyDescription{color:var(--muted-foreground);font-size:13px}.ExuySa_emptyIcon{color:var(--foreground-tertiary)}.ExuySa_emptyDetailState{color:var(--foreground-tertiary);text-align:center;flex:1;justify-content:center;align-items:center;padding:48px 16px;font-size:14px;display:flex}.ExuySa_secondaryButton{border:1px solid var(--border-subtle);background:var(--secondary);height:32px;color:var(--secondary-foreground);cursor:pointer;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.ExuySa_secondaryButton:hover{background:var(--secondary-hover)}.ExuySa_addFooter{justify-content:flex-end;display:flex}";
		const tagId$17 = "@dsh-control-center/bundle/ProvidersSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$17) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$17;
			tag.textContent = css$17;
			document.head.appendChild(tag);
		}
		var ProvidersSection_module_css_default = {
			"detailContentMaxWidth": "ExuySa_detailContentMaxWidth",
			"detailHeader": "ExuySa_detailHeader",
			"detailTitle": "ExuySa_detailTitle",
			"listItemLabel": "ExuySa_listItemLabel",
			"dangerButton": "ExuySa_dangerButton",
			"loading": "ExuySa_loading",
			"secondaryButton": "ExuySa_secondaryButton",
			"addFooter": "ExuySa_addFooter",
			"listItemAvatar": "ExuySa_listItemAvatar",
			"splitRoot": "ExuySa_splitRoot",
			"emptyState": "ExuySa_emptyState",
			"addButton": "ExuySa_addButton",
			"detailMeta": "ExuySa_detailMeta",
			"listScroller": "ExuySa_listScroller",
			"sectionBody": "ExuySa_sectionBody",
			"dangerZoneText": "ExuySa_dangerZoneText",
			"dangerZoneDescription": "ExuySa_dangerZoneDescription",
			"emptyIcon": "ExuySa_emptyIcon",
			"dangerZone": "ExuySa_dangerZone",
			"emptyDetailState": "ExuySa_emptyDetailState",
			"providerDetail": "ExuySa_providerDetail",
			"searchClearButton": "ExuySa_searchClearButton",
			"detailScroll": "ExuySa_detailScroll",
			"listItemSelected": "ExuySa_listItemSelected",
			"error": "ExuySa_error",
			"dangerZoneTitle": "ExuySa_dangerZoneTitle",
			"searchIcon": "ExuySa_searchIcon",
			"detailMetaItem": "ExuySa_detailMetaItem",
			"listItems": "ExuySa_listItems",
			"listItemIdle": "ExuySa_listItemIdle",
			"searchWrap": "ExuySa_searchWrap",
			"emptyDescription": "ExuySa_emptyDescription",
			"detailHeaderContent": "ExuySa_detailHeaderContent",
			"providerList": "ExuySa_providerList",
			"enabledDot": "ExuySa_enabledDot",
			"searchInput": "ExuySa_searchInput",
			"emptyTitle": "ExuySa_emptyTitle",
			"section": "ExuySa_section",
			"editButton": "ExuySa_editButton",
			"sectionHeading": "ExuySa_sectionHeading",
			"listItemMain": "ExuySa_listItemMain",
			"listItem": "ExuySa_listItem",
			"searchRow": "ExuySa_searchRow"
		};
		//#endregion
		//#region lib/types/client/ProvidersSection.js
		/**
		* Provider Management - Split-pane layout with 100% UI parity to Cherry Studio.
		* Left sidebar: provider list with search/filter. Right detail: provider settings + model list.
		*/
		function ProvidersSection(props) {
			const { providers: providersService } = props;
			const [providers, setProviders] = (0, react.useState)([]);
			const [selectedId, setSelectedId] = (0, react.useState)(void 0);
			const [search, setSearch] = (0, react.useState)("");
			const [loading, setLoading] = (0, react.useState)(true);
			const [error, setError] = (0, react.useState)(null);
			const [isTestingConnection, setIsTestingConnection] = (0, react.useState)(false);
			const [isDiscoveringModels, setIsDiscoveringModels] = (0, react.useState)(false);
			const [connectionTestResult, setConnectionTestResult] = (0, react.useState)(null);
			const [dialogOpen, setDialogOpen] = (0, react.useState)(false);
			const [dialogMode, setDialogMode] = (0, react.useState)("create");
			const [editingProvider, setEditingProvider] = (0, react.useState)(void 0);
			const loadProviders = (0, react.useCallback)(async () => {
				if (!providersService) {
					setError("Providers service not available");
					setLoading(false);
					return;
				}
				try {
					setLoading(true);
					setError(null);
					const result = await providersService.list();
					if (!result.ok) throw new Error(result.error.message);
					const list = result.value;
					setProviders(list);
					if (list.length > 0 && !selectedId && list[0] !== void 0) setSelectedId(list[0].id);
				} catch (err) {
					setError(err instanceof Error ? err.message : "Failed to load providers");
				} finally {
					setLoading(false);
				}
			}, [providersService, selectedId]);
			(0, react.useEffect)(() => {
				loadProviders();
			}, [loadProviders]);
			const filteredProviders = (0, react.useMemo)(() => {
				if (!search) return providers;
				const keywords = search.toLowerCase().split(/\s+/).filter(Boolean);
				return providers.filter((p) => keywords.every((kw) => p.name.toLowerCase().includes(kw) || p.type.toLowerCase().includes(kw) || p.baseURL.toLowerCase().includes(kw)));
			}, [providers, search]);
			const selectedProvider = (0, react.useMemo)(() => filteredProviders.find((p) => p.id === selectedId), [filteredProviders, selectedId]);
			const handleUpdateProvider = (0, react.useCallback)(async (updates) => {
				if (!providersService || !selectedId) return;
				try {
					const result = await providersService.update(selectedId, updates);
					if (!result.ok) throw new Error(result.error.message);
					await loadProviders();
				} catch (err) {
					console.error("Failed to update provider:", err);
				}
			}, [
				providersService,
				selectedId,
				loadProviders
			]);
			const handleTestConnection = (0, react.useCallback)(async () => {
				if (!providersService || !selectedId) return;
				try {
					setIsTestingConnection(true);
					setConnectionTestResult(null);
					const result = await providersService.testConnection(selectedId);
					if (!result.ok) throw new Error(result.error.message);
					setConnectionTestResult(result.value);
				} catch (err) {
					setConnectionTestResult({
						success: false,
						error: err instanceof Error ? err.message : "Connection test failed"
					});
				} finally {
					setIsTestingConnection(false);
				}
			}, [providersService, selectedId]);
			const handleDiscoverModels = (0, react.useCallback)(async () => {
				if (!providersService || !selectedId) return;
				try {
					setIsDiscoveringModels(true);
					const result = await providersService.discoverModels(selectedId);
					if (!result.ok) throw new Error(result.error.message);
					await loadProviders();
				} catch (err) {
					console.error("Failed to discover models:", err);
				} finally {
					setIsDiscoveringModels(false);
				}
			}, [
				providersService,
				selectedId,
				loadProviders
			]);
			const handleToggleEnable = (0, react.useCallback)(async (providerId, currentEnabled) => {
				if (!providersService) return;
				try {
					const result = await providersService.update(providerId, { enabled: !currentEnabled });
					if (!result.ok) throw new Error(result.error.message);
					await loadProviders();
				} catch (err) {
					setError(err instanceof Error ? err.message : "Failed to update provider");
				}
			}, [providersService, loadProviders]);
			const handleDelete = (0, react.useCallback)(async (providerId, providerName) => {
				if (!providersService) return;
				if (!window.confirm(`确定要删除 "${providerName}" 提供商吗？`)) return;
				try {
					const result = await providersService.delete(providerId);
					if (!result.ok) throw new Error(result.error.message);
					await loadProviders();
				} catch (err) {
					setError(err instanceof Error ? err.message : "Failed to delete provider");
				}
			}, [providersService, loadProviders]);
			const handleOpenCreateDialog = (0, react.useCallback)(() => {
				setDialogMode("create");
				setEditingProvider(void 0);
				setDialogOpen(true);
			}, []);
			const handleOpenEditDialog = (0, react.useCallback)((provider) => {
				setDialogMode("edit");
				setEditingProvider(provider);
				setDialogOpen(true);
			}, []);
			const handleCloseDialog = (0, react.useCallback)(() => {
				setDialogOpen(false);
				setEditingProvider(void 0);
			}, []);
			const handleDialogSuccess = (0, react.useCallback)(async () => {
				await loadProviders();
			}, [loadProviders]);
			if (loading) return (0, react_jsx_runtime.jsx)("div", {
				className: ProvidersSection_module_css_default.splitRoot,
				children: (0, react_jsx_runtime.jsx)("div", {
					className: ProvidersSection_module_css_default.loading,
					children: "加载中..."
				})
			});
			if (error) return (0, react_jsx_runtime.jsx)("div", {
				className: ProvidersSection_module_css_default.splitRoot,
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: ProvidersSection_module_css_default.error,
					children: [
						(0, react_jsx_runtime.jsx)("div", {
							className: ProvidersSection_module_css_default.emptyTitle,
							children: "加载失败"
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: ProvidersSection_module_css_default.emptyDescription,
							children: error
						}),
						(0, react_jsx_runtime.jsx)("button", {
							className: ProvidersSection_module_css_default.secondaryButton,
							onClick: () => void loadProviders(),
							children: "重试"
						})
					]
				})
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ProvidersSection_module_css_default.splitRoot,
				children: [
					(0, react_jsx_runtime.jsxs)("aside", {
						className: ProvidersSection_module_css_default.providerList,
						children: [
							(0, react_jsx_runtime.jsx)("div", {
								className: ProvidersSection_module_css_default.searchRow,
								children: (0, react_jsx_runtime.jsxs)("div", {
									className: ProvidersSection_module_css_default.searchWrap,
									children: [
										(0, react_jsx_runtime.jsxs)("svg", {
											className: ProvidersSection_module_css_default.searchIcon,
											viewBox: "0 0 16 16",
											fill: "none",
											children: [(0, react_jsx_runtime.jsx)("circle", {
												cx: "7",
												cy: "7",
												r: "5",
												stroke: "currentColor",
												strokeWidth: "1.5"
											}), (0, react_jsx_runtime.jsx)("path", {
												d: "M11 11L14 14",
												stroke: "currentColor",
												strokeWidth: "1.5",
												strokeLinecap: "round"
											})]
										}),
										(0, react_jsx_runtime.jsx)("input", {
											type: "text",
											className: ProvidersSection_module_css_default.searchInput,
											placeholder: "搜索提供商...",
											value: search,
											onChange: (e) => setSearch(e.target.value)
										}),
										search && (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: ProvidersSection_module_css_default.searchClearButton,
											onClick: () => setSearch(""),
											"aria-label": "清除搜索",
											children: (0, react_jsx_runtime.jsx)("svg", {
												width: "12",
												height: "12",
												viewBox: "0 0 12 12",
												fill: "none",
												children: (0, react_jsx_runtime.jsx)("path", {
													d: "M9 3L3 9M3 3L9 9",
													stroke: "currentColor",
													strokeWidth: "1.5",
													strokeLinecap: "round"
												})
											})
										})
									]
								})
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: ProvidersSection_module_css_default.listScroller,
								children: filteredProviders.length === 0 ? (0, react_jsx_runtime.jsx)("div", {
									className: ProvidersSection_module_css_default.emptyState,
									children: search ? "没有找到匹配的提供商" : "暂无配置的提供商"
								}) : (0, react_jsx_runtime.jsx)("div", {
									className: ProvidersSection_module_css_default.listItems,
									children: filteredProviders.map((provider) => (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: `${ProvidersSection_module_css_default.listItem} ${provider.id === selectedId ? ProvidersSection_module_css_default.listItemSelected : ProvidersSection_module_css_default.listItemIdle}`,
										onClick: () => setSelectedId(provider.id),
										children: [(0, react_jsx_runtime.jsxs)("div", {
											className: ProvidersSection_module_css_default.listItemMain,
											children: [(0, react_jsx_runtime.jsx)("div", {
												className: ProvidersSection_module_css_default.listItemAvatar,
												children: (0, react_jsx_runtime.jsxs)("svg", {
													width: "20",
													height: "20",
													viewBox: "0 0 20 20",
													fill: "none",
													children: [(0, react_jsx_runtime.jsx)("rect", {
														width: "20",
														height: "20",
														rx: "4",
														fill: "currentColor",
														opacity: "0.1"
													}), (0, react_jsx_runtime.jsx)("path", {
														d: "M6 8L10 12L14 8",
														stroke: "currentColor",
														strokeWidth: "1.5",
														strokeLinecap: "round",
														strokeLinejoin: "round"
													})]
												})
											}), (0, react_jsx_runtime.jsx)("span", {
												className: ProvidersSection_module_css_default.listItemLabel,
												children: provider.name
											})]
										}), provider.enabled && (0, react_jsx_runtime.jsx)("span", { className: ProvidersSection_module_css_default.enabledDot })]
									}, provider.id))
								})
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: ProvidersSection_module_css_default.addFooter,
								children: (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: ProvidersSection_module_css_default.addButton,
									onClick: handleOpenCreateDialog,
									children: [(0, react_jsx_runtime.jsx)("svg", {
										width: "14",
										height: "14",
										viewBox: "0 0 14 14",
										fill: "none",
										children: (0, react_jsx_runtime.jsx)("path", {
											d: "M7 3V11M3 7H11",
											stroke: "currentColor",
											strokeWidth: "1.5",
											strokeLinecap: "round"
										})
									}), (0, react_jsx_runtime.jsx)("span", { children: "添加提供商" })]
								})
							})
						]
					}),
					selectedProvider ? (0, react_jsx_runtime.jsxs)("main", {
						className: ProvidersSection_module_css_default.providerDetail,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: ProvidersSection_module_css_default.detailHeader,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: ProvidersSection_module_css_default.detailHeaderContent,
								children: [(0, react_jsx_runtime.jsx)("h2", {
									className: ProvidersSection_module_css_default.detailTitle,
									children: selectedProvider.name
								}), (0, react_jsx_runtime.jsxs)("div", {
									className: ProvidersSection_module_css_default.detailMeta,
									children: [(0, react_jsx_runtime.jsxs)("span", {
										className: ProvidersSection_module_css_default.detailMetaItem,
										children: [(0, react_jsx_runtime.jsx)("svg", {
											width: "12",
											height: "12",
											viewBox: "0 0 12 12",
											fill: "none",
											children: (0, react_jsx_runtime.jsx)("path", {
												d: "M6 2L3 4V8L6 10L9 8V4L6 2Z",
												stroke: "currentColor",
												strokeWidth: "1.5",
												strokeLinecap: "round",
												strokeLinejoin: "round"
											})
										}), selectedProvider.type]
									}), (0, react_jsx_runtime.jsxs)("span", {
										className: ProvidersSection_module_css_default.detailMetaItem,
										children: [
											(0, react_jsx_runtime.jsxs)("svg", {
												width: "12",
												height: "12",
												viewBox: "0 0 12 12",
												fill: "none",
												children: [(0, react_jsx_runtime.jsx)("circle", {
													cx: "6",
													cy: "6",
													r: "4",
													stroke: "currentColor",
													strokeWidth: "1.5"
												}), (0, react_jsx_runtime.jsx)("path", {
													d: "M6 3V6L8 8",
													stroke: "currentColor",
													strokeWidth: "1.5",
													strokeLinecap: "round"
												})]
											}),
											selectedProvider.models.length,
											" 模型"
										]
									})]
								})]
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ProvidersSection_module_css_default.editButton,
								onClick: () => handleOpenEditDialog(selectedProvider),
								title: "编辑提供商",
								children: (0, react_jsx_runtime.jsx)("svg", {
									width: "16",
									height: "16",
									viewBox: "0 0 16 16",
									fill: "none",
									children: (0, react_jsx_runtime.jsx)("path", {
										d: "M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L2.66634 14L3.33301 11.3334L11.333 2.00004Z",
										stroke: "currentColor",
										strokeWidth: "1.5",
										strokeLinecap: "round",
										strokeLinejoin: "round"
									})
								})
							})]
						}), (0, react_jsx_runtime.jsx)("div", {
							className: ProvidersSection_module_css_default.detailScroll,
							children: (0, react_jsx_runtime.jsxs)("div", {
								className: ProvidersSection_module_css_default.detailContentMaxWidth,
								children: [
									(0, react_jsx_runtime.jsx)(ProviderAuthentication, {
										provider: selectedProvider,
										onUpdateProvider: handleUpdateProvider,
										onTestConnection: handleTestConnection,
										onDiscoverModels: handleDiscoverModels,
										isTestingConnection,
										isDiscoveringModels,
										connectionTestResult
									}),
									(0, react_jsx_runtime.jsx)(ProviderModelList, {
										provider: selectedProvider,
										onToggleModel: async (modelId, enabled) => {
											if (!providersService) return;
											try {
												const result = await providersService.updateModel(selectedProvider.id, modelId, { enabled });
												if (!result.ok) throw new Error(result.error.message);
												await loadProviders();
											} catch (err) {
												setError(err instanceof Error ? err.message : "Failed to update model");
											}
										}
									}),
									(0, react_jsx_runtime.jsxs)("section", {
										className: ProvidersSection_module_css_default.section,
										children: [(0, react_jsx_runtime.jsx)("h3", {
											className: ProvidersSection_module_css_default.sectionHeading,
											children: "危险操作"
										}), (0, react_jsx_runtime.jsxs)("div", {
											className: ProvidersSection_module_css_default.sectionBody,
											children: [(0, react_jsx_runtime.jsxs)("div", {
												className: ProvidersSection_module_css_default.dangerZone,
												children: [(0, react_jsx_runtime.jsxs)("div", {
													className: ProvidersSection_module_css_default.dangerZoneText,
													children: [(0, react_jsx_runtime.jsx)("div", {
														className: ProvidersSection_module_css_default.dangerZoneTitle,
														children: "删除提供商"
													}), (0, react_jsx_runtime.jsx)("div", {
														className: ProvidersSection_module_css_default.dangerZoneDescription,
														children: "此操作不可撤销。删除后，所有关联的模型配置也将被移除。"
													})]
												}), (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: ProvidersSection_module_css_default.dangerButton,
													onClick: () => handleDelete(selectedProvider.id, selectedProvider.name),
													children: "删除"
												})]
											}), (0, react_jsx_runtime.jsxs)("div", {
												className: ProvidersSection_module_css_default.dangerZone,
												children: [(0, react_jsx_runtime.jsxs)("div", {
													className: ProvidersSection_module_css_default.dangerZoneText,
													children: [(0, react_jsx_runtime.jsxs)("div", {
														className: ProvidersSection_module_css_default.dangerZoneTitle,
														children: [selectedProvider.enabled ? "禁用" : "启用", "提供商"]
													}), (0, react_jsx_runtime.jsx)("div", {
														className: ProvidersSection_module_css_default.dangerZoneDescription,
														children: selectedProvider.enabled ? "禁用后，此提供商的所有模型将无法使用。" : "启用后，此提供商的模型将可以在对话中使用。"
													})]
												}), (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: ProvidersSection_module_css_default.secondaryButton,
													onClick: () => handleToggleEnable(selectedProvider.id, selectedProvider.enabled),
													children: selectedProvider.enabled ? "禁用" : "启用"
												})]
											})]
										})]
									})
								]
							})
						})]
					}) : (0, react_jsx_runtime.jsx)("main", {
						className: ProvidersSection_module_css_default.providerDetail,
						children: (0, react_jsx_runtime.jsxs)("div", {
							className: ProvidersSection_module_css_default.emptyDetailState,
							children: [
								(0, react_jsx_runtime.jsxs)("svg", {
									className: ProvidersSection_module_css_default.emptyIcon,
									viewBox: "0 0 64 64",
									fill: "none",
									children: [(0, react_jsx_runtime.jsx)("rect", {
										x: "12",
										y: "12",
										width: "40",
										height: "40",
										rx: "4",
										stroke: "currentColor",
										strokeWidth: "2"
									}), (0, react_jsx_runtime.jsx)("path", {
										d: "M24 28H40M24 32H36M24 36H40",
										stroke: "currentColor",
										strokeWidth: "2",
										strokeLinecap: "round"
									})]
								}),
								(0, react_jsx_runtime.jsx)("div", {
									className: ProvidersSection_module_css_default.emptyTitle,
									children: "选择一个提供商"
								}),
								(0, react_jsx_runtime.jsx)("div", {
									className: ProvidersSection_module_css_default.emptyDescription,
									children: "在左侧列表中选择一个提供商以查看和管理其配置"
								})
							]
						})
					}),
					(0, react_jsx_runtime.jsx)(ProviderDialog, {
						open: dialogOpen,
						mode: dialogMode,
						provider: editingProvider,
						providersService,
						onClose: handleCloseDialog,
						onSuccess: handleDialogSuccess
					})
				]
			});
		}
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
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\AddMcpServerDialog.module.css.mjs
		const css$16 = ".uv_otq_overlay{z-index:1100;background:var(--dsw-alias-bg-mask-1);justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.uv_otq_dialog{background:var(--popover);width:480px;max-width:calc(100vw - 48px);max-height:calc(100vh - 96px);box-shadow:var(--dsw-shadow-lv3);font-family:var(--cs-font-family-body), -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", sans-serif;color:var(--foreground);border-radius:14px;flex-direction:column;display:flex;overflow:hidden}.uv_otq_header{box-sizing:border-box;justify-content:space-between;align-items:center;gap:8px;padding:16px 20px 12px;display:flex}.uv_otq_title{color:var(--foreground);font-size:16px;font-weight:600}.uv_otq_closeButton{width:28px;height:28px;color:var(--muted-foreground);cursor:pointer;background:0 0;border:none;border-radius:8px;justify-content:center;align-items:center;padding:0;display:inline-flex}.uv_otq_closeButton:hover{background:var(--muted);color:var(--foreground)}.uv_otq_form{box-sizing:border-box;flex-direction:column;flex:1;gap:14px;min-height:0;padding:0 20px 16px;display:flex;overflow-y:auto}.uv_otq_field{flex-direction:column;gap:6px;display:flex}.uv_otq_label{color:var(--foreground);font-size:13px;font-weight:500}.uv_otq_input{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 10px;font-family:inherit;font-size:14px}.uv_otq_input:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.uv_otq_select{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 28px 0 10px;font-family:inherit;font-size:14px}.uv_otq_select:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.uv_otq_textarea{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;color:var(--foreground);font-family:var(--ds-font-family-code), monospace;box-sizing:border-box;resize:vertical;border-radius:8px;outline:none;min-height:72px;padding:8px 10px;font-size:13px;line-height:20px}.uv_otq_textarea:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.uv_otq_error{border:1px solid var(--error-border);background:var(--error-subtle);color:var(--error-subtle-foreground);border-radius:8px;padding:8px 12px;font-size:13px}.uv_otq_footer{box-sizing:border-box;border-top:.5px solid var(--border);justify-content:flex-end;align-items:center;gap:8px;padding:12px 20px 16px;display:flex}.uv_otq_cancelButton{border:1px solid var(--border-subtle);background:var(--secondary);height:32px;color:var(--secondary-foreground);cursor:pointer;border-radius:8px;justify-content:center;align-items:center;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.uv_otq_cancelButton:hover{background:var(--secondary-hover)}.uv_otq_submitButton{background:var(--primary);height:32px;color:var(--primary-foreground);cursor:pointer;border:1px solid #0000;border-radius:8px;justify-content:center;align-items:center;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.uv_otq_submitButton:hover:not(:disabled){background:var(--cs-brand-600)}.uv_otq_submitButton:disabled{opacity:.5;cursor:not-allowed}";
		const tagId$16 = "@dsh-control-center/bundle/AddMcpServerDialog.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$16) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$16;
			tag.textContent = css$16;
			document.head.appendChild(tag);
		}
		var AddMcpServerDialog_module_css_default = {
			"form": "uv_otq_form",
			"footer": "uv_otq_footer",
			"title": "uv_otq_title",
			"header": "uv_otq_header",
			"overlay": "uv_otq_overlay",
			"cancelButton": "uv_otq_cancelButton",
			"field": "uv_otq_field",
			"input": "uv_otq_input",
			"submitButton": "uv_otq_submitButton",
			"closeButton": "uv_otq_closeButton",
			"label": "uv_otq_label",
			"select": "uv_otq_select",
			"textarea": "uv_otq_textarea",
			"dialog": "uv_otq_dialog",
			"error": "uv_otq_error"
		};
		//#endregion
		//#region lib/types/client/AddMcpServerDialog.js
		function AddMcpServerDialog({ visible, onClose, onSubmit }) {
			const [name, setName] = (0, react.useState)("");
			const [command, setCommand] = (0, react.useState)("");
			const [args, setArgs] = (0, react.useState)("");
			const [env, setEnv] = (0, react.useState)("");
			const [type, setType] = (0, react.useState)("stdio");
			const [baseUrl, setBaseUrl] = (0, react.useState)("");
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const handleSubmit = async (e) => {
				e.preventDefault();
				setError("");
				if (!name.trim()) {
					setError("服务器名称不能为空");
					return;
				}
				if (type === "stdio" && !command.trim()) {
					setError("命令不能为空");
					return;
				}
				if ((type === "sse" || type === "streamableHttp") && !baseUrl.trim()) {
					setError("Base URL 不能为空");
					return;
				}
				try {
					setLoading(true);
					let parsedArgs = [];
					if (args.trim()) try {
						parsedArgs = JSON.parse(args);
						if (!Array.isArray(parsedArgs)) {
							setError("Args 必须是 JSON 数组");
							return;
						}
					} catch {
						setError("Args JSON 格式错误");
						return;
					}
					let parsedEnv = {};
					if (env.trim()) try {
						parsedEnv = JSON.parse(env);
						if (typeof parsedEnv !== "object" || Array.isArray(parsedEnv)) {
							setError("Env 必须是 JSON 对象");
							return;
						}
					} catch {
						setError("Env JSON 格式错误");
						return;
					}
					const dto = {
						name: name.trim(),
						type,
						timeout: 3e4,
						longRunning: false
					};
					if (type === "stdio") {
						if (command.trim()) dto.command = command.trim();
						if (parsedArgs.length > 0) dto.args = parsedArgs;
						if (Object.keys(parsedEnv).length > 0) dto.env = parsedEnv;
					} else if (baseUrl.trim()) dto.baseUrl = baseUrl.trim();
					await onSubmit(dto);
					setName("");
					setCommand("");
					setArgs("");
					setEnv("");
					setType("stdio");
					setBaseUrl("");
					onClose();
				} catch (err) {
					setError(err instanceof Error ? err.message : "创建失败");
				} finally {
					setLoading(false);
				}
			};
			if (!visible) return null;
			return (0, react_jsx_runtime.jsx)("div", {
				className: AddMcpServerDialog_module_css_default.overlay,
				onClick: onClose,
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: `${AddMcpServerDialog_module_css_default.dialog} cc-surface`,
					onClick: (e) => e.stopPropagation(),
					children: [(0, react_jsx_runtime.jsxs)("div", {
						className: AddMcpServerDialog_module_css_default.header,
						children: [(0, react_jsx_runtime.jsx)("h2", {
							className: AddMcpServerDialog_module_css_default.title,
							children: "添加 MCP 服务器"
						}), (0, react_jsx_runtime.jsx)("button", {
							className: AddMcpServerDialog_module_css_default.closeButton,
							onClick: onClose,
							type: "button",
							children: (0, react_jsx_runtime.jsx)("svg", {
								width: "16",
								height: "16",
								viewBox: "0 0 16 16",
								fill: "none",
								children: (0, react_jsx_runtime.jsx)("path", {
									d: "M12 4L4 12M4 4L12 12",
									stroke: "currentColor",
									strokeWidth: "1.5",
									strokeLinecap: "round"
								})
							})
						})]
					}), (0, react_jsx_runtime.jsxs)("form", {
						className: AddMcpServerDialog_module_css_default.form,
						onSubmit: handleSubmit,
						children: [
							error && (0, react_jsx_runtime.jsx)("div", {
								className: AddMcpServerDialog_module_css_default.error,
								children: error
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: AddMcpServerDialog_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("label", {
									className: AddMcpServerDialog_module_css_default.label,
									children: "服务器名称 *"
								}), (0, react_jsx_runtime.jsx)("input", {
									type: "text",
									className: AddMcpServerDialog_module_css_default.input,
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "my-mcp-server"
								})]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: AddMcpServerDialog_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("label", {
									className: AddMcpServerDialog_module_css_default.label,
									children: "传输类型"
								}), (0, react_jsx_runtime.jsxs)("select", {
									className: AddMcpServerDialog_module_css_default.select,
									value: type,
									onChange: (e) => setType(e.target.value),
									children: [
										(0, react_jsx_runtime.jsx)("option", {
											value: "stdio",
											children: "stdio"
										}),
										(0, react_jsx_runtime.jsx)("option", {
											value: "sse",
											children: "SSE"
										}),
										(0, react_jsx_runtime.jsx)("option", {
											value: "streamableHttp",
											children: "Streamable HTTP"
										})
									]
								})]
							}),
							type === "stdio" ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								(0, react_jsx_runtime.jsxs)("div", {
									className: AddMcpServerDialog_module_css_default.field,
									children: [(0, react_jsx_runtime.jsx)("label", {
										className: AddMcpServerDialog_module_css_default.label,
										children: "命令 *"
									}), (0, react_jsx_runtime.jsx)("input", {
										type: "text",
										className: AddMcpServerDialog_module_css_default.input,
										value: command,
										onChange: (e) => setCommand(e.target.value),
										placeholder: "npx"
									})]
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: AddMcpServerDialog_module_css_default.field,
									children: [(0, react_jsx_runtime.jsx)("label", {
										className: AddMcpServerDialog_module_css_default.label,
										children: "参数（JSON 数组）"
									}), (0, react_jsx_runtime.jsx)("textarea", {
										className: AddMcpServerDialog_module_css_default.textarea,
										value: args,
										onChange: (e) => setArgs(e.target.value),
										placeholder: "[\"-y\", \"@modelcontextprotocol/server-filesystem\"]",
										rows: 3
									})]
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: AddMcpServerDialog_module_css_default.field,
									children: [(0, react_jsx_runtime.jsx)("label", {
										className: AddMcpServerDialog_module_css_default.label,
										children: "环境变量（JSON 对象）"
									}), (0, react_jsx_runtime.jsx)("textarea", {
										className: AddMcpServerDialog_module_css_default.textarea,
										value: env,
										onChange: (e) => setEnv(e.target.value),
										placeholder: "{\"PATH\": \"/usr/local/bin\"}",
										rows: 3
									})]
								})
							] }) : (0, react_jsx_runtime.jsxs)("div", {
								className: AddMcpServerDialog_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("label", {
									className: AddMcpServerDialog_module_css_default.label,
									children: "Base URL *"
								}), (0, react_jsx_runtime.jsx)("input", {
									type: "text",
									className: AddMcpServerDialog_module_css_default.input,
									value: baseUrl,
									onChange: (e) => setBaseUrl(e.target.value),
									placeholder: "http://localhost:3000"
								})]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: AddMcpServerDialog_module_css_default.footer,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: AddMcpServerDialog_module_css_default.cancelButton,
									onClick: onClose,
									children: "取消"
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "submit",
									className: AddMcpServerDialog_module_css_default.submitButton,
									disabled: loading,
									children: loading ? "创建中..." : "创建"
								})]
							})
						]
					})]
				})
			});
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\McpSection.module.css.mjs
		const css$15 = "._0bBxiW_splitRoot{box-sizing:border-box;width:100%;height:100%;min-height:0;display:flex}._0bBxiW_serverList{box-sizing:border-box;border-right:.5px solid var(--border);flex-direction:column;flex:none;width:240px;min-width:200px;padding-right:16px;display:flex}._0bBxiW_searchRow{flex:none;margin-bottom:8px;position:relative}._0bBxiW_searchWrap{position:relative}._0bBxiW_searchIcon{color:var(--foreground-tertiary);pointer-events:none;position:absolute;top:50%;left:10px;transform:translateY(-50%)}._0bBxiW_searchInput{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 28px 0 30px;font-family:inherit;font-size:14px}._0bBxiW_searchInput:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}._0bBxiW_searchClearButton{width:20px;height:20px;color:var(--foreground-tertiary);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:0;display:inline-flex;position:absolute;top:50%;right:6px;transform:translateY(-50%)}._0bBxiW_searchClearButton:hover{background:var(--muted);color:var(--foreground)}._0bBxiW_addButton{background:var(--primary);height:32px;color:var(--primary-foreground);cursor:pointer;border:1px solid #0000;border-radius:8px;justify-content:center;align-items:center;gap:6px;margin-top:8px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}._0bBxiW_addButton:hover{background:var(--cs-brand-600)}._0bBxiW_listScroller{flex:1;min-height:0;overflow-y:auto}._0bBxiW_listItems{flex-direction:column;gap:2px;padding:8px 4px 8px 0;display:flex}._0bBxiW_listItem{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;color:var(--foreground);background:0 0;border:none;border-radius:10px;align-items:center;gap:10px;padding:8px 10px;font-family:inherit;display:flex}._0bBxiW_listItem:hover,._0bBxiW_listItemSelected{background:var(--muted)}._0bBxiW_listItemMain{flex:1;min-width:0}._0bBxiW_listItemLabel{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:14px;font-weight:500;overflow:hidden}._0bBxiW_listItemIdle{color:var(--foreground-tertiary);white-space:nowrap;text-overflow:ellipsis;font-size:12px;overflow:hidden}._0bBxiW_listItemAvatar{background:var(--muted);width:28px;height:28px;color:var(--muted-foreground);border-radius:8px;flex:none;justify-content:center;align-items:center;font-size:12px;font-weight:600;display:inline-flex}._0bBxiW_activeDot{background:var(--success);border-radius:50%;flex:none;width:6px;height:6px}._0bBxiW_serverDetail{box-sizing:border-box;flex-direction:column;flex:1;min-width:0;padding-left:24px;display:flex}._0bBxiW_detailHeader{flex:none;justify-content:space-between;align-items:center;gap:8px;padding-bottom:12px;display:flex}._0bBxiW_detailHeaderContent{min-width:0}._0bBxiW_detailTitle{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:15px;font-weight:600;overflow:hidden}._0bBxiW_detailMeta{flex-wrap:wrap;gap:4px 12px;margin-top:2px;display:flex}._0bBxiW_detailMetaItem{color:var(--muted-foreground);align-items:center;gap:4px;font-size:12px;display:inline-flex}._0bBxiW_descriptionText{color:var(--muted-foreground);font-size:13px;line-height:20px}._0bBxiW_detailScroll{flex:1;min-height:0;overflow-y:auto}._0bBxiW_detailContentMaxWidth{flex-direction:column;gap:16px;width:100%;max-width:640px;display:flex}._0bBxiW_tabBar{border-bottom:.5px solid var(--border);flex:none;align-items:center;gap:2px;margin-bottom:16px;display:flex}._0bBxiW_tab{height:36px;color:var(--muted-foreground);cursor:pointer;background:0 0;border:none;border-bottom:2px solid #0000;align-items:center;margin-bottom:-.5px;padding:0 12px;font-family:inherit;font-size:14px;display:inline-flex}._0bBxiW_tab:hover{color:var(--foreground)}._0bBxiW_tabActive{color:var(--foreground);border-bottom-color:var(--primary);font-weight:500}._0bBxiW_section{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;flex-direction:column;gap:12px;padding:16px;display:flex}._0bBxiW_sectionHeader{justify-content:space-between;align-items:center;gap:8px;display:flex}._0bBxiW_sectionHeading{color:var(--foreground);font-size:15px;font-weight:600}._0bBxiW_sectionBody{flex-direction:column;gap:12px;display:flex}._0bBxiW_fieldGroup{flex-direction:column;gap:6px;display:flex}._0bBxiW_fieldLabel{color:var(--foreground);font-size:13px;font-weight:500}._0bBxiW_fieldHint{color:var(--foreground-tertiary);font-size:12px}._0bBxiW_fieldRow{justify-content:space-between;align-items:center;gap:8px;display:flex}._0bBxiW_input{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 10px;font-family:inherit;font-size:14px}._0bBxiW_input:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}._0bBxiW_textarea{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;color:var(--foreground);font-family:var(--ds-font-family-code), monospace;box-sizing:border-box;resize:vertical;border-radius:8px;outline:none;min-height:72px;padding:8px 10px;font-size:13px;line-height:20px}._0bBxiW_textarea:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}._0bBxiW_checkbox{width:16px;height:16px;accent-color:var(--primary);cursor:pointer}._0bBxiW_switchWrapper{cursor:pointer;align-items:center;display:inline-flex;position:relative}._0bBxiW_switchInput{opacity:0;width:0;height:0;position:absolute}._0bBxiW_switchSlider{background:var(--input);border-radius:9999px;width:36px;height:20px;transition:background .15s;display:inline-block;position:relative}._0bBxiW_switchSlider:before{content:\"\";background:var(--popover-foreground);border-radius:50%;width:16px;height:16px;transition:transform .15s;position:absolute;top:2px;left:2px}._0bBxiW_switchInput:checked+._0bBxiW_switchSlider{background:var(--primary)}._0bBxiW_switchInput:checked+._0bBxiW_switchSlider:before{transform:translate(16px)}._0bBxiW_logHeader{justify-content:space-between;align-items:center;gap:8px;display:flex}._0bBxiW_logInfo{color:var(--muted-foreground);font-size:12px}._0bBxiW_codeBlock{border:1px solid var(--border-subtle);background:var(--background-subtle);font-family:var(--ds-font-family-code), monospace;border-radius:8px;flex-direction:column;gap:0;max-height:320px;padding:12px;font-size:12px;line-height:18px;display:flex;overflow-y:auto}._0bBxiW_codeLine{color:var(--foreground);white-space:pre-wrap;word-break:break-all}._0bBxiW_toolsList{flex-direction:column;gap:2px;display:flex}._0bBxiW_toolItem{border-radius:8px;align-items:center;gap:10px;padding:6px 8px;display:flex}._0bBxiW_toolItem:hover{background:var(--muted)}._0bBxiW_toolHeader{flex:1;min-width:0}._0bBxiW_toolName{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:14px;overflow:hidden}._0bBxiW_toolDescription{color:var(--muted-foreground);font-size:12px}._0bBxiW_resourceUri{color:var(--foreground-tertiary);font-size:12px;font-family:var(--ds-font-family-code), monospace}._0bBxiW_primaryButton{background:var(--primary);height:32px;color:var(--primary-foreground);cursor:pointer;border:1px solid #0000;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}._0bBxiW_primaryButton:hover:not(:disabled){background:var(--cs-brand-600)}._0bBxiW_primaryButton:disabled{opacity:.5;cursor:not-allowed}._0bBxiW_secondaryButton{border:1px solid var(--border-subtle);background:var(--secondary);height:32px;color:var(--secondary-foreground);cursor:pointer;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}._0bBxiW_secondaryButton:hover:not(:disabled){background:var(--secondary-hover)}._0bBxiW_secondaryButton:disabled{opacity:.5;cursor:not-allowed}._0bBxiW_formActions{justify-content:flex-end;align-items:center;gap:8px;display:flex}._0bBxiW_addFooter{justify-content:flex-end;display:flex}._0bBxiW_dangerZone{border:1px solid var(--error-border);background:var(--error-subtle);border-radius:10px;flex-direction:column;gap:8px;padding:16px;display:flex}._0bBxiW_dangerZoneTitle{color:var(--error-subtle-foreground);font-size:15px;font-weight:600}._0bBxiW_dangerZoneText{color:var(--error-subtle-foreground);font-size:13px}._0bBxiW_dangerZoneDescription{color:var(--muted-foreground);font-size:12px}._0bBxiW_dangerButton{border:1px solid var(--error-border);height:32px;color:var(--destructive);cursor:pointer;background:0 0;border-radius:8px;justify-content:center;align-self:flex-start;align-items:center;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}._0bBxiW_dangerButton:hover{background:var(--error-subtle)}._0bBxiW_loading{min-height:200px;color:var(--muted-foreground);justify-content:center;align-items:center;font-size:14px;display:flex}._0bBxiW_error{border:1px solid var(--error-border);background:var(--error-subtle);color:var(--error-subtle-foreground);border-radius:8px;align-items:center;gap:8px;padding:8px 12px;font-size:13px;display:flex}._0bBxiW_errorBox{border:1px solid var(--error-border);background:var(--error-subtle);color:var(--error-subtle-foreground);border-radius:8px;padding:8px 12px;font-size:13px}._0bBxiW_emptyState{color:var(--muted-foreground);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:6px;padding:48px 16px;display:flex}._0bBxiW_emptyTitle{color:var(--foreground);font-size:15px;font-weight:600}._0bBxiW_emptyDescription{color:var(--muted-foreground);font-size:13px}._0bBxiW_emptyIcon{color:var(--foreground-tertiary)}._0bBxiW_emptyDetailState{color:var(--foreground-tertiary);text-align:center;flex:1;justify-content:center;align-items:center;padding:48px 16px;font-size:14px;display:flex}";
		const tagId$15 = "@dsh-control-center/bundle/McpSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$15) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$15;
			tag.textContent = css$15;
			document.head.appendChild(tag);
		}
		var McpSection_module_css_default = {
			"switchSlider": "_0bBxiW_switchSlider",
			"detailContentMaxWidth": "_0bBxiW_detailContentMaxWidth",
			"input": "_0bBxiW_input",
			"loading": "_0bBxiW_loading",
			"toolHeader": "_0bBxiW_toolHeader",
			"emptyTitle": "_0bBxiW_emptyTitle",
			"listItemIdle": "_0bBxiW_listItemIdle",
			"detailHeader": "_0bBxiW_detailHeader",
			"checkbox": "_0bBxiW_checkbox",
			"emptyState": "_0bBxiW_emptyState",
			"emptyDetailState": "_0bBxiW_emptyDetailState",
			"searchRow": "_0bBxiW_searchRow",
			"fieldRow": "_0bBxiW_fieldRow",
			"fieldHint": "_0bBxiW_fieldHint",
			"listItem": "_0bBxiW_listItem",
			"activeDot": "_0bBxiW_activeDot",
			"listItemSelected": "_0bBxiW_listItemSelected",
			"detailHeaderContent": "_0bBxiW_detailHeaderContent",
			"detailMetaItem": "_0bBxiW_detailMetaItem",
			"logInfo": "_0bBxiW_logInfo",
			"dangerZoneDescription": "_0bBxiW_dangerZoneDescription",
			"dangerZoneText": "_0bBxiW_dangerZoneText",
			"toolDescription": "_0bBxiW_toolDescription",
			"textarea": "_0bBxiW_textarea",
			"searchIcon": "_0bBxiW_searchIcon",
			"listItemAvatar": "_0bBxiW_listItemAvatar",
			"addFooter": "_0bBxiW_addFooter",
			"serverList": "_0bBxiW_serverList",
			"codeBlock": "_0bBxiW_codeBlock",
			"listScroller": "_0bBxiW_listScroller",
			"serverDetail": "_0bBxiW_serverDetail",
			"listItems": "_0bBxiW_listItems",
			"tabBar": "_0bBxiW_tabBar",
			"tabActive": "_0bBxiW_tabActive",
			"listItemMain": "_0bBxiW_listItemMain",
			"listItemLabel": "_0bBxiW_listItemLabel",
			"toolsList": "_0bBxiW_toolsList",
			"descriptionText": "_0bBxiW_descriptionText",
			"primaryButton": "_0bBxiW_primaryButton",
			"codeLine": "_0bBxiW_codeLine",
			"fieldGroup": "_0bBxiW_fieldGroup",
			"section": "_0bBxiW_section",
			"detailMeta": "_0bBxiW_detailMeta",
			"secondaryButton": "_0bBxiW_secondaryButton",
			"splitRoot": "_0bBxiW_splitRoot",
			"dangerButton": "_0bBxiW_dangerButton",
			"detailTitle": "_0bBxiW_detailTitle",
			"switchInput": "_0bBxiW_switchInput",
			"searchInput": "_0bBxiW_searchInput",
			"dangerZoneTitle": "_0bBxiW_dangerZoneTitle",
			"sectionBody": "_0bBxiW_sectionBody",
			"searchClearButton": "_0bBxiW_searchClearButton",
			"dangerZone": "_0bBxiW_dangerZone",
			"toolItem": "_0bBxiW_toolItem",
			"toolName": "_0bBxiW_toolName",
			"error": "_0bBxiW_error",
			"detailScroll": "_0bBxiW_detailScroll",
			"logHeader": "_0bBxiW_logHeader",
			"formActions": "_0bBxiW_formActions",
			"errorBox": "_0bBxiW_errorBox",
			"searchWrap": "_0bBxiW_searchWrap",
			"resourceUri": "_0bBxiW_resourceUri",
			"emptyDescription": "_0bBxiW_emptyDescription",
			"emptyIcon": "_0bBxiW_emptyIcon",
			"tab": "_0bBxiW_tab",
			"addButton": "_0bBxiW_addButton",
			"sectionHeader": "_0bBxiW_sectionHeader",
			"fieldLabel": "_0bBxiW_fieldLabel",
			"sectionHeading": "_0bBxiW_sectionHeading",
			"switchWrapper": "_0bBxiW_switchWrapper"
		};
		//#endregion
		//#region lib/types/client/McpSection.js
		/**
		* MCP Section - Split-pane layout matching Cherry Studio MCP management.
		* Left sidebar: server list with search/filter. Right detail: server settings + logs.
		*/
		function McpSection(props) {
			const { mcp: mcpService } = props;
			const [servers, setServers] = (0, react.useState)([]);
			const [selectedId, setSelectedId] = (0, react.useState)(void 0);
			const [formData, setFormData] = (0, react.useState)(null);
			const [isFormChanged, setIsFormChanged] = (0, react.useState)(false);
			const [isSaving, setIsSaving] = (0, react.useState)(false);
			const [search, setSearch] = (0, react.useState)("");
			const [loading, setLoading] = (0, react.useState)(true);
			const [error, setError] = (0, react.useState)(null);
			const [activeTab, setActiveTab] = (0, react.useState)("settings");
			const [logs, setLogs] = (0, react.useState)([]);
			const [capabilities, setCapabilities] = (0, react.useState)(null);
			const [isRefreshingTools, setIsRefreshingTools] = (0, react.useState)(false);
			const [showAddDialog, setShowAddDialog] = (0, react.useState)(false);
			const loadServers = (0, react.useCallback)(async () => {
				if (!mcpService) {
					setError("MCP service not available");
					setLoading(false);
					return;
				}
				try {
					setLoading(true);
					setError(null);
					const result = await mcpService.list();
					if (!result.ok) throw new Error(result.error.message);
					const list = result.value;
					setServers(list);
					if (list.length > 0 && !selectedId && list[0] !== void 0) setSelectedId(list[0].id);
				} catch (err) {
					setError(err instanceof Error ? err.message : "Failed to load MCP servers");
				} finally {
					setLoading(false);
				}
			}, [mcpService, selectedId]);
			(0, react.useEffect)(() => {
				loadServers();
			}, [loadServers]);
			const filteredServers = (0, react.useMemo)(() => {
				if (!search) return servers;
				const keywords = search.toLowerCase().split(/\s+/).filter(Boolean);
				return servers.filter((s) => keywords.every((kw) => s.name.toLowerCase().includes(kw) || s.description?.toLowerCase().includes(kw) || s.type?.toLowerCase().includes(kw)));
			}, [servers, search]);
			const selectedServer = (0, react.useMemo)(() => filteredServers.find((s) => s.id === selectedId), [filteredServers, selectedId]);
			(0, react.useEffect)(() => {
				if (activeTab === "logs" && selectedId && mcpService) mcpService.getServerLogs(selectedId, 100).then((result) => {
					if (result.ok) setLogs(result.value);
				}).catch(() => setLogs([]));
			}, [
				activeTab,
				selectedId,
				mcpService
			]);
			(0, react.useEffect)(() => {
				if (activeTab !== "logs" || !selectedId || !mcpService) return;
				const interval = setInterval(() => {
					mcpService.getServerLogs(selectedId, 100).then((result) => {
						if (result.ok) setLogs(result.value);
					}).catch(() => {});
				}, 3e3);
				return () => clearInterval(interval);
			}, [
				activeTab,
				selectedId,
				mcpService
			]);
			(0, react.useEffect)(() => {
				if (selectedId && mcpService && selectedServer?.isActive) mcpService.getCapabilities(selectedId).then((result) => {
					if (result.ok) setCapabilities(result.value);
				}).catch(() => setCapabilities(null));
				else setCapabilities(null);
			}, [
				selectedId,
				mcpService,
				selectedServer?.isActive
			]);
			(0, react.useEffect)(() => {
				if (selectedServer) {
					setFormData({
						name: selectedServer.name,
						command: selectedServer.command || "",
						args: selectedServer.args?.join("\n") || "",
						env: selectedServer.env ? Object.entries(selectedServer.env).map(([key, value]) => `${key}=${value}`).join("\n") : "",
						timeout: selectedServer.timeout || 30,
						longRunning: selectedServer.longRunning || false
					});
					setIsFormChanged(false);
				} else {
					setFormData(null);
					setIsFormChanged(false);
				}
			}, [selectedServer]);
			const handleFormChange = (0, react.useCallback)((field, value) => {
				setFormData((prev) => prev ? {
					...prev,
					[field]: value
				} : null);
				setIsFormChanged(true);
			}, []);
			const handleSave = (0, react.useCallback)(async () => {
				if (!mcpService || !selectedServer || !formData) return;
				if (!selectedServer.type || selectedServer.type === "stdio") {
					if (!formData.command.trim()) {
						setError("命令字段不能为空");
						return;
					}
				}
				setIsSaving(true);
				setError(null);
				try {
					const envParsed = formData.env ? Object.fromEntries(formData.env.split("\n").filter((line) => line.includes("=")).map((line) => {
						const idx = line.indexOf("=");
						return [line.slice(0, idx), line.slice(idx + 1)];
					})) : {};
					const dto = {
						name: formData.name,
						command: formData.command,
						args: formData.args.split("\n").filter((arg) => arg.trim() !== ""),
						timeout: formData.timeout,
						longRunning: formData.longRunning
					};
					if (Object.keys(envParsed).length > 0) dto.env = envParsed;
					const updateResult = await mcpService.update(selectedServer.id, dto);
					if (!updateResult.ok) throw new Error(updateResult.error.message);
					if (selectedServer.isActive) {
						const stopResult = await mcpService.stopServer(selectedServer.id);
						if (!stopResult.ok) throw new Error(stopResult.error.message);
						const restartResult = await mcpService.update(selectedServer.id, { isActive: true });
						if (!restartResult.ok) throw new Error(restartResult.error.message);
					}
					await loadServers();
					setIsFormChanged(false);
				} catch (err) {
					setError(err instanceof Error ? err.message : "保存失败");
				} finally {
					setIsSaving(false);
				}
			}, [
				mcpService,
				selectedServer,
				formData,
				loadServers
			]);
			const handleCancel = (0, react.useCallback)(() => {
				if (selectedServer) {
					setFormData({
						name: selectedServer.name,
						command: selectedServer.command || "",
						args: selectedServer.args?.join("\n") || "",
						env: selectedServer.env ? Object.entries(selectedServer.env).map(([key, value]) => `${key}=${value}`).join("\n") : "",
						timeout: selectedServer.timeout || 30,
						longRunning: selectedServer.longRunning || false
					});
					setIsFormChanged(false);
				}
			}, [selectedServer]);
			const handleCreate = (0, react.useCallback)(async (dto) => {
				if (!mcpService) return;
				const result = await mcpService.create(dto);
				if (!result.ok) throw new Error(result.error.message);
				await loadServers();
				setShowAddDialog(false);
			}, [mcpService, loadServers]);
			const handleDelete = (0, react.useCallback)(async (serverId, serverName) => {
				if (!mcpService) return;
				if (!window.confirm(`确定要删除 "${serverName}" MCP 服务器吗？`)) return;
				try {
					const result = await mcpService.delete(serverId);
					if (!result.ok) throw new Error(result.error.message);
					await loadServers();
				} catch (err) {
					setError(err instanceof Error ? err.message : "Failed to delete server");
				}
			}, [mcpService, loadServers]);
			if (loading) return (0, react_jsx_runtime.jsx)("div", {
				className: McpSection_module_css_default.splitRoot,
				children: (0, react_jsx_runtime.jsx)("div", {
					className: McpSection_module_css_default.loading,
					children: "加载中..."
				})
			});
			if (error) return (0, react_jsx_runtime.jsx)("div", {
				className: McpSection_module_css_default.splitRoot,
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: McpSection_module_css_default.error,
					children: [
						(0, react_jsx_runtime.jsx)("div", {
							className: McpSection_module_css_default.emptyTitle,
							children: "加载失败"
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: McpSection_module_css_default.emptyDescription,
							children: error
						}),
						(0, react_jsx_runtime.jsx)("button", {
							className: McpSection_module_css_default.secondaryButton,
							onClick: () => void loadServers(),
							children: "重试"
						})
					]
				})
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: McpSection_module_css_default.splitRoot,
				children: [
					(0, react_jsx_runtime.jsxs)("aside", {
						className: McpSection_module_css_default.serverList,
						children: [
							(0, react_jsx_runtime.jsx)("div", {
								className: McpSection_module_css_default.searchRow,
								children: (0, react_jsx_runtime.jsxs)("div", {
									className: McpSection_module_css_default.searchWrap,
									children: [
										(0, react_jsx_runtime.jsxs)("svg", {
											className: McpSection_module_css_default.searchIcon,
											viewBox: "0 0 16 16",
											fill: "none",
											children: [(0, react_jsx_runtime.jsx)("circle", {
												cx: "7",
												cy: "7",
												r: "5",
												stroke: "currentColor",
												strokeWidth: "1.5"
											}), (0, react_jsx_runtime.jsx)("path", {
												d: "M11 11L14 14",
												stroke: "currentColor",
												strokeWidth: "1.5",
												strokeLinecap: "round"
											})]
										}),
										(0, react_jsx_runtime.jsx)("input", {
											type: "text",
											className: McpSection_module_css_default.searchInput,
											placeholder: "搜索 MCP 服务器...",
											value: search,
											onChange: (e) => setSearch(e.target.value)
										}),
										search && (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: McpSection_module_css_default.searchClearButton,
											onClick: () => setSearch(""),
											"aria-label": "清除搜索",
											children: (0, react_jsx_runtime.jsx)("svg", {
												width: "12",
												height: "12",
												viewBox: "0 0 12 12",
												fill: "none",
												children: (0, react_jsx_runtime.jsx)("path", {
													d: "M9 3L3 9M3 3L9 9",
													stroke: "currentColor",
													strokeWidth: "1.5",
													strokeLinecap: "round"
												})
											})
										})
									]
								})
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: McpSection_module_css_default.listScroller,
								children: filteredServers.length === 0 ? (0, react_jsx_runtime.jsx)("div", {
									className: McpSection_module_css_default.emptyState,
									children: search ? "没有找到匹配的服务器" : "暂无配置的 MCP 服务器"
								}) : (0, react_jsx_runtime.jsx)("div", {
									className: McpSection_module_css_default.listItems,
									children: filteredServers.map((server) => (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: `${McpSection_module_css_default.listItem} ${server.id === selectedId ? McpSection_module_css_default.listItemSelected : McpSection_module_css_default.listItemIdle}`,
										onClick: () => setSelectedId(server.id),
										children: [(0, react_jsx_runtime.jsxs)("div", {
											className: McpSection_module_css_default.listItemMain,
											children: [(0, react_jsx_runtime.jsx)("div", {
												className: McpSection_module_css_default.listItemAvatar,
												children: (0, react_jsx_runtime.jsxs)("svg", {
													width: "20",
													height: "20",
													viewBox: "0 0 20 20",
													fill: "none",
													children: [(0, react_jsx_runtime.jsx)("rect", {
														width: "20",
														height: "20",
														rx: "4",
														fill: "currentColor",
														opacity: "0.1"
													}), (0, react_jsx_runtime.jsx)("path", {
														d: "M6 8L10 12L14 8",
														stroke: "currentColor",
														strokeWidth: "1.5",
														strokeLinecap: "round",
														strokeLinejoin: "round"
													})]
												})
											}), (0, react_jsx_runtime.jsx)("span", {
												className: McpSection_module_css_default.listItemLabel,
												children: server.name
											})]
										}), server.isActive && (0, react_jsx_runtime.jsx)("span", { className: McpSection_module_css_default.activeDot })]
									}, server.id))
								})
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: McpSection_module_css_default.addFooter,
								children: (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: McpSection_module_css_default.addButton,
									onClick: () => setShowAddDialog(true),
									children: [(0, react_jsx_runtime.jsx)("svg", {
										width: "14",
										height: "14",
										viewBox: "0 0 14 14",
										fill: "none",
										children: (0, react_jsx_runtime.jsx)("path", {
											d: "M7 3V11M3 7H11",
											stroke: "currentColor",
											strokeWidth: "1.5",
											strokeLinecap: "round"
										})
									}), (0, react_jsx_runtime.jsx)("span", { children: "添加服务器" })]
								})
							})
						]
					}),
					selectedServer ? (0, react_jsx_runtime.jsxs)("main", {
						className: McpSection_module_css_default.serverDetail,
						children: [
							(0, react_jsx_runtime.jsx)("div", {
								className: McpSection_module_css_default.detailHeader,
								children: (0, react_jsx_runtime.jsxs)("div", {
									className: McpSection_module_css_default.detailHeaderContent,
									children: [(0, react_jsx_runtime.jsx)("h2", {
										className: McpSection_module_css_default.detailTitle,
										children: selectedServer.name
									}), (0, react_jsx_runtime.jsxs)("div", {
										className: McpSection_module_css_default.detailMeta,
										children: [(0, react_jsx_runtime.jsxs)("span", {
											className: McpSection_module_css_default.detailMetaItem,
											children: [(0, react_jsx_runtime.jsx)("svg", {
												width: "12",
												height: "12",
												viewBox: "0 0 12 12",
												fill: "none",
												children: (0, react_jsx_runtime.jsx)("path", {
													d: "M6 2L3 4V8L6 10L9 8V4L6 2Z",
													stroke: "currentColor",
													strokeWidth: "1.5",
													strokeLinecap: "round",
													strokeLinejoin: "round"
												})
											}), selectedServer.type || "stdio"]
										}), selectedServer.runtimeState && (0, react_jsx_runtime.jsxs)("span", {
											className: McpSection_module_css_default.detailMetaItem,
											children: [(0, react_jsx_runtime.jsx)("svg", {
												width: "12",
												height: "12",
												viewBox: "0 0 12 12",
												fill: "none",
												children: (0, react_jsx_runtime.jsx)("circle", {
													cx: "6",
													cy: "6",
													r: "4",
													stroke: "currentColor",
													strokeWidth: "1.5"
												})
											}), selectedServer.runtimeState === "connected" ? "已连接" : selectedServer.runtimeState === "connecting" ? "连接中" : selectedServer.runtimeState === "error" ? "错误" : "已禁用"]
										})]
									})]
								})
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: McpSection_module_css_default.tabBar,
								children: [
									(0, react_jsx_runtime.jsx)("button", {
										className: activeTab === "settings" ? McpSection_module_css_default.tabActive : McpSection_module_css_default.tab,
										onClick: () => setActiveTab("settings"),
										children: "设置"
									}),
									selectedServer.description && (0, react_jsx_runtime.jsx)("button", {
										className: activeTab === "description" ? McpSection_module_css_default.tabActive : McpSection_module_css_default.tab,
										onClick: () => setActiveTab("description"),
										children: "描述"
									}),
									(0, react_jsx_runtime.jsx)("button", {
										className: activeTab === "logs" ? McpSection_module_css_default.tabActive : McpSection_module_css_default.tab,
										onClick: () => setActiveTab("logs"),
										children: "日志"
									}),
									selectedServer.isActive && capabilities?.tools && (0, react_jsx_runtime.jsxs)("button", {
										className: activeTab === "tools" ? McpSection_module_css_default.tabActive : McpSection_module_css_default.tab,
										onClick: () => setActiveTab("tools"),
										children: ["工具 ", capabilities.tools.length > 0 ? `(${capabilities.tools.length})` : ""]
									}),
									selectedServer.isActive && capabilities?.prompts && (0, react_jsx_runtime.jsxs)("button", {
										className: activeTab === "prompts" ? McpSection_module_css_default.tabActive : McpSection_module_css_default.tab,
										onClick: () => setActiveTab("prompts"),
										children: ["提示词 ", capabilities.prompts.length > 0 ? `(${capabilities.prompts.length})` : ""]
									}),
									selectedServer.isActive && capabilities?.resources && (0, react_jsx_runtime.jsxs)("button", {
										className: activeTab === "resources" ? McpSection_module_css_default.tabActive : McpSection_module_css_default.tab,
										onClick: () => setActiveTab("resources"),
										children: ["资源 ", capabilities.resources.length > 0 ? `(${capabilities.resources.length})` : ""]
									})
								]
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: McpSection_module_css_default.detailScroll,
								children: (0, react_jsx_runtime.jsxs)("div", {
									className: McpSection_module_css_default.detailContentMaxWidth,
									children: [
										activeTab === "settings" && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
											(0, react_jsx_runtime.jsxs)("section", {
												className: McpSection_module_css_default.section,
												children: [(0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.sectionHeader,
													children: (0, react_jsx_runtime.jsx)("h3", {
														className: McpSection_module_css_default.sectionHeading,
														children: "状态"
													})
												}), (0, react_jsx_runtime.jsxs)("div", {
													className: McpSection_module_css_default.sectionBody,
													children: [(0, react_jsx_runtime.jsx)("div", {
														className: McpSection_module_css_default.fieldRow,
														children: (0, react_jsx_runtime.jsxs)("label", {
															className: McpSection_module_css_default.fieldLabel,
															children: [(0, react_jsx_runtime.jsx)("input", {
																type: "checkbox",
																className: McpSection_module_css_default.checkbox,
																checked: selectedServer.isActive,
																onChange: async (e) => {
																	if (!mcpService) return;
																	try {
																		const result = await mcpService.update(selectedServer.id, { isActive: e.target.checked });
																		if (!result.ok) throw new Error(result.error.message);
																		await loadServers();
																	} catch (err) {
																		setError(err instanceof Error ? err.message : "Failed to update server");
																	}
																}
															}), (0, react_jsx_runtime.jsx)("span", { children: "启用此服务器" })]
														})
													}), selectedServer.lastError && (0, react_jsx_runtime.jsxs)("div", {
														className: McpSection_module_css_default.errorBox,
														children: [(0, react_jsx_runtime.jsxs)("svg", {
															width: "14",
															height: "14",
															viewBox: "0 0 14 14",
															fill: "none",
															children: [(0, react_jsx_runtime.jsx)("circle", {
																cx: "7",
																cy: "7",
																r: "6",
																stroke: "currentColor",
																strokeWidth: "1.5"
															}), (0, react_jsx_runtime.jsx)("path", {
																d: "M7 4V7M7 9.5V10",
																stroke: "currentColor",
																strokeWidth: "1.5",
																strokeLinecap: "round"
															})]
														}), (0, react_jsx_runtime.jsx)("span", { children: selectedServer.lastError })]
													})]
												})]
											}),
											(!selectedServer.type || selectedServer.type === "stdio") && formData && (0, react_jsx_runtime.jsxs)("section", {
												className: McpSection_module_css_default.section,
												children: [(0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.sectionHeader,
													children: (0, react_jsx_runtime.jsx)("h3", {
														className: McpSection_module_css_default.sectionHeading,
														children: "命令配置"
													})
												}), (0, react_jsx_runtime.jsxs)("div", {
													className: McpSection_module_css_default.sectionBody,
													children: [
														(0, react_jsx_runtime.jsxs)("div", {
															className: McpSection_module_css_default.fieldGroup,
															children: [(0, react_jsx_runtime.jsx)("label", {
																className: McpSection_module_css_default.fieldLabel,
																children: "服务器名称 *"
															}), (0, react_jsx_runtime.jsx)("input", {
																type: "text",
																className: McpSection_module_css_default.input,
																value: formData.name,
																onChange: (e) => handleFormChange("name", e.target.value),
																placeholder: "例如: my-mcp-server"
															})]
														}),
														(0, react_jsx_runtime.jsxs)("div", {
															className: McpSection_module_css_default.fieldGroup,
															children: [(0, react_jsx_runtime.jsx)("label", {
																className: McpSection_module_css_default.fieldLabel,
																children: "命令 *"
															}), (0, react_jsx_runtime.jsx)("input", {
																type: "text",
																className: McpSection_module_css_default.input,
																value: formData.command,
																onChange: (e) => handleFormChange("command", e.target.value),
																placeholder: "例如: npx, uvx, python"
															})]
														}),
														(0, react_jsx_runtime.jsxs)("div", {
															className: McpSection_module_css_default.fieldGroup,
															children: [
																(0, react_jsx_runtime.jsx)("label", {
																	className: McpSection_module_css_default.fieldLabel,
																	children: "参数"
																}),
																(0, react_jsx_runtime.jsx)("textarea", {
																	className: McpSection_module_css_default.textarea,
																	value: formData.args,
																	onChange: (e) => handleFormChange("args", e.target.value),
																	placeholder: "每行一个参数\n例如:\n-m\nmcp_server",
																	rows: 5
																}),
																(0, react_jsx_runtime.jsx)("div", {
																	className: McpSection_module_css_default.fieldHint,
																	children: "每行一个参数"
																})
															]
														})
													]
												})]
											}),
											(!selectedServer.type || selectedServer.type === "stdio") && formData && (0, react_jsx_runtime.jsxs)("section", {
												className: McpSection_module_css_default.section,
												children: [(0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.sectionHeader,
													children: (0, react_jsx_runtime.jsx)("h3", {
														className: McpSection_module_css_default.sectionHeading,
														children: "环境变量"
													})
												}), (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.sectionBody,
													children: (0, react_jsx_runtime.jsxs)("div", {
														className: McpSection_module_css_default.fieldGroup,
														children: [
															(0, react_jsx_runtime.jsx)("label", {
																className: McpSection_module_css_default.fieldLabel,
																children: "环境变量"
															}),
															(0, react_jsx_runtime.jsx)("textarea", {
																className: McpSection_module_css_default.textarea,
																value: formData.env,
																onChange: (e) => handleFormChange("env", e.target.value),
																placeholder: "每行一个键值对\n例如:\nAPI_KEY=your_key\nDEBUG=true",
																rows: 5
															}),
															(0, react_jsx_runtime.jsx)("div", {
																className: McpSection_module_css_default.fieldHint,
																children: "格式: KEY=VALUE，每行一个"
															})
														]
													})
												})]
											}),
											formData && (0, react_jsx_runtime.jsxs)("section", {
												className: McpSection_module_css_default.section,
												children: [(0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.sectionHeader,
													children: (0, react_jsx_runtime.jsx)("h3", {
														className: McpSection_module_css_default.sectionHeading,
														children: "超时设置"
													})
												}), (0, react_jsx_runtime.jsxs)("div", {
													className: McpSection_module_css_default.sectionBody,
													children: [(0, react_jsx_runtime.jsxs)("div", {
														className: McpSection_module_css_default.fieldGroup,
														children: [(0, react_jsx_runtime.jsx)("label", {
															className: McpSection_module_css_default.fieldLabel,
															children: "连接超时（秒）"
														}), (0, react_jsx_runtime.jsx)("input", {
															type: "number",
															className: McpSection_module_css_default.input,
															value: formData.timeout,
															onChange: (e) => handleFormChange("timeout", parseInt(e.target.value) || 30),
															min: 1,
															max: 300
														})]
													}), (0, react_jsx_runtime.jsx)("div", {
														className: McpSection_module_css_default.fieldRow,
														children: (0, react_jsx_runtime.jsxs)("label", {
															className: McpSection_module_css_default.fieldLabel,
															children: [(0, react_jsx_runtime.jsx)("input", {
																type: "checkbox",
																className: McpSection_module_css_default.checkbox,
																checked: formData.longRunning,
																onChange: (e) => handleFormChange("longRunning", e.target.checked)
															}), (0, react_jsx_runtime.jsx)("span", { children: "长时间运行" })]
														})
													})]
												})]
											}),
											formData && isFormChanged && (0, react_jsx_runtime.jsx)("section", {
												className: McpSection_module_css_default.section,
												children: (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.sectionBody,
													children: (0, react_jsx_runtime.jsxs)("div", {
														className: McpSection_module_css_default.formActions,
														children: [(0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: McpSection_module_css_default.primaryButton,
															onClick: handleSave,
															disabled: isSaving,
															children: isSaving ? "保存中..." : "保存更改"
														}), (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: McpSection_module_css_default.secondaryButton,
															onClick: handleCancel,
															disabled: isSaving,
															children: "取消"
														})]
													})
												})
											}),
											(0, react_jsx_runtime.jsxs)("section", {
												className: McpSection_module_css_default.section,
												children: [(0, react_jsx_runtime.jsx)("h3", {
													className: McpSection_module_css_default.sectionHeading,
													children: "危险操作"
												}), (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.sectionBody,
													children: (0, react_jsx_runtime.jsxs)("div", {
														className: McpSection_module_css_default.dangerZone,
														children: [(0, react_jsx_runtime.jsxs)("div", {
															className: McpSection_module_css_default.dangerZoneText,
															children: [(0, react_jsx_runtime.jsx)("div", {
																className: McpSection_module_css_default.dangerZoneTitle,
																children: "删除服务器"
															}), (0, react_jsx_runtime.jsx)("div", {
																className: McpSection_module_css_default.dangerZoneDescription,
																children: "此操作不可撤销。删除后，所有关联的工具和配置也将被移除。"
															})]
														}), (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: McpSection_module_css_default.dangerButton,
															onClick: () => handleDelete(selectedServer.id, selectedServer.name),
															children: "删除"
														})]
													})
												})]
											})
										] }),
										activeTab === "description" && selectedServer.description && (0, react_jsx_runtime.jsx)("section", {
											className: McpSection_module_css_default.section,
											children: (0, react_jsx_runtime.jsx)("div", {
												className: McpSection_module_css_default.sectionBody,
												children: (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.descriptionText,
													children: selectedServer.description
												})
											})
										}),
										activeTab === "logs" && (0, react_jsx_runtime.jsxs)("section", {
											className: McpSection_module_css_default.section,
											children: [(0, react_jsx_runtime.jsx)("h3", {
												className: McpSection_module_css_default.sectionHeading,
												children: "服务器日志"
											}), (0, react_jsx_runtime.jsx)("div", {
												className: McpSection_module_css_default.sectionBody,
												children: logs.length > 0 ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
													className: McpSection_module_css_default.logHeader,
													children: [(0, react_jsx_runtime.jsx)("span", {
														className: McpSection_module_css_default.logInfo,
														children: "实时更新 (每3秒)"
													}), (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: McpSection_module_css_default.secondaryButton,
														onClick: () => {
															if (selectedId && mcpService) mcpService.getServerLogs(selectedId, 100).then((result) => {
																if (result.ok) setLogs(result.value);
															}).catch(() => setLogs([]));
														},
														children: "刷新"
													})]
												}), (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.codeBlock,
													children: logs.map((line, idx) => (0, react_jsx_runtime.jsx)("div", {
														className: McpSection_module_css_default.codeLine,
														children: line
													}, idx))
												})] }) : (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.emptyState,
													children: "暂无日志"
												})
											})]
										}),
										activeTab === "tools" && capabilities?.tools && (0, react_jsx_runtime.jsx)("section", {
											className: McpSection_module_css_default.section,
											children: (0, react_jsx_runtime.jsx)("div", {
												className: McpSection_module_css_default.sectionBody,
												children: capabilities.tools.length > 0 ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
													className: McpSection_module_css_default.logHeader,
													children: [(0, react_jsx_runtime.jsxs)("div", {
														className: McpSection_module_css_default.logInfo,
														children: [
															"共 ",
															capabilities.tools.length,
															" 个工具"
														]
													}), (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: McpSection_module_css_default.secondaryButton,
														disabled: isRefreshingTools,
														onClick: async () => {
															if (!selectedId || !mcpService) return;
															setIsRefreshingTools(true);
															try {
																const refreshResult = await mcpService.refreshTools(selectedId);
																if (!refreshResult.ok) throw new Error(refreshResult.error.message);
																const caps = await mcpService.getCapabilities(selectedId);
																if (!caps.ok) throw new Error(caps.error.message);
																setCapabilities(caps.value);
															} catch (error) {
																console.error("Failed to refresh tools:", error);
															} finally {
																setIsRefreshingTools(false);
															}
														},
														children: isRefreshingTools ? "刷新中..." : "刷新工具"
													})]
												}), (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.toolsList,
													children: capabilities.tools.map((tool, idx) => {
														const isEnabled = !selectedServer.disabledTools?.includes(tool.name);
														return (0, react_jsx_runtime.jsxs)("div", {
															className: McpSection_module_css_default.toolItem,
															children: [(0, react_jsx_runtime.jsxs)("div", {
																className: McpSection_module_css_default.toolHeader,
																children: [(0, react_jsx_runtime.jsx)("span", {
																	className: McpSection_module_css_default.toolName,
																	children: tool.name
																}), (0, react_jsx_runtime.jsxs)("label", {
																	className: McpSection_module_css_default.switchWrapper,
																	children: [(0, react_jsx_runtime.jsx)("input", {
																		type: "checkbox",
																		className: McpSection_module_css_default.switchInput,
																		checked: isEnabled,
																		onChange: async (e) => {
																			if (!mcpService) return;
																			const checked = e.target.checked;
																			const disabledTools = [...selectedServer.disabledTools || []];
																			try {
																				if (checked) {
																					const filtered = disabledTools.filter((name) => name !== tool.name);
																					const result = await mcpService.update(selectedServer.id, { disabledTools: filtered });
																					if (!result.ok) throw new Error(result.error.message);
																				} else {
																					if (!disabledTools.includes(tool.name)) disabledTools.push(tool.name);
																					const result = await mcpService.update(selectedServer.id, { disabledTools });
																					if (!result.ok) throw new Error(result.error.message);
																				}
																				await loadServers();
																			} catch (err) {
																				setError(err instanceof Error ? err.message : "Failed to update server");
																			}
																		}
																	}), (0, react_jsx_runtime.jsx)("span", { className: McpSection_module_css_default.switchSlider })]
																})]
															}), tool.description && (0, react_jsx_runtime.jsx)("div", {
																className: McpSection_module_css_default.toolDescription,
																children: tool.description
															})]
														}, idx);
													})
												})] }) : (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.emptyState,
													children: "暂无工具"
												})
											})
										}),
										activeTab === "prompts" && capabilities?.prompts && (0, react_jsx_runtime.jsx)("section", {
											className: McpSection_module_css_default.section,
											children: (0, react_jsx_runtime.jsx)("div", {
												className: McpSection_module_css_default.sectionBody,
												children: capabilities.prompts.length > 0 ? (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.toolsList,
													children: capabilities.prompts.map((prompt, idx) => (0, react_jsx_runtime.jsxs)("div", {
														className: McpSection_module_css_default.toolItem,
														children: [(0, react_jsx_runtime.jsx)("div", {
															className: McpSection_module_css_default.toolHeader,
															children: (0, react_jsx_runtime.jsx)("span", {
																className: McpSection_module_css_default.toolName,
																children: prompt.name
															})
														}), prompt.description && (0, react_jsx_runtime.jsx)("div", {
															className: McpSection_module_css_default.toolDescription,
															children: prompt.description
														})]
													}, idx))
												}) : (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.emptyState,
													children: "暂无提示词"
												})
											})
										}),
										activeTab === "resources" && capabilities?.resources && (0, react_jsx_runtime.jsx)("section", {
											className: McpSection_module_css_default.section,
											children: (0, react_jsx_runtime.jsx)("div", {
												className: McpSection_module_css_default.sectionBody,
												children: capabilities.resources.length > 0 ? (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.toolsList,
													children: capabilities.resources.map((resource, idx) => (0, react_jsx_runtime.jsxs)("div", {
														className: McpSection_module_css_default.toolItem,
														children: [
															(0, react_jsx_runtime.jsx)("div", {
																className: McpSection_module_css_default.toolHeader,
																children: (0, react_jsx_runtime.jsx)("span", {
																	className: McpSection_module_css_default.toolName,
																	children: resource.name
																})
															}),
															(0, react_jsx_runtime.jsx)("div", {
																className: McpSection_module_css_default.resourceUri,
																children: resource.uri
															}),
															resource.description && (0, react_jsx_runtime.jsx)("div", {
																className: McpSection_module_css_default.toolDescription,
																children: resource.description
															})
														]
													}, idx))
												}) : (0, react_jsx_runtime.jsx)("div", {
													className: McpSection_module_css_default.emptyState,
													children: "暂无资源"
												})
											})
										})
									]
								})
							})
						]
					}) : (0, react_jsx_runtime.jsx)("main", {
						className: McpSection_module_css_default.serverDetail,
						children: (0, react_jsx_runtime.jsxs)("div", {
							className: McpSection_module_css_default.emptyDetailState,
							children: [
								(0, react_jsx_runtime.jsxs)("svg", {
									className: McpSection_module_css_default.emptyIcon,
									viewBox: "0 0 64 64",
									fill: "none",
									children: [(0, react_jsx_runtime.jsx)("rect", {
										x: "12",
										y: "12",
										width: "40",
										height: "40",
										rx: "4",
										stroke: "currentColor",
										strokeWidth: "2"
									}), (0, react_jsx_runtime.jsx)("path", {
										d: "M24 28H40M24 32H36M24 36H40",
										stroke: "currentColor",
										strokeWidth: "2",
										strokeLinecap: "round"
									})]
								}),
								(0, react_jsx_runtime.jsx)("div", {
									className: McpSection_module_css_default.emptyTitle,
									children: "选择一个 MCP 服务器"
								}),
								(0, react_jsx_runtime.jsx)("div", {
									className: McpSection_module_css_default.emptyDescription,
									children: "在左侧列表中选择一个服务器以查看和管理其配置"
								})
							]
						})
					}),
					(0, react_jsx_runtime.jsx)(AddMcpServerDialog, {
						visible: showAddDialog,
						onClose: () => setShowAddDialog(false),
						onSubmit: handleCreate
					})
				]
			});
		}
		const STRICT_JSON_WEBSEARCH = {
			mode: "strict",
			typeSymbol: "@dsh-control-center/websearch-json",
			schema: { parse(value) {
				structuredClone(value);
				return value;
			} }
		};
		//#endregion
		//#region lib/types/websearch-remote-client.js
		/** Client descriptor contribution for the Control Center web search service. */
		const webSearchRemote = {
			package: "@dsh-control-center/control-center",
			descriptors: [
				{
					method: "getConfig",
					parameters: []
				},
				{
					method: "updateConfig",
					parameters: ["params"]
				},
				{
					method: "listProviders",
					parameters: []
				},
				{
					method: "getProvider",
					parameters: ["params"]
				},
				{
					method: "updateProviderOverride",
					parameters: ["params"]
				},
				{
					method: "checkProviderReady",
					parameters: ["params"]
				}
			].map(({ method, implementation, parameters }) => ({
				id: `@dsh-control-center/control-center#controlCenterWebSearch/${method}`,
				service: "controlCenterWebSearch",
				namespace: "controlCenterWebSearch",
				method,
				...implementation === void 0 ? {} : { implementation },
				invocation: { kind: "direct" },
				parameters: parameters.map((name) => ({
					name,
					wire: name,
					source: "json",
					codec: STRICT_JSON_WEBSEARCH
				})),
				result: STRICT_JSON_WEBSEARCH
			}))
		};
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\WebSearchSection.module.css.mjs
		const css$14 = "._0WjBOa_root{flex-direction:column;gap:16px;width:100%;max-width:768px;margin:0 auto;display:flex}._0WjBOa_pageHeader{margin-bottom:4px}._0WjBOa_pageTitle{color:var(--foreground);font-size:15px;font-weight:600}._0WjBOa_pageDescription{color:var(--muted-foreground);margin-top:4px;font-size:14px}._0WjBOa_card{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;flex-direction:column;gap:12px;padding:16px;display:flex}._0WjBOa_cardTitle{color:var(--foreground);justify-content:space-between;align-items:center;gap:8px;font-size:15px;font-weight:600;display:flex}._0WjBOa_cardDescription{color:var(--muted-foreground);margin-top:2px;font-size:12px}._0WjBOa_fieldRow{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 16px;min-height:24px;display:flex}._0WjBOa_fieldLabel{color:var(--foreground);font-size:14px}._0WjBOa_fieldHint{color:var(--muted-foreground);font-size:12px}._0WjBOa_input{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);height:32px;color:var(--foreground);box-shadow:none;box-sizing:border-box;border-radius:8px;outline:none;padding:0 10px;font-family:inherit;font-size:14px;line-height:32px}._0WjBOa_input:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent);outline:none}._0WjBOa_input::placeholder{color:var(--foreground-tertiary)}._0WjBOa_select{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 28px 0 10px;font-family:inherit;font-size:14px}._0WjBOa_select:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}._0WjBOa_checkbox{width:16px;height:16px;accent-color:var(--primary);cursor:pointer}._0WjBOa_providerDetail{border-top:1px solid var(--border-subtle);flex-direction:column;gap:12px;margin-top:4px;padding-top:16px;display:flex}._0WjBOa_providerName{color:var(--foreground);font-size:14px;font-weight:600}._0WjBOa_providerDescription{color:var(--muted-foreground);font-size:12px}._0WjBOa_apiKeyRow{align-items:center;gap:8px;display:flex}._0WjBOa_apiKeyRow ._0WjBOa_input{min-width:0;font-family:var(--ds-font-family-code), monospace;flex:1;font-size:13px}._0WjBOa_iconButton{border:1px solid var(--border-subtle);height:28px;color:var(--muted-foreground);cursor:pointer;white-space:nowrap;background:0 0;border-radius:8px;justify-content:center;align-items:center;padding:0 10px;font-family:inherit;font-size:13px;display:inline-flex}._0WjBOa_iconButton:hover{background:var(--muted);color:var(--foreground)}._0WjBOa_loading{min-height:200px;color:var(--muted-foreground);justify-content:center;align-items:center;font-size:14px;display:flex}";
		const tagId$14 = "@dsh-control-center/bundle/WebSearchSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$14) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$14;
			tag.textContent = css$14;
			document.head.appendChild(tag);
		}
		var WebSearchSection_module_css_default = {
			"fieldHint": "_0WjBOa_fieldHint",
			"select": "_0WjBOa_select",
			"card": "_0WjBOa_card",
			"input": "_0WjBOa_input",
			"pageTitle": "_0WjBOa_pageTitle",
			"providerName": "_0WjBOa_providerName",
			"loading": "_0WjBOa_loading",
			"pageHeader": "_0WjBOa_pageHeader",
			"fieldLabel": "_0WjBOa_fieldLabel",
			"root": "_0WjBOa_root",
			"apiKeyRow": "_0WjBOa_apiKeyRow",
			"providerDescription": "_0WjBOa_providerDescription",
			"checkbox": "_0WjBOa_checkbox",
			"cardTitle": "_0WjBOa_cardTitle",
			"fieldRow": "_0WjBOa_fieldRow",
			"providerDetail": "_0WjBOa_providerDetail",
			"pageDescription": "_0WjBOa_pageDescription",
			"iconButton": "_0WjBOa_iconButton",
			"cardDescription": "_0WjBOa_cardDescription"
		};
		//#endregion
		//#region lib/types/client/WebSearchSection.js
		/**
		* Web Search settings page (Cherry-composition: SettingsContentColumn cards).
		*
		* AGPL-3.0-only – layout adapted from Cherry Studio WebSearchSettings +
		* SettingsPrimitives (content column, setting cards, compact field style).
		*/
		/** Unwrap a strict-mode Typert envelope, throwing the wire error message on failure. */
		function unwrap$1(result) {
			if (!result.ok) throw new Error(result.error.message);
			return result.value;
		}
		const CAPABILITY_TITLES = {
			searchKeywords: "Search Keywords",
			fetchUrls: "Fetch URLs"
		};
		const CAPABILITY_DESCRIPTIONS = {
			searchKeywords: "Provider used to search the web for keywords and return ranked results.",
			fetchUrls: "Provider used to fetch and convert a URL into readable content."
		};
		function getFeatureSections(providers) {
			const sections = {
				searchKeywords: [],
				fetchUrls: []
			};
			for (const provider of providers) for (const capability of provider.capabilities) sections[capability.feature].push({
				provider,
				capability: capability.feature
			});
			return [{
				capability: "searchKeywords",
				entries: sections.searchKeywords
			}, {
				capability: "fetchUrls",
				entries: sections.fetchUrls
			}].filter((section) => section.entries.length > 0);
		}
		function WebSearchSection({ websearch }) {
			const [config, setConfig] = (0, react.useState)(null);
			const [providers, setProviders] = (0, react.useState)([]);
			const [loading, setLoading] = (0, react.useState)(true);
			(0, react.useEffect)(() => {
				Promise.all([websearch.getConfig(), websearch.listProviders()]).then(([cfg, pvs]) => {
					setConfig(unwrap$1(cfg));
					setProviders(unwrap$1(pvs));
					setLoading(false);
				}).catch((err) => {
					setLoading(false);
					console.error("Failed to load web search config:", err);
				});
			}, [websearch]);
			if (loading || !config) return (0, react_jsx_runtime.jsx)("div", {
				className: WebSearchSection_module_css_default.loading,
				children: "Loading..."
			});
			const featureSections = getFeatureSections(providers);
			const handleDefaultProviderChange = async (capability, providerId) => {
				const update = capability === "searchKeywords" ? { defaultSearchKeywordsProvider: providerId } : { defaultFetchUrlsProvider: providerId };
				const updated = unwrap$1(await websearch.updateConfig(update));
				setConfig(updated);
			};
			const handleApiKeyChange = async (providerId, apiKeys) => {
				const updated = unwrap$1(await websearch.updateProviderOverride({
					providerId,
					override: { apiKeys }
				}));
				setProviders((prevProviders) => prevProviders.map((p) => p.id === providerId ? updated : p));
			};
			const handleApiHostChange = async (providerId, capability, apiHost) => {
				const updated = unwrap$1(await websearch.updateProviderOverride({
					providerId,
					override: { capabilities: { [capability]: { apiHost } } }
				}));
				setProviders((prevProviders) => prevProviders.map((p) => p.id === providerId ? updated : p));
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: WebSearchSection_module_css_default.root,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: WebSearchSection_module_css_default.pageHeader,
						children: [(0, react_jsx_runtime.jsx)("h2", {
							className: WebSearchSection_module_css_default.pageTitle,
							children: "Web Search"
						}), (0, react_jsx_runtime.jsx)("p", {
							className: WebSearchSection_module_css_default.pageDescription,
							children: "Configure web search providers and capabilities"
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: WebSearchSection_module_css_default.card,
						children: [
							(0, react_jsx_runtime.jsx)("div", {
								className: WebSearchSection_module_css_default.cardTitle,
								children: "General Settings"
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: WebSearchSection_module_css_default.fieldRow,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: WebSearchSection_module_css_default.fieldLabel,
									children: "Max Results"
								}), (0, react_jsx_runtime.jsx)("input", {
									type: "number",
									min: "1",
									max: "50",
									value: config.maxResults,
									onChange: async (e) => {
										const maxResults = parseInt(e.target.value, 10);
										const updated = unwrap$1(await websearch.updateConfig({ maxResults }));
										setConfig(updated);
									},
									className: WebSearchSection_module_css_default.input
								})]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: WebSearchSection_module_css_default.fieldRow,
								children: [(0, react_jsx_runtime.jsxs)("div", {
									className: WebSearchSection_module_css_default.fieldLabel,
									children: ["Client Tools Preferred", (0, react_jsx_runtime.jsx)("div", {
										className: WebSearchSection_module_css_default.fieldHint,
										children: "Use client-side tools when available"
									})]
								}), (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: config.clientToolsPreferred,
									onChange: async (e) => {
										const updated = unwrap$1(await websearch.updateConfig({ clientToolsPreferred: e.target.checked }));
										setConfig(updated);
									},
									className: WebSearchSection_module_css_default.checkbox
								})]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: WebSearchSection_module_css_default.fieldRow,
								children: [(0, react_jsx_runtime.jsxs)("div", {
									className: WebSearchSection_module_css_default.fieldLabel,
									children: ["Exclude Domains", (0, react_jsx_runtime.jsx)("div", {
										className: WebSearchSection_module_css_default.fieldHint,
										children: "Comma-separated domains to exclude from results"
									})]
								}), (0, react_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "example.com, spam.com",
									value: config.excludeDomains.join(", "),
									onChange: async (e) => {
										const domains = e.target.value.split(",").map((d) => d.trim()).filter(Boolean);
										const updated = unwrap$1(await websearch.updateConfig({ excludeDomains: domains }));
										setConfig(updated);
									},
									className: WebSearchSection_module_css_default.input
								})]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: WebSearchSection_module_css_default.fieldRow,
								children: [(0, react_jsx_runtime.jsxs)("div", {
									className: WebSearchSection_module_css_default.fieldLabel,
									children: ["Compression Method", (0, react_jsx_runtime.jsx)("div", {
										className: WebSearchSection_module_css_default.fieldHint,
										children: "How search results are compressed before passing to the model"
									})]
								}), (0, react_jsx_runtime.jsxs)("select", {
									value: config.compression.method,
									onChange: async (e) => {
										const updated = unwrap$1(await websearch.updateConfig({ compression: {
											...config.compression,
											method: e.target.value
										} }));
										setConfig(updated);
									},
									className: WebSearchSection_module_css_default.select,
									children: [(0, react_jsx_runtime.jsx)("option", {
										value: "none",
										children: "None"
									}), (0, react_jsx_runtime.jsx)("option", {
										value: "cutoff",
										children: "Cutoff"
									})]
								})]
							}),
							config.compression.method === "cutoff" && (0, react_jsx_runtime.jsxs)("div", {
								className: WebSearchSection_module_css_default.fieldRow,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: WebSearchSection_module_css_default.fieldLabel,
									children: "Cutoff Limit (characters)"
								}), (0, react_jsx_runtime.jsx)("input", {
									type: "number",
									min: "500",
									max: "10000",
									step: "100",
									value: config.compression.cutoffLimit,
									onChange: async (e) => {
										const updated = unwrap$1(await websearch.updateConfig({ compression: {
											method: "cutoff",
											cutoffLimit: parseInt(e.target.value, 10)
										} }));
										setConfig(updated);
									},
									className: WebSearchSection_module_css_default.input
								})]
							})
						]
					}),
					featureSections.map((section) => {
						const defaultProviderId = section.capability === "searchKeywords" ? config.defaultSearchKeywordsProvider : config.defaultFetchUrlsProvider;
						const selectedProvider = providers.find((p) => p.id === defaultProviderId) ?? section.entries[0]?.provider;
						return (0, react_jsx_runtime.jsxs)("div", {
							className: WebSearchSection_module_css_default.card,
							children: [
								(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("div", {
									className: WebSearchSection_module_css_default.cardTitle,
									children: CAPABILITY_TITLES[section.capability]
								}), (0, react_jsx_runtime.jsx)("div", {
									className: WebSearchSection_module_css_default.cardDescription,
									children: CAPABILITY_DESCRIPTIONS[section.capability]
								})] }),
								(0, react_jsx_runtime.jsxs)("div", {
									className: WebSearchSection_module_css_default.fieldRow,
									children: [(0, react_jsx_runtime.jsx)("div", {
										className: WebSearchSection_module_css_default.fieldLabel,
										children: "Default Provider"
									}), (0, react_jsx_runtime.jsx)("select", {
										value: selectedProvider?.id ?? "",
										onChange: (e) => handleDefaultProviderChange(section.capability, e.target.value),
										className: WebSearchSection_module_css_default.select,
										children: section.entries.map(({ provider }) => (0, react_jsx_runtime.jsx)("option", {
											value: provider.id,
											children: provider.name
										}, provider.id))
									})]
								}),
								selectedProvider && (0, react_jsx_runtime.jsxs)("div", {
									className: WebSearchSection_module_css_default.providerDetail,
									children: [
										(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("div", {
											className: WebSearchSection_module_css_default.providerName,
											children: selectedProvider.name
										}), (0, react_jsx_runtime.jsx)("div", {
											className: WebSearchSection_module_css_default.providerDescription,
											children: selectedProvider.description
										})] }),
										selectedProvider.requiresApiKey && (0, react_jsx_runtime.jsxs)("div", {
											className: WebSearchSection_module_css_default.fieldRow,
											children: [(0, react_jsx_runtime.jsx)("div", {
												className: WebSearchSection_module_css_default.fieldLabel,
												children: "API Keys"
											}), (0, react_jsx_runtime.jsxs)("div", {
												style: {
													display: "flex",
													flexDirection: "column",
													gap: 8,
													alignItems: "flex-end"
												},
												children: [(selectedProvider.apiKeys.length > 0 ? selectedProvider.apiKeys : [""]).map((key, index) => (0, react_jsx_runtime.jsxs)("div", {
													className: WebSearchSection_module_css_default.apiKeyRow,
													children: [(0, react_jsx_runtime.jsx)("input", {
														type: "password",
														value: key,
														onChange: async (e) => {
															const newKeys = [...selectedProvider.apiKeys];
															newKeys[index] = e.target.value;
															await handleApiKeyChange(selectedProvider.id, newKeys.filter(Boolean));
														},
														placeholder: "Enter API key",
														className: WebSearchSection_module_css_default.input
													}), selectedProvider.apiKeys.length > 1 && (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: WebSearchSection_module_css_default.iconButton,
														onClick: async () => {
															const newKeys = selectedProvider.apiKeys.filter((_, i) => i !== index);
															await handleApiKeyChange(selectedProvider.id, newKeys);
														},
														children: "Remove"
													})]
												}, index)), (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: WebSearchSection_module_css_default.iconButton,
													onClick: async () => {
														await handleApiKeyChange(selectedProvider.id, [...selectedProvider.apiKeys, ""]);
													},
													children: "Add API Key"
												})]
											})]
										}),
										selectedProvider.capabilities.some((c) => c.feature === section.capability && "apiHost" in c) && (0, react_jsx_runtime.jsxs)("div", {
											className: WebSearchSection_module_css_default.fieldRow,
											children: [(0, react_jsx_runtime.jsx)("div", {
												className: WebSearchSection_module_css_default.fieldLabel,
												children: "API Host"
											}), (0, react_jsx_runtime.jsx)("input", {
												type: "url",
												value: selectedProvider.capabilities.find((c) => c.feature === section.capability && "apiHost" in c)?.["apiHost"] ?? "",
												onChange: async (e) => {
													await handleApiHostChange(selectedProvider.id, section.capability, e.target.value);
												},
												placeholder: "https://example.com/api",
												className: WebSearchSection_module_css_default.input
											})]
										}),
										selectedProvider.capabilities.some((c) => c.feature === section.capability && c.auth?.type === "basic") && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
											className: WebSearchSection_module_css_default.fieldRow,
											children: [(0, react_jsx_runtime.jsx)("div", {
												className: WebSearchSection_module_css_default.fieldLabel,
												children: "Basic Auth Username"
											}), (0, react_jsx_runtime.jsx)("input", {
												type: "text",
												value: selectedProvider.basicAuthUsername ?? "",
												onChange: async (e) => {
													unwrap$1(await websearch.updateProviderOverride({
														providerId: selectedProvider.id,
														override: { basicAuthUsername: e.target.value }
													}));
												},
												className: WebSearchSection_module_css_default.input
											})]
										}), (0, react_jsx_runtime.jsxs)("div", {
											className: WebSearchSection_module_css_default.fieldRow,
											children: [(0, react_jsx_runtime.jsx)("div", {
												className: WebSearchSection_module_css_default.fieldLabel,
												children: "Basic Auth Password"
											}), (0, react_jsx_runtime.jsx)("input", {
												type: "password",
												value: selectedProvider.basicAuthPassword ?? "",
												onChange: async (e) => {
													unwrap$1(await websearch.updateProviderOverride({
														providerId: selectedProvider.id,
														override: { basicAuthPassword: e.target.value }
													}));
												},
												className: WebSearchSection_module_css_default.input
											})]
										})] })
									]
								})
							]
						}, section.capability);
					})
				]
			});
		}
		//#endregion
		//#region lib/types/repo-remote-client.js
		/** Client descriptor contribution for the Control Center repository service. */
		const reposRemote = {
			package: "@dsh-control-center/control-center",
			descriptors: [
				{
					method: "list",
					parameters: []
				},
				{
					method: "add",
					parameters: ["path"]
				},
				{
					method: "removeRepo",
					implementation: "remove",
					parameters: ["repoId"]
				},
				{
					method: "tree",
					parameters: ["path", "dir"]
				},
				{
					method: "readFile",
					parameters: ["path"]
				},
				{
					method: "getBranch",
					parameters: ["path"]
				}
			].map(({ method, implementation, parameters }) => ({
				id: `@dsh-control-center/control-center#controlCenterRepos/${method}`,
				service: "controlCenterRepos",
				namespace: "controlCenterRepos",
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
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\RepoWorkspace.module.css.mjs
		const css$13 = ".iqKKIW_root{background:var(--background);min-width:0;min-height:0;color:var(--foreground);flex-direction:column;flex:1;gap:16px;padding:24px;display:flex;overflow:auto}.iqKKIW_header{justify-content:space-between;align-items:center;gap:16px;display:flex}.iqKKIW_eyebrow{color:var(--foreground-tertiary);letter-spacing:.08em;text-transform:uppercase;margin:0;font-size:12px}.iqKKIW_title{color:var(--foreground);margin:2px 0 0;font-size:24px;font-weight:600}.iqKKIW_branch{background:var(--muted);height:24px;color:var(--muted-foreground);font-size:12px;font-family:var(--ds-font-family-code), monospace;border-radius:9999px;align-items:center;gap:6px;padding:0 10px;display:inline-flex}.iqKKIW_split{flex:1;gap:16px;min-height:0;display:flex}.iqKKIW_sidebar{box-sizing:border-box;border:1px solid var(--border-subtle);background:var(--card);border-radius:12px;flex-direction:column;flex:none;gap:10px;width:260px;min-width:220px;padding:14px;display:flex;overflow:hidden}.iqKKIW_sidebarTitle{color:var(--foreground);font-size:13px;font-weight:600}.iqKKIW_addRow{gap:6px;display:flex}.iqKKIW_addInput{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);min-width:0;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;flex:1;padding:0 10px;font-family:inherit;font-size:13px}.iqKKIW_addInput:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.iqKKIW_addInput::placeholder{color:var(--foreground-tertiary)}.iqKKIW_repoList{flex-direction:column;flex:1;gap:2px;min-height:0;display:flex;overflow-y:auto}.iqKKIW_repoItem{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;color:var(--foreground);background:0 0;border:none;border-radius:8px;align-items:center;gap:8px;padding:8px 10px;font-family:inherit;display:flex}.iqKKIW_repoItem:hover,.iqKKIW_repoItemSelected{background:var(--muted)}.iqKKIW_repoItemMain{flex:1;min-width:0}.iqKKIW_repoItemName{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:14px;font-weight:500;overflow:hidden}.iqKKIW_repoItemPath{color:var(--foreground-tertiary);white-space:nowrap;text-overflow:ellipsis;font-size:11px;font-family:var(--ds-font-family-code), monospace;overflow:hidden}.iqKKIW_main{flex-direction:column;flex:1;gap:12px;min-width:0;display:flex}.iqKKIW_treePane{border:1px solid var(--border-subtle);background:var(--card);border-radius:12px;flex-direction:column;flex:1;min-height:0;display:flex;overflow:hidden}.iqKKIW_treeHeader{border-bottom:.5px solid var(--border);flex:none;justify-content:space-between;align-items:center;gap:8px;padding:10px 14px;display:flex}.iqKKIW_treeTitle{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:13px;font-weight:600;overflow:hidden}.iqKKIW_treeScroll{flex:1;min-height:0;padding:6px;overflow-y:auto}.iqKKIW_treeRow{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;color:var(--foreground);white-space:nowrap;background:0 0;border:none;border-radius:6px;align-items:center;gap:6px;padding:3px 8px;font-family:inherit;font-size:13px;display:flex}.iqKKIW_treeRow:hover,.iqKKIW_treeRowSelected{background:var(--muted)}.iqKKIW_treeIcon{color:var(--muted-foreground);flex:none}.iqKKIW_treeName{text-overflow:ellipsis;flex:1;min-width:0;overflow:hidden}.iqKKIW_treeMeta{color:var(--foreground-tertiary);font-size:11px;font-family:var(--ds-font-family-code), monospace;flex:none}.iqKKIW_previewPane{border:1px solid var(--border-subtle);background:var(--card);border-radius:12px;flex-direction:column;flex:none;min-height:140px;max-height:46%;display:flex;overflow:hidden}.iqKKIW_previewHeader{border-bottom:.5px solid var(--border);color:var(--muted-foreground);font-size:12px;font-family:var(--ds-font-family-code), monospace;flex:none;align-items:center;gap:8px;padding:8px 14px;display:flex}.iqKKIW_previewBody{min-height:0;font-family:var(--ds-font-family-code), monospace;color:var(--foreground);white-space:pre;flex:1;margin:0;padding:12px 14px;font-size:12px;line-height:1.6;overflow:auto}.iqKKIW_truncateNote{border-top:.5px solid var(--border);color:var(--warning);flex:none;padding:6px 14px;font-size:12px}.iqKKIW_previewHint{color:var(--foreground-tertiary);flex:1;justify-content:center;align-items:center;padding:24px;font-size:13px;display:flex}.iqKKIW_empty{color:var(--muted-foreground);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:6px;padding:40px 16px;display:flex}.iqKKIW_emptyTitle{color:var(--foreground);font-size:14px;font-weight:600}.iqKKIW_emptyDescription{color:var(--muted-foreground);font-size:12px}";
		const tagId$13 = "@dsh-control-center/bundle/RepoWorkspace.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$13) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$13;
			tag.textContent = css$13;
			document.head.appendChild(tag);
		}
		var RepoWorkspace_module_css_default = {
			"addInput": "iqKKIW_addInput",
			"repoList": "iqKKIW_repoList",
			"eyebrow": "iqKKIW_eyebrow",
			"emptyDescription": "iqKKIW_emptyDescription",
			"treeRow": "iqKKIW_treeRow",
			"sidebar": "iqKKIW_sidebar",
			"addRow": "iqKKIW_addRow",
			"header": "iqKKIW_header",
			"treeMeta": "iqKKIW_treeMeta",
			"sidebarTitle": "iqKKIW_sidebarTitle",
			"previewHeader": "iqKKIW_previewHeader",
			"repoItemPath": "iqKKIW_repoItemPath",
			"empty": "iqKKIW_empty",
			"previewHint": "iqKKIW_previewHint",
			"branch": "iqKKIW_branch",
			"treeRowSelected": "iqKKIW_treeRowSelected",
			"emptyTitle": "iqKKIW_emptyTitle",
			"main": "iqKKIW_main",
			"previewBody": "iqKKIW_previewBody",
			"split": "iqKKIW_split",
			"truncateNote": "iqKKIW_truncateNote",
			"treeScroll": "iqKKIW_treeScroll",
			"previewPane": "iqKKIW_previewPane",
			"repoItemMain": "iqKKIW_repoItemMain",
			"repoItem": "iqKKIW_repoItem",
			"repoItemName": "iqKKIW_repoItemName",
			"treeTitle": "iqKKIW_treeTitle",
			"treeHeader": "iqKKIW_treeHeader",
			"root": "iqKKIW_root",
			"treeIcon": "iqKKIW_treeIcon",
			"repoItemSelected": "iqKKIW_repoItemSelected",
			"title": "iqKKIW_title",
			"treeName": "iqKKIW_treeName",
			"treePane": "iqKKIW_treePane"
		};
		//#endregion
		//#region lib/types/client/RepoWorkspace.js
		/**
		* Code Repository workspace: browse any local repository registered in the
		* catalog — file tree with lazy directory expansion and text-file preview.
		*/
		function RepoWorkspace({ getRepos, useReposReady }) {
			const repos = useReposReady((value) => value) ? getRepos() : void 0;
			const [catalog, setCatalog] = (0, react.useState)([]);
			const [selectedId, setSelectedId] = (0, react.useState)("");
			const [addPath, setAddPath] = (0, react.useState)("");
			const [adding, setAdding] = (0, react.useState)(false);
			const [branch, setBranch] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [tree, setTree] = (0, react.useState)({
				expanded: /* @__PURE__ */ new Set(),
				children: /* @__PURE__ */ new Map(),
				loadingDir: null,
				openFile: null
			});
			const selected = (0, react.useMemo)(() => catalog.find((repo) => repo.id === selectedId) ?? null, [catalog, selectedId]);
			const refreshCatalog = () => {
				if (repos === void 0) return;
				repos.list().then((result) => {
					if (!result.ok) {
						setError(result.error.message);
						return;
					}
					setCatalog(result.value);
					if (result.value.length === 0) setSelectedId("");
					else if (!result.value.some((repo) => repo.id === selectedId)) setSelectedId(result.value[0].id);
				}).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
			};
			(0, react.useEffect)(() => {
				refreshCatalog();
			}, [repos !== void 0]);
			const selectedPath = selected?.path;
			(0, react.useEffect)(() => {
				if (repos === void 0 || selectedPath === void 0) return;
				repos.getBranch(selectedPath).then((result) => {
					if (result.ok) setBranch(result.value);
				}).catch(() => setBranch(null));
				loadDir(selectedPath, selectedPath);
			}, [selectedPath, repos !== void 0]);
			const loadDir = (repoPath, dir) => {
				if (repos === void 0) return;
				setTree((prev) => ({
					...prev,
					loadingDir: dir
				}));
				repos.tree(repoPath, dir).then((result) => {
					if (!result.ok) {
						setError(result.error.message);
						return;
					}
					setTree((prev) => ({
						...prev,
						loadingDir: null,
						children: new Map(prev.children).set(dir, result.value),
						expanded: new Set(prev.expanded).add(dir)
					}));
				}).catch((reason) => {
					setError(reason instanceof Error ? reason.message : String(reason));
					setTree((prev) => ({
						...prev,
						loadingDir: null
					}));
				});
			};
			const toggleDir = (repoPath, dir) => {
				if (tree.expanded.has(dir)) {
					setTree((prev) => {
						const next = new Set(prev.expanded);
						next.delete(dir);
						return {
							...prev,
							expanded: next
						};
					});
					return;
				}
				if (tree.children.has(dir)) {
					setTree((prev) => ({
						...prev,
						expanded: new Set(prev.expanded).add(dir)
					}));
					return;
				}
				loadDir(repoPath, dir);
			};
			const openFile = (path) => {
				if (repos === void 0) return;
				setTree((prev) => ({
					...prev,
					openFile: {
						path,
						view: {
							content: "",
							truncated: false,
							bytes: 0
						}
					}
				}));
				repos.readFile(path).then((result) => {
					if (!result.ok) {
						setError(result.error.message);
						return;
					}
					setTree((prev) => prev.openFile?.path === path ? {
						...prev,
						openFile: {
							path,
							view: result.value
						}
					} : prev);
				}).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
			};
			const handleAdd = async () => {
				const path = addPath.trim();
				if (path === "" || repos === void 0) return;
				setAdding(true);
				setError(null);
				try {
					const result = await repos.add(path);
					if (!result.ok) throw new Error(result.error.message);
					setAddPath("");
					setSelectedId(result.value.id);
					refreshCatalog();
				} catch (err) {
					setError(err instanceof Error ? err.message : String(err));
				} finally {
					setAdding(false);
				}
			};
			const handleRemove = async (repoId) => {
				if (repos === void 0) return;
				const repo = catalog.find((item) => item.id === repoId);
				if (repo === void 0) return;
				if (!window.confirm(`从仓库列表移除 "${repo.name}" 吗？（不会删除磁盘上的文件）`)) return;
				const result = await repos.removeRepo(repoId);
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				setTree({
					expanded: /* @__PURE__ */ new Set(),
					children: /* @__PURE__ */ new Map(),
					loadingDir: null,
					openFile: null
				});
				refreshCatalog();
			};
			const renderDir = (repoPath, dir, depth) => {
				return (tree.children.get(dir) ?? []).map((entry) => {
					const full = `${dir === repoPath ? repoPath : dir}${dir.endsWith("/") || dir.endsWith("\\") ? "" : "/"}${entry.name}`;
					if (entry.kind === "dir") {
						const expanded = tree.expanded.has(full);
						return (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: RepoWorkspace_module_css_default.treeRow,
							style: { paddingLeft: 8 + depth * 14 },
							onClick: () => toggleDir(repoPath, full),
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: RepoWorkspace_module_css_default.treeIcon,
								children: expanded ? (0, react_jsx_runtime.jsx)("svg", {
									width: "14",
									height: "14",
									viewBox: "0 0 16 16",
									fill: "none",
									children: (0, react_jsx_runtime.jsx)("path", {
										d: "M4 6l4 4 4-4",
										stroke: "currentColor",
										strokeWidth: "1.5",
										strokeLinecap: "round",
										strokeLinejoin: "round"
									})
								}) : (0, react_jsx_runtime.jsx)("svg", {
									width: "14",
									height: "14",
									viewBox: "0 0 16 16",
									fill: "none",
									children: (0, react_jsx_runtime.jsx)("path", {
										d: "M6 4l4 4-4 4",
										stroke: "currentColor",
										strokeWidth: "1.5",
										strokeLinecap: "round",
										strokeLinejoin: "round"
									})
								})
							}), (0, react_jsx_runtime.jsx)("span", {
								className: RepoWorkspace_module_css_default.treeName,
								children: entry.name
							})]
						}), expanded ? renderDir(repoPath, full, depth + 1) : null] }, full);
					}
					const open = tree.openFile?.path === full;
					return (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `${RepoWorkspace_module_css_default.treeRow} ${open ? RepoWorkspace_module_css_default.treeRowSelected : ""}`,
						style: { paddingLeft: 8 + depth * 14 },
						onClick: () => openFile(full),
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: RepoWorkspace_module_css_default.treeIcon,
								children: (0, react_jsx_runtime.jsx)("svg", {
									width: "14",
									height: "14",
									viewBox: "0 0 16 16",
									fill: "none",
									children: (0, react_jsx_runtime.jsx)("path", {
										d: "M4 2h5l3 3v9H4V2z",
										stroke: "currentColor",
										strokeWidth: "1.2",
										strokeLinejoin: "round"
									})
								})
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: RepoWorkspace_module_css_default.treeName,
								children: entry.name
							}),
							entry.size !== void 0 && entry.size > 0 ? (0, react_jsx_runtime.jsx)("span", {
								className: RepoWorkspace_module_css_default.treeMeta,
								children: formatSize(entry.size)
							}) : null
						]
					}, full);
				});
			};
			return (0, react_jsx_runtime.jsxs)("main", {
				className: `${RepoWorkspace_module_css_default.root} cc-surface`,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: RepoWorkspace_module_css_default.header,
						children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("p", {
							className: RepoWorkspace_module_css_default.eyebrow,
							children: "Workspace"
						}), (0, react_jsx_runtime.jsx)("h1", {
							className: RepoWorkspace_module_css_default.title,
							children: "代码仓库"
						})] }), selected !== null && branch !== null ? (0, react_jsx_runtime.jsx)("span", {
							className: RepoWorkspace_module_css_default.branch,
							children: branch
						}) : null]
					}),
					error !== null ? (0, react_jsx_runtime.jsx)("div", {
						className: "cc-notice-error",
						children: error
					}) : null,
					(0, react_jsx_runtime.jsxs)("div", {
						className: RepoWorkspace_module_css_default.split,
						children: [(0, react_jsx_runtime.jsxs)("aside", {
							className: RepoWorkspace_module_css_default.sidebar,
							children: [
								(0, react_jsx_runtime.jsx)("div", {
									className: RepoWorkspace_module_css_default.sidebarTitle,
									children: "仓库列表"
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: RepoWorkspace_module_css_default.addRow,
									children: [(0, react_jsx_runtime.jsx)("input", {
										type: "text",
										className: RepoWorkspace_module_css_default.addInput,
										placeholder: "本地仓库路径…",
										value: addPath,
										onChange: (e) => setAddPath(e.target.value),
										onKeyDown: (e) => {
											if (e.key === "Enter") handleAdd();
										}
									}), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "cc-btn cc-btn-primary",
										disabled: adding,
										onClick: () => void handleAdd(),
										children: "添加"
									})]
								}),
								(0, react_jsx_runtime.jsx)("div", {
									className: RepoWorkspace_module_css_default.repoList,
									children: catalog.length === 0 ? (0, react_jsx_runtime.jsxs)("div", {
										className: RepoWorkspace_module_css_default.empty,
										children: [(0, react_jsx_runtime.jsx)("div", {
											className: RepoWorkspace_module_css_default.emptyTitle,
											children: "暂无仓库"
										}), (0, react_jsx_runtime.jsx)("div", {
											className: RepoWorkspace_module_css_default.emptyDescription,
											children: "输入本地仓库路径后点击「添加」"
										})]
									}) : catalog.map((repo) => (0, react_jsx_runtime.jsxs)("div", {
										className: `${RepoWorkspace_module_css_default.repoItem} ${repo.id === selectedId ? RepoWorkspace_module_css_default.repoItemSelected : ""}`,
										role: "button",
										tabIndex: 0,
										onClick: () => setSelectedId(repo.id),
										onKeyDown: (e) => {
											if (e.key === "Enter") setSelectedId(repo.id);
										},
										children: [(0, react_jsx_runtime.jsxs)("div", {
											className: RepoWorkspace_module_css_default.repoItemMain,
											children: [(0, react_jsx_runtime.jsx)("div", {
												className: RepoWorkspace_module_css_default.repoItemName,
												children: repo.name
											}), (0, react_jsx_runtime.jsx)("div", {
												className: RepoWorkspace_module_css_default.repoItemPath,
												children: repo.path
											})]
										}), (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "cc-icon-btn",
											title: "移除",
											onClick: (e) => {
												e.stopPropagation();
												handleRemove(repo.id);
											},
											children: (0, react_jsx_runtime.jsx)("svg", {
												width: "14",
												height: "14",
												viewBox: "0 0 16 16",
												fill: "none",
												children: (0, react_jsx_runtime.jsx)("path", {
													d: "M3 5H13L12 14H4L3 5ZM6 2H10V3H6V2Z",
													stroke: "currentColor",
													strokeWidth: "1.2",
													strokeLinejoin: "round"
												})
											})
										})]
									}, repo.id))
								})
							]
						}), (0, react_jsx_runtime.jsx)("div", {
							className: RepoWorkspace_module_css_default.main,
							children: selected === null ? (0, react_jsx_runtime.jsx)("div", {
								className: RepoWorkspace_module_css_default.treePane,
								children: (0, react_jsx_runtime.jsxs)("div", {
									className: RepoWorkspace_module_css_default.empty,
									children: [(0, react_jsx_runtime.jsx)("div", {
										className: RepoWorkspace_module_css_default.emptyTitle,
										children: "选择一个仓库"
									}), (0, react_jsx_runtime.jsx)("div", {
										className: RepoWorkspace_module_css_default.emptyDescription,
										children: "在左侧选择或添加一个本地代码仓库以浏览文件"
									})]
								})
							}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
								className: RepoWorkspace_module_css_default.treePane,
								children: [(0, react_jsx_runtime.jsxs)("div", {
									className: RepoWorkspace_module_css_default.treeHeader,
									children: [(0, react_jsx_runtime.jsx)("span", {
										className: RepoWorkspace_module_css_default.treeTitle,
										children: selected.name
									}), (0, react_jsx_runtime.jsx)("span", {
										className: RepoWorkspace_module_css_default.treeMeta,
										children: selected.path
									})]
								}), (0, react_jsx_runtime.jsx)("div", {
									className: RepoWorkspace_module_css_default.treeScroll,
									children: tree.loadingDir === selected.path && !tree.children.has(selected.path) ? (0, react_jsx_runtime.jsx)("div", {
										className: RepoWorkspace_module_css_default.empty,
										children: (0, react_jsx_runtime.jsx)("div", {
											className: RepoWorkspace_module_css_default.emptyDescription,
											children: "加载中…"
										})
									}) : renderDir(selected.path, selected.path, 0)
								})]
							}), tree.openFile !== null && (0, react_jsx_runtime.jsxs)("div", {
								className: RepoWorkspace_module_css_default.previewPane,
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										className: RepoWorkspace_module_css_default.previewHeader,
										children: [(0, react_jsx_runtime.jsx)("span", { children: tree.openFile.path }), (0, react_jsx_runtime.jsx)("span", { children: formatSize(tree.openFile.view.bytes) })]
									}),
									(0, react_jsx_runtime.jsx)("pre", {
										className: RepoWorkspace_module_css_default.previewBody,
										children: tree.openFile.view.content || "加载中…"
									}),
									tree.openFile.view.truncated && (0, react_jsx_runtime.jsx)("div", {
										className: RepoWorkspace_module_css_default.truncateNote,
										children: "文件过大，仅显示前 256 KB"
									})
								]
							})] })
						})]
					})
				]
			});
		}
		function formatSize(bytes) {
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${(bytes / 1048576).toFixed(1)} MB`;
		}
		//#endregion
		//#region lib/types/file-processing-remote-client.js
		/** Client descriptor contribution for the Control Center file-processing service. */
		const fileProcessingRemote = {
			package: "@dsh-control-center/control-center",
			descriptors: [
				{
					method: "listProcessors",
					parameters: []
				},
				{
					method: "getConfig",
					parameters: []
				},
				{
					method: "setDefault",
					parameters: ["feature", "processor"]
				},
				{
					method: "setOverride",
					parameters: ["processor", "override"]
				},
				{
					method: "convert",
					parameters: ["request"]
				}
			].map(({ method, parameters }) => ({
				id: `@dsh-control-center/control-center#controlCenterFileProcessing/${method}`,
				service: "controlCenterFileProcessing",
				namespace: "controlCenterFileProcessing",
				method,
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
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\ProcessorSection.module.css.mjs
		const css$12 = ".CL8zIa_root{flex-direction:column;gap:16px;width:100%;max-width:768px;margin:0 auto;display:flex}.CL8zIa_pageTitle{color:var(--foreground);font-size:15px;font-weight:600}.CL8zIa_pageDescription{color:var(--muted-foreground);margin-top:4px;font-size:14px}.CL8zIa_card{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;flex-direction:column;gap:12px;padding:16px;display:flex}.CL8zIa_cardTitle{color:var(--foreground);font-size:15px;font-weight:600}.CL8zIa_cardDescription{color:var(--muted-foreground);margin-top:2px;font-size:12px}.CL8zIa_fieldRow{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 16px;min-height:24px;display:flex}.CL8zIa_fieldLabel{color:var(--foreground);font-size:14px}.CL8zIa_fieldHint{color:var(--muted-foreground);margin-top:2px;font-size:12px}.CL8zIa_input{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);height:32px;color:var(--foreground);box-shadow:none;box-sizing:border-box;border-radius:8px;outline:none;padding:0 10px;font-family:inherit;font-size:14px;line-height:32px}.CL8zIa_input:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent);outline:none}.CL8zIa_select{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 28px 0 10px;font-family:inherit;font-size:14px}.CL8zIa_select:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.CL8zIa_providerDetail{border-top:1px solid var(--border-subtle);flex-direction:column;gap:12px;margin-top:4px;padding-top:16px;display:flex}.CL8zIa_providerName{color:var(--foreground);font-size:14px;font-weight:600}.CL8zIa_providerDescription{color:var(--muted-foreground);font-size:12px}.CL8zIa_apiKeyRow{align-items:center;gap:8px;display:flex}.CL8zIa_apiKeyRow .CL8zIa_input{min-width:0;font-family:var(--ds-font-family-code), monospace;flex:1;font-size:13px}.CL8zIa_iconButton{border:1px solid var(--border-subtle);height:28px;color:var(--muted-foreground);cursor:pointer;white-space:nowrap;background:0 0;border-radius:8px;justify-content:center;align-items:center;padding:0 10px;font-family:inherit;font-size:13px;display:inline-flex}.CL8zIa_iconButton:hover{background:var(--muted);color:var(--foreground)}.CL8zIa_loading{min-height:200px;color:var(--muted-foreground);justify-content:center;align-items:center;font-size:14px;display:flex}";
		const tagId$12 = "@dsh-control-center/bundle/ProcessorSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$12) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$12;
			tag.textContent = css$12;
			document.head.appendChild(tag);
		}
		var ProcessorSection_module_css_default = {
			"providerDetail": "CL8zIa_providerDetail",
			"card": "CL8zIa_card",
			"cardTitle": "CL8zIa_cardTitle",
			"fieldLabel": "CL8zIa_fieldLabel",
			"pageTitle": "CL8zIa_pageTitle",
			"select": "CL8zIa_select",
			"providerName": "CL8zIa_providerName",
			"providerDescription": "CL8zIa_providerDescription",
			"iconButton": "CL8zIa_iconButton",
			"pageDescription": "CL8zIa_pageDescription",
			"input": "CL8zIa_input",
			"cardDescription": "CL8zIa_cardDescription",
			"root": "CL8zIa_root",
			"loading": "CL8zIa_loading",
			"fieldHint": "CL8zIa_fieldHint",
			"fieldRow": "CL8zIa_fieldRow",
			"apiKeyRow": "CL8zIa_apiKeyRow"
		};
		//#endregion
		//#region lib/types/client/ProcessorSection.js
		/**
		* File Processing / OCR settings section.
		*
		* One page per feature (document_to_markdown / image_to_text) over the
		* controlCenterFileProcessing Remote service, composed like Cherry's
		* ProcessorPanel: default-processor select + per-processor config cards.
		*/
		function unwrap(result) {
			if (!result.ok) throw new Error(result.error.message);
			return result.value;
		}
		function ProcessorSection({ feature, title, description, service }) {
			const [processors, setProcessors] = (0, react.useState)([]);
			const [config, setConfig] = (0, react.useState)(null);
			const [loading, setLoading] = (0, react.useState)(true);
			const [error, setError] = (0, react.useState)(null);
			const load = (0, react.useCallback)(async () => {
				try {
					const [p, c] = await Promise.all([service.listProcessors(), service.getConfig()]);
					setProcessors(unwrap(p));
					setConfig(unwrap(c));
					setLoading(false);
				} catch (err) {
					setError(err instanceof Error ? err.message : String(err));
					setLoading(false);
				}
			}, [service]);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			if (loading) return (0, react_jsx_runtime.jsx)("div", {
				className: ProcessorSection_module_css_default.loading,
				children: "Loading..."
			});
			if (error !== null || config === null) return (0, react_jsx_runtime.jsx)("div", {
				className: ProcessorSection_module_css_default.root,
				children: (0, react_jsx_runtime.jsx)("div", {
					className: "cc-notice-error",
					children: error ?? "Failed to load"
				})
			});
			const entries = processors.filter((p) => p.features.includes(feature));
			const defaultId = feature === "image_to_text" ? config.defaultImageProcessor : config.defaultDocumentProcessor;
			const selectedId = entries.some((p) => p.id === defaultId) ? defaultId : entries[0]?.id ?? "";
			const setDefault = async (processor) => {
				try {
					unwrap(await service.setDefault(feature, processor));
					setConfig((prev) => prev === null ? prev : {
						...prev,
						...feature === "image_to_text" ? { defaultImageProcessor: processor } : { defaultDocumentProcessor: processor }
					});
				} catch (err) {
					setError(err instanceof Error ? err.message : String(err));
				}
			};
			const setOverride = async (processor, override) => {
				try {
					unwrap(await service.setOverride(processor, override));
					setConfig((prev) => prev === null ? prev : {
						...prev,
						overrides: {
							...prev.overrides,
							[processor]: override
						}
					});
				} catch (err) {
					setError(err instanceof Error ? err.message : String(err));
				}
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ProcessorSection_module_css_default.root,
				children: [
					(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", {
						className: ProcessorSection_module_css_default.pageTitle,
						children: title
					}), (0, react_jsx_runtime.jsx)("p", {
						className: ProcessorSection_module_css_default.pageDescription,
						children: description
					})] }),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ProcessorSection_module_css_default.card,
						children: [(0, react_jsx_runtime.jsx)("div", {
							className: ProcessorSection_module_css_default.cardTitle,
							children: "默认处理器"
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: ProcessorSection_module_css_default.fieldRow,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: ProcessorSection_module_css_default.fieldLabel,
								children: [
									"用于",
									feature === "image_to_text" ? "图片文字识别" : "文档转 Markdown",
									"的处理器"
								]
							}), (0, react_jsx_runtime.jsx)("select", {
								value: selectedId,
								onChange: (e) => void setDefault(e.target.value),
								className: ProcessorSection_module_css_default.select,
								children: entries.map((p) => (0, react_jsx_runtime.jsx)("option", {
									value: p.id,
									children: p.name
								}, p.id))
							})]
						})]
					}),
					entries.map((processor) => {
						const override = config.overrides[processor.id];
						const apiKeys = override?.apiKeys ?? [];
						const languages = override?.languages ?? [];
						return (0, react_jsx_runtime.jsxs)("div", {
							className: ProcessorSection_module_css_default.card,
							children: [
								(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("div", {
									className: ProcessorSection_module_css_default.cardTitle,
									children: processor.name
								}), (0, react_jsx_runtime.jsx)("div", {
									className: ProcessorSection_module_css_default.cardDescription,
									children: processor.description
								})] }),
								processor.requiresApiKey && (0, react_jsx_runtime.jsxs)("div", {
									className: ProcessorSection_module_css_default.fieldRow,
									children: [(0, react_jsx_runtime.jsxs)("div", {
										className: ProcessorSection_module_css_default.fieldLabel,
										children: ["API Key", processor.apiKeyWebsite !== null ? (0, react_jsx_runtime.jsx)("div", {
											className: ProcessorSection_module_css_default.fieldHint,
											children: (0, react_jsx_runtime.jsx)("a", {
												href: processor.apiKeyWebsite,
												target: "_blank",
												rel: "noreferrer",
												style: { color: "var(--link, var(--primary))" },
												children: "获取 API Key"
											})
										}) : null]
									}), (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											flexDirection: "column",
											gap: 8,
											alignItems: "flex-end"
										},
										children: [(apiKeys.length > 0 ? apiKeys : [""]).map((key, index) => (0, react_jsx_runtime.jsxs)("div", {
											className: ProcessorSection_module_css_default.apiKeyRow,
											children: [(0, react_jsx_runtime.jsx)("input", {
												type: "password",
												value: key,
												placeholder: "Enter API key",
												onChange: async (e) => {
													const next = [...apiKeys];
													next[index] = e.target.value;
													await setOverride(processor.id, {
														...override,
														apiKeys: next.filter(Boolean)
													});
												},
												className: ProcessorSection_module_css_default.input
											}), apiKeys.length > 1 && (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: ProcessorSection_module_css_default.iconButton,
												onClick: () => void setOverride(processor.id, {
													...override,
													apiKeys: apiKeys.filter((_, i) => i !== index)
												}),
												children: "Remove"
											})]
										}, index)), (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: ProcessorSection_module_css_default.iconButton,
											onClick: () => void setOverride(processor.id, {
												...override,
												apiKeys: [...apiKeys, ""]
											}),
											children: "Add API Key"
										})]
									})]
								}),
								processor.id === "mistral" && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
									className: ProcessorSection_module_css_default.fieldRow,
									children: [(0, react_jsx_runtime.jsxs)("div", {
										className: ProcessorSection_module_css_default.fieldLabel,
										children: ["API Host", (0, react_jsx_runtime.jsx)("div", {
											className: ProcessorSection_module_css_default.fieldHint,
											children: "OpenAI 兼容的视觉模型端点，例如 https://api.deepseek.com/v1"
										})]
									}), (0, react_jsx_runtime.jsx)("input", {
										type: "text",
										value: override?.apiHost ?? "",
										placeholder: "https://api.mistral.ai/v1",
										onChange: (e) => void setOverride(processor.id, {
											...override,
											apiHost: e.target.value
										}),
										className: ProcessorSection_module_css_default.input
									})]
								}), (0, react_jsx_runtime.jsxs)("div", {
									className: ProcessorSection_module_css_default.fieldRow,
									children: [(0, react_jsx_runtime.jsx)("div", {
										className: ProcessorSection_module_css_default.fieldLabel,
										children: "模型"
									}), (0, react_jsx_runtime.jsx)("input", {
										type: "text",
										value: override?.model ?? "",
										placeholder: "pixtral-12b-2409",
										onChange: (e) => void setOverride(processor.id, {
											...override,
											model: e.target.value
										}),
										className: ProcessorSection_module_css_default.input
									})]
								})] }),
								processor.languageOptions.length > 0 && (0, react_jsx_runtime.jsxs)("div", {
									className: ProcessorSection_module_css_default.fieldRow,
									children: [(0, react_jsx_runtime.jsx)("div", {
										className: ProcessorSection_module_css_default.fieldLabel,
										children: "识别语言"
									}), (0, react_jsx_runtime.jsx)("select", {
										value: languages[0] ?? processor.languageOptions[0] ?? "auto",
										onChange: (e) => void setOverride(processor.id, {
											...override,
											languages: [e.target.value]
										}),
										className: ProcessorSection_module_css_default.select,
										children: processor.languageOptions.map((lang) => (0, react_jsx_runtime.jsx)("option", {
											value: lang,
											children: lang
										}, lang))
									})]
								})
							]
						}, processor.id);
					})
				]
			});
		}
		//#endregion
		//#region ../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\SettingsRoot.module.css.mjs
		const css$11 = "._4STY0G_trigger{box-sizing:border-box;cursor:pointer;width:calc(100% + 4px);height:42px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:12px;flex:none;align-items:center;gap:8px;margin:4px -2px;padding:0 10px 0 8px;font-family:inherit;font-size:14px;line-height:22px;display:flex;overflow:hidden}._4STY0G_trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}._4STY0G_trigger._4STY0G_rail{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;margin:8px 0 10px;padding:0}._4STY0G_triggerLabel{white-space:nowrap;overflow:hidden}._4STY0G_overlay{z-index:1000;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}._4STY0G_mask{background:var(--dsw-alias-bg-mask-1);position:absolute;inset:0}._4STY0G_panel{z-index:1;background:var(--background);width:min(1180px,100vw - 48px);height:min(760px,100vh - 48px);box-shadow:var(--dsw-shadow-lv3);font-family:var(--cs-font-family-body), -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", sans-serif;color:var(--foreground);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:14px;display:flex;position:relative;overflow:hidden}._4STY0G_nav{box-sizing:border-box;border-right:.5px solid var(--border);background:var(--background);flex-direction:column;flex:none;width:250px;min-width:250px;display:flex}._4STY0G_navTitle{color:var(--foreground);padding:14px 20px 10px;font-size:16px;font-weight:500;line-height:24px}._4STY0G_navScroll{box-sizing:border-box;flex-direction:column;flex:1;gap:2px;min-height:0;padding:0 10px 10px;display:flex;overflow-y:auto}._4STY0G_navGroup{flex-direction:column;gap:2px;display:flex}._4STY0G_navGroupTitle{color:var(--foreground-tertiary);padding:8px 10px 2px;font-size:12px;font-weight:400;line-height:16px}._4STY0G_navList{flex-direction:column;gap:2px;display:flex}._4STY0G_navCell{box-sizing:border-box;cursor:pointer;height:32px;color:var(--foreground);text-align:left;background:0 0;border:none;border-radius:10px;align-items:center;gap:8px;padding:0 10px;font-family:inherit;font-size:14px;font-weight:400;line-height:20px;display:flex}._4STY0G_navCell:hover{background:var(--muted)}._4STY0G_navCell._4STY0G_active{background:var(--muted);font-weight:500}._4STY0G_navIcon{color:var(--foreground);flex:none}._4STY0G_navLabel{white-space:nowrap;text-overflow:ellipsis;flex:1;min-width:0;overflow:hidden}._4STY0G_content{flex-direction:column;flex:1;min-width:0;display:flex}._4STY0G_header{box-sizing:border-box;flex:none;justify-content:flex-end;align-items:center;gap:8px;height:48px;padding:0 14px 0 24px;display:flex}._4STY0G_actions{justify-content:flex-end;align-items:center;gap:8px;min-width:0;margin-left:auto;display:flex}._4STY0G_close{cursor:pointer;width:28px;height:28px;color:var(--muted-foreground);background:0 0;border:none;border-radius:8px;justify-content:center;align-items:center;padding:0;display:inline-flex}._4STY0G_close:hover{background:var(--muted);color:var(--foreground)}._4STY0G_options{flex:1;min-width:0;min-height:0;padding:0 24px 24px;overflow:hidden auto}@media (width<=760px){._4STY0G_overlay{align-items:stretch}._4STY0G_panel{border-radius:0;width:100vw;height:100vh}._4STY0G_nav{width:210px;min-width:210px}}@media (width<=560px){._4STY0G_panel{flex-direction:column}._4STY0G_nav{border-right:none;border-bottom:.5px solid var(--border);width:100%;max-height:42vh}._4STY0G_options{padding-inline:16px}}._4STY0G_hiddenLabel{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}";
		const tagId$11 = "@dsh-control-center/bundle/SettingsRoot.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$11) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$11;
			tag.textContent = css$11;
			document.head.appendChild(tag);
		}
		var SettingsRoot_module_css_default = {
			"navIcon": "_4STY0G_navIcon",
			"navTitle": "_4STY0G_navTitle",
			"close": "_4STY0G_close",
			"navScroll": "_4STY0G_navScroll",
			"trigger": "_4STY0G_trigger",
			"navGroupTitle": "_4STY0G_navGroupTitle",
			"navGroup": "_4STY0G_navGroup",
			"navList": "_4STY0G_navList",
			"content": "_4STY0G_content",
			"actions": "_4STY0G_actions",
			"hiddenLabel": "_4STY0G_hiddenLabel",
			"panel": "_4STY0G_panel",
			"navLabel": "_4STY0G_navLabel",
			"mask": "_4STY0G_mask",
			"header": "_4STY0G_header",
			"nav": "_4STY0G_nav",
			"options": "_4STY0G_options",
			"navCell": "_4STY0G_navCell",
			"rail": "_4STY0G_rail",
			"active": "_4STY0G_active",
			"overlay": "_4STY0G_overlay",
			"triggerLabel": "_4STY0G_triggerLabel"
		};
		//#endregion
		//#region \0dsh-control-center-plain-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\cherry-tokens.css.mjs
		const css$10 = ".cc-surface{--cs-neutral-50:oklch(98% 0 0);--cs-neutral-100:oklch(97% 0 0);--cs-neutral-200:oklch(92% 0 0);--cs-neutral-300:oklch(87% 0 0);--cs-neutral-400:oklch(72% 0 0);--cs-neutral-500:oklch(55% 0 0);--cs-neutral-600:oklch(44% .027 257);--cs-neutral-700:oklch(37% 0 0);--cs-neutral-800:oklch(27% 0 0);--cs-neutral-900:oklch(20% 0 0);--cs-neutral-950:oklch(15% 0 0);--cs-brand-50:oklch(98% .015 152);--cs-brand-100:oklch(96% .034 151);--cs-brand-200:oklch(91% .073 151);--cs-brand-300:oklch(85% .13 149);--cs-brand-400:oklch(81% .173 148);--cs-brand-500:oklch(77% .208 146);--cs-brand-600:oklch(67% .192 146);--cs-brand-700:oklch(56% .156 146);--cs-brand-800:oklch(43% .117 146);--cs-brand-900:oklch(32% .086 146);--cs-red-50:oklch(97% .014 17);--cs-red-100:oklch(93% .031 18);--cs-red-200:oklch(88% .062 18);--cs-red-300:oklch(81% .103 20);--cs-red-400:oklch(71% .166 22);--cs-red-500:oklch(64% .208 25);--cs-red-600:oklch(58% .214 27);--cs-red-700:oklch(51% .192 28);--cs-red-800:oklch(44% .16 27);--cs-red-900:oklch(40% .135 26);--cs-red-950:oklch(25% .087 26);--cs-amber-50:oklch(99% .022 95);--cs-amber-100:oklch(96% .057 96);--cs-amber-200:oklch(93% .114 96);--cs-amber-300:oklch(88% .153 92);--cs-amber-400:oklch(83% .164 84);--cs-amber-500:oklch(77% .165 71);--cs-amber-600:oklch(67% .159 58);--cs-amber-700:oklch(55% .145 49);--cs-amber-800:oklch(47% .124 47);--cs-amber-900:oklch(41% .104 46);--cs-amber-950:oklch(28% .074 46);--cs-green-50:oklch(98% .016 156);--cs-green-100:oklch(96% .041 157);--cs-green-200:oklch(92% .081 156);--cs-green-300:oklch(87% .137 155);--cs-green-400:oklch(80% .182 152);--cs-green-500:oklch(72% .192 149);--cs-green-600:oklch(62% .169 149);--cs-green-700:oklch(52% .137 150);--cs-green-800:oklch(42% .108 151);--cs-green-900:oklch(35% .084 152);--cs-green-950:oklch(24% .059 152);--cs-blue-50:oklch(97% .017 261);--cs-blue-100:oklch(94% .033 261);--cs-blue-200:oklch(88% .067 261);--cs-blue-300:oklch(80% .113 261);--cs-blue-400:oklch(71% .152 261);--cs-blue-500:oklch(62% .17 260);--cs-blue-600:oklch(54% .157 259);--cs-blue-700:oklch(46% .13 258);--cs-blue-800:oklch(38% .104 256);--cs-blue-900:oklch(33% .086 255);--cs-blue-950:oklch(22% .056 254);--cs-white:oklch(100% 0 0);--cs-black:oklch(0% 0 0);--cs-font-family-heading:Inter;--cs-font-family-body:Inter;--cs-font-weight-regular:400;--cs-font-weight-medium:500;--cs-font-weight-bold:700;--cs-font-size-body-xs:.75rem;--cs-font-size-body-sm:.875rem;--cs-font-size-body-md:1rem;--cs-font-size-body-lg:1.125rem;--cs-font-size-heading-xs:1.25rem;--cs-font-size-heading-sm:1.5rem;--cs-line-height-body-xs:1.25rem;--cs-line-height-body-sm:1.5rem;--cs-line-height-body-md:1.5rem;--cs-line-height-body-lg:1.75rem;--cs-line-height-heading-xs:2rem;--cs-line-height-heading-sm:2.5rem;--cs-radius-xs:.125rem;--cs-radius-sm:.375rem;--cs-radius-md:.5rem;--cs-radius-lg:.625rem;--cs-radius-xl:.875rem;--cs-radius-2xl:1.125rem;--cs-radius-3xl:1.375rem;--cs-radius-round:9999px;--cs-primary:var(--cs-brand-500);--cs-destructive:var(--cs-red-500);--cs-destructive-hover:var(--cs-red-400);--cs-success:var(--cs-green-500);--cs-warning:var(--cs-amber-500);--cs-info:var(--cs-blue-500);--cs-background:var(--cs-white);--cs-background-subtle:oklch(0% 0 0/.02);--cs-foreground:oklch(21.3% 0 0);--cs-muted-foreground:oklch(55.6% 0 0);--cs-foreground-tertiary:oklch(66.9% 0 0);--cs-foreground-disabled:var(--cs-foreground-tertiary);--cs-card:var(--cs-white);--cs-popover:var(--cs-white);--cs-border:oklch(0% 0 0/.1);--cs-border-subtle:oklch(0% 0 0/.04);--cs-border-strong:oklch(0% 0 0/.2);--cs-border-selected:oklch(0% 0 0/.3);--cs-ring:color-mix(in srgb, var(--cs-primary) 40%, transparent);--cs-secondary:oklch(0% 0 0/.05);--cs-secondary-hover:oklch(0% 0 0/.1);--cs-secondary-active:oklch(0% 0 0/.15);--cs-muted:oklch(0% 0 0/.05);--cs-accent:oklch(0% 0 0/.05);--cs-ghost-active:oklch(0% 0 0/.1);--cs-sidebar:oklch(96.72% 0 0);--cs-sidebar-accent:oklch(97% 0 0);--cs-card-foreground:oklch(14.5% 0 0);--cs-popover-foreground:oklch(14.5% 0 0);--cs-secondary-foreground:oklch(20.5% 0 0);--cs-accent-foreground:oklch(20.5% 0 0);--cs-primary-foreground:oklch(98.5% 0 0);--cs-destructive-foreground:var(--cs-white);--cs-input:oklch(92.2% 0 0);--cs-sidebar-foreground:oklch(14.5% 0 0);--cs-sidebar-primary:oklch(20.5% 0 0);--cs-sidebar-primary-foreground:oklch(98.5% 0 0);--cs-sidebar-accent-foreground:oklch(20.5% 0 0);--cs-sidebar-border:oklch(92.2% 0 0);--cs-sidebar-ring:oklch(70.8% 0 0);--cs-error:var(--cs-red-500);--cs-error-subtle:var(--cs-red-50);--cs-error-subtle-foreground:var(--cs-red-700);--cs-error-border:var(--cs-red-200);--cs-success-subtle:var(--cs-green-50);--cs-success-subtle-foreground:var(--cs-green-800);--cs-success-border:var(--cs-green-200);--cs-warning-subtle:var(--cs-amber-50);--cs-warning-subtle-foreground:var(--cs-amber-800);--cs-warning-border:var(--cs-amber-200);--cs-info-subtle:var(--cs-blue-50);--cs-info-subtle-foreground:var(--cs-blue-800);--cs-info-border:var(--cs-blue-200);--background:var(--cs-background);--foreground:var(--cs-foreground);--card:var(--cs-card);--card-foreground:var(--cs-card-foreground);--popover:var(--cs-popover);--popover-foreground:var(--cs-popover-foreground);--primary:var(--cs-primary);--primary-foreground:var(--cs-primary-foreground);--secondary:var(--cs-secondary);--secondary-foreground:var(--cs-secondary-foreground);--muted:var(--cs-muted);--muted-foreground:var(--cs-muted-foreground);--accent:var(--cs-accent);--accent-foreground:var(--cs-accent-foreground);--destructive:var(--cs-destructive);--destructive-foreground:var(--cs-destructive-foreground);--border:var(--cs-border);--border-subtle:var(--cs-border-subtle);--border-strong:var(--cs-border-strong);--border-selected:var(--cs-border-selected);--input:var(--cs-input);--ring:var(--cs-ring);--background-subtle:var(--cs-background-subtle);--foreground-tertiary:var(--cs-foreground-tertiary);--foreground-disabled:var(--cs-foreground-disabled);--ghost-active:var(--cs-ghost-active);--secondary-hover:var(--cs-secondary-hover);--secondary-active:var(--cs-secondary-active);--sidebar:var(--cs-sidebar);--sidebar-foreground:var(--cs-sidebar-foreground);--sidebar-primary:var(--cs-sidebar-primary);--sidebar-primary-foreground:var(--cs-sidebar-primary-foreground);--sidebar-accent:var(--cs-sidebar-accent);--sidebar-accent-foreground:var(--cs-sidebar-accent-foreground);--sidebar-border:var(--cs-sidebar-border);--sidebar-ring:var(--cs-sidebar-ring);--error:var(--cs-error);--error-subtle:var(--cs-error-subtle);--error-subtle-foreground:var(--cs-error-subtle-foreground);--error-border:var(--cs-error-border);--success:var(--cs-success);--success-subtle:var(--cs-success-subtle);--success-subtle-foreground:var(--cs-success-subtle-foreground);--success-border:var(--cs-success-border);--warning:var(--cs-warning);--warning-subtle:var(--cs-warning-subtle);--warning-subtle-foreground:var(--cs-warning-subtle-foreground);--warning-border:var(--cs-warning-border);--info:var(--cs-info);--info-subtle:var(--cs-info-subtle);--info-subtle-foreground:var(--cs-info-subtle-foreground);--info-border:var(--cs-info-border)}.cc-settings-column{box-sizing:border-box;flex-direction:column;gap:16px;width:100%;max-width:768px;margin:0 auto;display:flex}.cc-page-title{color:var(--foreground);font-size:15px;font-weight:600}.cc-page-description{color:var(--muted-foreground);margin-top:4px;font-size:14px}.cc-card{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;flex-direction:column;gap:12px;padding:16px;display:flex}.cc-card-title{color:var(--foreground);font-size:15px;font-weight:600}.cc-card-description{color:var(--muted-foreground);margin-top:2px;font-size:12px}.cc-field-row{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 16px;min-height:24px;display:flex}.cc-field-label{color:var(--foreground);font-size:14px}.cc-field-hint{color:var(--muted-foreground);margin-top:2px;font-size:12px}.cc-input{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);height:32px;color:var(--foreground);box-shadow:none;box-sizing:border-box;border-radius:8px;outline:none;padding:0 10px;font-family:inherit;font-size:14px;line-height:32px}.cc-input:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent);outline:none}.cc-input::placeholder{color:var(--foreground-tertiary)}.cc-select{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 28px 0 10px;font-family:inherit;font-size:14px}.cc-select:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.cc-textarea{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);color:var(--foreground);font-family:var(--ds-font-family-code), monospace;box-shadow:none;box-sizing:border-box;resize:vertical;border-radius:8px;outline:none;padding:8px 10px;font-size:13px;line-height:20px}.cc-textarea:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent);outline:none}.cc-checkbox{width:16px;height:16px;accent-color:var(--primary);cursor:pointer}.cc-btn{cursor:pointer;white-space:nowrap;box-sizing:border-box;border:1px solid #0000;border-radius:8px;justify-content:center;align-items:center;gap:6px;height:32px;padding:0 14px;font-family:inherit;font-size:14px;font-weight:400;line-height:20px;display:inline-flex}.cc-btn:disabled{opacity:.5;cursor:not-allowed}.cc-btn-primary{background:var(--primary);color:var(--primary-foreground)}.cc-btn-primary:hover:not(:disabled){background:var(--cs-brand-600)}.cc-btn-secondary{background:var(--secondary);color:var(--secondary-foreground)}.cc-btn-secondary:hover:not(:disabled){background:var(--secondary-hover)}.cc-btn-ghost{color:var(--foreground);background:0 0}.cc-btn-ghost:hover:not(:disabled){background:var(--muted)}.cc-btn-danger{color:var(--destructive);border-color:var(--border-subtle);background:0 0}.cc-btn-danger:hover:not(:disabled){background:var(--error-subtle)}.cc-icon-btn{width:32px;height:32px;color:var(--muted-foreground);cursor:pointer;background:0 0;border:none;border-radius:8px;justify-content:center;align-items:center;padding:0;display:inline-flex}.cc-icon-btn:hover{background:var(--muted);color:var(--foreground)}.cc-empty{color:var(--muted-foreground);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:6px;padding:48px 16px;font-size:14px;display:flex}.cc-empty-title{color:var(--foreground);font-size:15px;font-weight:600}.cc-empty-description{color:var(--muted-foreground);font-size:13px}.cc-loading{min-height:200px;color:var(--muted-foreground);justify-content:center;align-items:center;font-size:14px;display:flex}.cc-notice-error{border:1px solid var(--error-border);background:var(--error-subtle);color:var(--error-subtle-foreground);border-radius:8px;padding:8px 12px;font-size:13px}.cc-badge-enabled{background:var(--success-subtle);height:20px;color:var(--success-subtle-foreground);border-radius:9999px;align-items:center;padding:0 8px;font-size:12px;display:inline-flex}.cc-badge-disabled{background:var(--muted);height:20px;color:var(--muted-foreground);border-radius:9999px;align-items:center;padding:0 8px;font-size:12px;display:inline-flex}body[data-ds-dark-theme] .cc-surface{--cs-success:var(--cs-green-400);--cs-warning:var(--cs-amber-400);--cs-info:var(--cs-blue-400);--cs-background:oklch(20.9% 0 0/.55);--cs-background-subtle:oklch(100% 0 0/.02);--cs-foreground:oklch(93.1% 0 0);--cs-muted-foreground:oklch(70.8% 0 0);--cs-foreground-tertiary:oklch(55.9% 0 0);--cs-card:var(--cs-neutral-900);--cs-popover:var(--cs-neutral-800);--cs-border:oklch(100% 0 0/.1);--cs-border-subtle:oklch(100% 0 0/.05);--cs-border-strong:oklch(100% 0 0/.2);--cs-border-selected:oklch(100% 0 0/.3);--cs-ring:oklch(76% .204 131/.4);--cs-secondary:oklch(100% 0 0/.1);--cs-secondary-hover:oklch(100% 0 0/.2);--cs-secondary-active:oklch(100% 0 0/.25);--cs-muted:oklch(100% 0 0/.1);--cs-accent:oklch(100% 0 0/.1);--cs-ghost-active:oklch(100% 0 0/.15);--cs-sidebar:oklch(23.93% 0 0);--cs-sidebar-accent:oklch(26.9% 0 0);--cs-card-foreground:oklch(98.5% 0 0);--cs-popover-foreground:oklch(98.5% 0 0);--cs-secondary-foreground:oklch(98.5% 0 0);--cs-accent-foreground:oklch(98.5% 0 0);--cs-primary-foreground:oklch(20.5% 0 0);--cs-destructive-foreground:var(--cs-white);--cs-input:oklch(26.9% 0 0);--cs-sidebar-foreground:oklch(98.5% 0 0);--cs-sidebar-primary:oklch(48.8% .243 264.376);--cs-sidebar-primary-foreground:oklch(98.5% 0 0);--cs-sidebar-accent-foreground:oklch(98.5% 0 0);--cs-sidebar-border:oklch(26.9% 0 0);--cs-sidebar-ring:oklch(43.9% 0 0);--cs-success-subtle-foreground:var(--cs-green-100);--cs-success-border:var(--cs-green-700);--cs-warning-subtle-foreground:var(--cs-amber-100);--cs-warning-border:var(--cs-amber-700);--cs-info-subtle-foreground:var(--cs-blue-100);--cs-info-border:var(--cs-blue-700)}";
		const tagId$10 = "@dsh-control-center/bundle/cherry-tokens.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$10) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$10;
			tag.textContent = css$10;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region lib/types/client/SettingsRoot.js
		/** Cherry-style settings shell over DSH's additive settings slots. */
		/** Nav groups in Cherry's settings order: core, capabilities, personal,
		* then the DSH-owned sections as a native group. */
		const GROUPS = [
			"core",
			"capabilities",
			"personal",
			"native",
			"other"
		];
		function navIcon(id) {
			if (id === "models") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, {
				className: SettingsRoot_module_css_default.navIcon,
				size: 16
			});
			if (id === "skills") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCodeOutline16, {
				className: SettingsRoot_module_css_default.navIcon,
				size: 16
			});
			if (id === "providers") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconApiOutline14, {
				className: SettingsRoot_module_css_default.navIcon,
				size: 14
			});
			if (id === "mcp") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {
				className: SettingsRoot_module_css_default.navIcon,
				size: 16
			});
			if (id === "websearch") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, {
				className: SettingsRoot_module_css_default.navIcon,
				size: 16
			});
			if (id === "agent-presets") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconAgentPresetOutline16, {
				className: SettingsRoot_module_css_default.navIcon,
				size: 16
			});
			if (id === "plugins") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPersonalizationOutline16, {
				className: SettingsRoot_module_css_default.navIcon,
				size: 16
			});
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSettingsOutline16, {
				className: SettingsRoot_module_css_default.navIcon,
				size: 16
			});
		}
		function SettingsPanel({ rows, renderSlot, activeId, onSelect, onClose, groupLabels }) {
			const active = rows.find((row) => row.id === activeId)?.id ?? rows[0]?.id;
			const titleId = (0, react.useId)();
			const closeButton = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.key === "Escape") onClose();
				};
				document.addEventListener("keydown", onKeyDown);
				closeButton.current?.focus();
				return () => {
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [onClose]);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: SettingsRoot_module_css_default.overlay,
				role: "presentation",
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: SettingsRoot_module_css_default.mask,
					"aria-hidden": "true",
					onClick: onClose
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: clsx(SettingsRoot_module_css_default.panel, "cc-surface"),
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": titleId,
					children: [(0, react_jsx_runtime.jsxs)("nav", {
						className: SettingsRoot_module_css_default.nav,
						children: [(0, react_jsx_runtime.jsx)("div", {
							className: SettingsRoot_module_css_default.navTitle,
							id: titleId,
							children: renderSlot("settings.header", {})
						}), (0, react_jsx_runtime.jsx)("div", {
							className: SettingsRoot_module_css_default.navScroll,
							children: GROUPS.map((group) => {
								const entries = rows.filter((row) => row.group === group);
								if (entries.length === 0) return null;
								return (0, react_jsx_runtime.jsxs)("section", {
									className: SettingsRoot_module_css_default.navGroup,
									"aria-label": groupLabels[group],
									children: [(0, react_jsx_runtime.jsx)("div", {
										className: SettingsRoot_module_css_default.navGroupTitle,
										children: groupLabels[group]
									}), (0, react_jsx_runtime.jsx)("div", {
										className: SettingsRoot_module_css_default.navList,
										children: entries.map((row) => (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: clsx(SettingsRoot_module_css_default.navCell, row.id === active && SettingsRoot_module_css_default.active),
											"aria-current": row.id === active ? "page" : void 0,
											onClick: () => {
												onSelect(row.id);
											},
											children: [navIcon(row.id), (0, react_jsx_runtime.jsx)("span", {
												className: SettingsRoot_module_css_default.navLabel,
												children: row.label
											})]
										}, row.id))
									})]
								}, group);
							})
						})]
					}), (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsRoot_module_css_default.content,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: SettingsRoot_module_css_default.header,
							children: [(0, react_jsx_runtime.jsx)("div", {
								className: SettingsRoot_module_css_default.actions,
								children: renderSlot("settings.action", {})
							}), (0, react_jsx_runtime.jsxs)("button", {
								ref: closeButton,
								type: "button",
								className: SettingsRoot_module_css_default.close,
								onClick: onClose,
								children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, { size: 14 }), (0, react_jsx_runtime.jsx)("span", {
									className: SettingsRoot_module_css_default.hiddenLabel,
									children: renderSlot("settings.close", {})
								})]
							})]
						}), (0, react_jsx_runtime.jsx)("div", {
							className: SettingsRoot_module_css_default.options,
							children: active === void 0 ? null : renderSlot("settings.section", { close: onClose }, { only: active })
						})]
					})]
				})]
			});
		}
		/** Render the settings trigger, Cherry-style panel, and ordered onboarding stage. */
		function SettingsRoot(props) {
			const { wide, useSections, useOnboardingSteps, useSessions, renderSlot, labels } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const [activeId, setActiveId] = (0, react.useState)(void 0);
			const [completedOnboarding, setCompletedOnboarding] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const close = (0, react.useCallback)(() => {
				setOpen(false);
				setActiveId(void 0);
			}, []);
			const openSection = (0, react.useCallback)((id) => {
				setActiveId(id);
				setOpen(true);
			}, []);
			const rows = useSections((state) => state);
			const onboardingSteps = useOnboardingSteps((state) => state);
			const onboardingActive = useSessions((state) => state.phase === "ready" && (state.current === void 0 || state.byId[state.current]?.blank === true));
			const onboardingStep = onboardingActive ? onboardingSteps.find((step) => !completedOnboarding.has(step.id)) : void 0;
			(0, react.useEffect)(() => {
				if (!onboardingActive) setCompletedOnboarding(/* @__PURE__ */ new Set());
			}, [onboardingActive]);
			const completeOnboardingStep = (0, react.useCallback)((id) => {
				setCompletedOnboarding((previous) => previous.has(id) ? previous : /* @__PURE__ */ new Set([...previous, id]));
			}, []);
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: clsx(SettingsRoot_module_css_default.trigger, !wide && SettingsRoot_module_css_default.rail),
					"aria-haspopup": "dialog",
					"aria-expanded": open,
					onClick: () => {
						setOpen(true);
					},
					children: renderSlot("settings.trigger", { wide })
				}),
				open ? (0, react_jsx_runtime.jsx)(SettingsPanel, {
					rows,
					renderSlot,
					activeId,
					onSelect: setActiveId,
					onClose: close,
					groupLabels: labels
				}) : null,
				onboardingStep === void 0 ? null : renderSlot("settings.onboarding", {
					stepId: onboardingStep.id,
					complete: () => {
						completeOnboardingStep(onboardingStep.id);
					},
					openSection
				}, { only: onboardingStep.id })
			] });
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\chrome.module.css.mjs
		const css$9 = ".uIwUgq_triggerLabel{white-space:nowrap;overflow:hidden}";
		const tagId$9 = "@dsh-control-center/bundle/chrome.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$9;
			tag.textContent = css$9;
			document.head.appendChild(tag);
		}
		var chrome_module_css_default = { "triggerLabel": "uIwUgq_triggerLabel" };
		//#endregion
		//#region lib/types/client/chrome.js
		/**
		* Shell chrome content registered into the shell's trigger/header seats: the
		* trigger row icon + label (figma sidebar foot) and the panel title text.
		* The shell renders the surrounding chrome (button, nav heading row) and
		* reads each entry's `label` option for aria text.
		*/
		/**
		* Render the trigger row content (icon; label only in the wide column).
		* @param props - composed slot props.
		* @returns the trigger content fragment.
		*/
		function TriggerContent({ wide, t }) {
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [wide ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSettingsOutline16, { size: 16 }) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSettingsOutline14, { size: 18 }), wide && (0, react_jsx_runtime.jsx)("span", {
				className: chrome_module_css_default.triggerLabel,
				children: t("trigger")
			})] });
		}
		/**
		* Render the panel title text.
		* @param props - composed slot props.
		* @returns the title text node.
		*/
		function HeaderContent({ t }) {
			return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: t("title") });
		}
		/**
		* Render the close button's visually-hidden label text.
		* @param props - composed slot props.
		* @returns the label text node.
		*/
		function CloseLabel({ t }) {
			return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: t("close") });
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\GeneralSection.module.css.mjs
		const css$8 = ".DFoDHW_section{flex-direction:column;width:100%;display:flex}.DFoDHW_section>[data-slot=\"settings.general.item\"]>:last-child{border-bottom:none}";
		const tagId$8 = "@dsh-control-center/bundle/GeneralSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$8) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$8;
			tag.textContent = css$8;
			document.head.appendChild(tag);
		}
		var GeneralSection_module_css_default = { "section": "DFoDHW_section" };
		//#endregion
		//#region lib/types/client/GeneralSection.js
		/**
		* Render the General section content column.
		* @param props - composed slot props (contract/slots.ts).
		* @returns the section element tree.
		*/
		function GeneralSection({ renderSlot }) {
			return (0, react_jsx_runtime.jsx)("div", {
				className: GeneralSection_module_css_default.section,
				children: renderSlot("settings.general.item", {})
			});
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\SettingsDocumentAction.module.css.mjs
		const css$7 = ".SgSrUG_action{align-items:center;gap:8px;min-width:0;display:flex}.SgSrUG_error{max-width:180px;color:var(--error);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}";
		const tagId$7 = "@dsh-control-center/bundle/SettingsDocumentAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$7;
			tag.textContent = css$7;
			document.head.appendChild(tag);
		}
		var SettingsDocumentAction_module_css_default = {
			"action": "SgSrUG_action",
			"error": "SgSrUG_error"
		};
		//#endregion
		//#region lib/types/client/SettingsDocumentAction.js
		/** Optional settings-header action for opening a file-backed Host document. */
		/**
		* Render the open-document action only after Host metadata confirms document availability.
		* @param props - header owner props, localized copy, and injected document state.
		* @returns the action, or null while unavailable or unresolved.
		*/
		function SettingsDocumentAction({ controller, useSnapshot, t }) {
			const state = useSnapshot((snapshot) => snapshot);
			(0, react.useEffect)(() => {
				controller.load();
			}, [controller]);
			if (state.status !== "ready") return null;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: SettingsDocumentAction_module_css_default.action,
				children: [state.error === null ? null : (0, react_jsx_runtime.jsx)("span", {
					className: SettingsDocumentAction_module_css_default.error,
					role: "alert",
					children: t("openDocumentError")
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					size: "sm",
					disabled: state.opening,
					onClick: () => {
						controller.open();
					},
					children: t("openDocument")
				})]
			});
		}
		//#endregion
		//#region lib/types/client/settings-document-store.js
		/** State owner for the optional local settings-document action. */
		function messageOf$2(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/** Loads local-document availability and invokes the pathless Host-owned open operation. */
		var SettingsDocumentStore = class {
			api;
			/** uSES-safe state source shared by the registered header action. */
			store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
				status: "idle",
				opening: false,
				error: null
			});
			generation = 0;
			/**
			* @param api - loopback settings wire face that reports and opens the provider document.
			*/
			constructor(api) {
				this.api = api;
			}
			/**
			* Load whether the current provider owns a local document.
			* @returns after the latest metadata response updates the store.
			*/
			async load() {
				const generation = ++this.generation;
				this.store.update((state) => {
					state.status = "loading";
					state.error = null;
				});
				try {
					const { result } = await this.api.settings.describe({});
					if (generation !== this.generation) return;
					if (!result.ok) {
						this.store.update((state) => {
							state.status = "unavailable";
							state.error = result.error.message;
						});
						return;
					}
					this.store.update((state) => {
						state.status = result.value.hasDocument ? "ready" : "unavailable";
						state.error = null;
					});
				} catch (error) {
					if (generation !== this.generation) return;
					this.store.update((state) => {
						state.status = "unavailable";
						state.error = messageOf$2(error);
					});
				}
			}
			/**
			* Open the loaded document once; concurrent gestures collapse behind the in-flight action.
			* @returns after the native-open request settles, or immediately when unavailable/already opening.
			*/
			async open() {
				const current = this.store.getSnapshot();
				if (current.status !== "ready" || current.opening) return;
				this.store.update((state) => {
					state.opening = true;
					state.error = null;
				});
				try {
					const response = await this.api.settings.openDocument({});
					if (!response.result.ok) throw new Error(response.result.error.message);
				} catch (error) {
					this.store.update((state) => {
						state.error = messageOf$2(error);
					});
				} finally {
					this.store.update((state) => {
						state.opening = false;
					});
				}
			}
		};
		/**
		* Refresh document availability after reconnect only when a surface has already requested it.
		* @param controller - optional loopback document state owner.
		*/
		function refreshDocumentIfLoaded(controller) {
			if (controller === void 0 || controller.store.getSnapshot().status === "idle") return;
			controller.load();
		}
		//#endregion
		//#region lib/types/client/shell-locales.js
		/** Copy dictionaries for the Control Center shell. */
		const en$1 = {
			trigger: "Settings",
			title: "Settings",
			close: "Close settings",
			generalNav: "General",
			coreGroup: "Core",
			capabilitiesGroup: "Capabilities",
			personalGroup: "Personal",
			nativeGroup: "DSH native",
			otherGroup: "DSH native / Other",
			openDocument: "Open configuration file",
			openDocumentError: "The configuration file could not be opened.",
			workspaceTranslation: "Translation",
			workspacePainting: "Painting",
			workspaceKnowledge: "Knowledge Base",
			workspaceRepo: "Repositories",
			workspaceBack: "Back to conversation",
			workspaceTranslationDescription: "Streaming translation, language management, and history are being connected to DSH model providers.",
			workspacePaintingDescription: "Image-generation jobs, model controls, the gallery, and file attachments are being connected.",
			workspaceKnowledgeDescription: "Ingestion, chunking, embeddings, retrieval, and agent tools are being connected.",
			workspaceRepoDescription: "Browse any local code repository: file tree, previews, and git branch.",
			providersNav: "API Providers",
			webSearchNav: "Web Search",
			fileProcessingNav: "Document Processing",
			fileProcessingTitle: "Document to Markdown",
			fileProcessingDescription: "Convert documents (PDF, DOCX, images) into clean markdown for the coding agent.",
			ocrNav: "OCR",
			ocrTitle: "Image to Text",
			ocrDescription: "Extract text from images with the configured OCR processor."
		};
		const zh$1 = {
			trigger: "设置",
			title: "设置",
			close: "关闭设置",
			generalNav: "通用",
			coreGroup: "核心",
			capabilitiesGroup: "能力",
			personalGroup: "个人",
			nativeGroup: "DSH 原生",
			otherGroup: "DSH 原生／其他",
			openDocument: "打开配置文件",
			openDocumentError: "暂时无法打开配置文件。",
			workspaceTranslation: "翻译",
			workspacePainting: "绘画",
			workspaceKnowledge: "知识库",
			workspaceRepo: "代码仓库",
			workspaceBack: "返回对话",
			workspaceTranslationDescription: "流式翻译、语言管理与历史能力正在接入 DSH 模型提供方。",
			workspacePaintingDescription: "图像生成任务、模型控件、画廊和文件附件能力正在接入。",
			workspaceKnowledgeDescription: "摄取、切分、Embedding、检索和 Agent 工具能力正在接入。",
			workspaceRepoDescription: "浏览任意本地代码仓库：文件树、预览与 Git 分支。",
			providersNav: "API 提供商",
			webSearchNav: "网络搜索",
			fileProcessingNav: "文档处理",
			fileProcessingTitle: "文档转 Markdown",
			fileProcessingDescription: "将文档（PDF、DOCX、图片）转换为干净的 Markdown，供编码代理使用。",
			ocrNav: "OCR",
			ocrTitle: "图片文字识别",
			ocrDescription: "使用配置的 OCR 处理器从图片中提取文字。"
		};
		//#endregion
		//#region lib/types/client/apiKey.js
		/**
		* Browser-side judgement of a typed API key.
		* @module @deepseek-ai/dsh-client-ui-settings-models/apiKey
		*/
		/**
		* Twin of `normalizeApiKey` in `@deepseek-ai/dsh-llm`: printable ASCII, space
		* excluded. Client packages reference only client packages, so the charset
		* rule is mirrored here rather than imported; keep the two in step, as
		* `validateDeepSeekModels` is kept in step with the host's `catalogModel`.
		*/
		const LEGAL_API_KEY = /^[\x21-\x7E]+$/;
		/**
		* A pasted `NAME=value` environment line. Two narrowings keep real keys clear
		* of it: the name must be upper-case, so `sk-` forms break at the hyphen, and
		* the `=` must be followed by something other than another `=`, so base64
		* padding on an all-upper-case key (`ABCD==`) is not mistaken for an
		* assignment. This heuristic runs only here — a resolver applying it could
		* lock a user out of a gateway whose key legitimately takes this shape, with
		* the environment refusing it too and no way through.
		*/
		const ENV_LINE = /^[A-Z][A-Z0-9_]*=[^=]/;
		/** Whether a value is wrapped in one matching pair of quotes. */
		function isQuoted(value) {
			const first = value[0];
			if (first !== "\"" && first !== "'" && first !== "`") return false;
			return value.length > 1 && value.endsWith(first);
		}
		/**
		* Judge the key input's current value.
		*
		* An empty field is not a failure: every card opens with it empty even when a
		* key is already stored, where it means keep that one. A field holding only
		* whitespace is a failure rather than an empty field, so typed input is never
		* silently discarded.
		* @param draft - the key input's current value, untrimmed.
		* @returns the copy key for a field-level failure, or `undefined` to allow submit.
		*/
		function apiKeyFailure(draft) {
			if (draft.length === 0) return void 0;
			const value = draft.trim();
			if (value.length === 0) return "keyBlank";
			if (ENV_LINE.test(value) || isQuoted(value)) return "keyIllegalCharacters";
			if (!LEGAL_API_KEY.test(value)) return "keyIllegalCharacters";
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\ModelsSection.module.css.mjs
		const css$6 = ".tKsOKa_section{flex-direction:column;gap:16px;width:100%;max-width:768px;margin:0 auto;display:flex}.tKsOKa_title{color:var(--foreground);font-size:15px;font-weight:600}.tKsOKa_intro{color:var(--muted-foreground);margin-top:4px;font-size:14px}.tKsOKa_notice{border:1px solid var(--info-border);background:var(--info-subtle);color:var(--info-subtle-foreground);border-radius:8px;padding:8px 12px;font-size:13px}.tKsOKa_savedNotice{border:1px solid var(--success-border);background:var(--success-subtle);color:var(--success-subtle-foreground);border-radius:8px;padding:8px 12px;font-size:13px}.tKsOKa_error{border:1px solid var(--error-border);background:var(--error-subtle);color:var(--error-subtle-foreground);border-radius:8px;align-items:center;gap:8px;padding:8px 12px;font-size:13px;display:flex}.tKsOKa_rows{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.tKsOKa_rowCard{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;display:flex}.tKsOKa_rowHead{align-items:center;gap:10px;min-width:0;display:flex}.tKsOKa_rowIdentity{align-items:center;gap:8px;min-width:0;display:flex}.tKsOKa_rowName{color:var(--foreground);white-space:nowrap;text-overflow:ellipsis;font-size:14px;font-weight:500;overflow:hidden}.tKsOKa_rowTag{background:var(--muted);height:20px;color:var(--muted-foreground);border-radius:9999px;flex:none;align-items:center;padding:0 8px;font-size:12px;display:inline-flex}.tKsOKa_rowActions{flex:none;align-items:center;gap:8px;display:flex}.tKsOKa_credentialDot{border-radius:50%;flex:none;width:8px;height:8px}.tKsOKa_credentialDotConfigured{background:var(--success)}.tKsOKa_credentialDotMissing{background:var(--warning)}.tKsOKa_setupCard{border:1px solid var(--border-subtle);background:var(--card);border-radius:10px;flex-direction:column;gap:12px;padding:16px;display:flex}.tKsOKa_addCard{border:1px dashed var(--border-strong);background:0 0;border-radius:10px;flex-direction:column;gap:12px;padding:16px;display:flex}.tKsOKa_addBlock{flex-direction:column;gap:12px;display:flex}.tKsOKa_addActions{align-items:center;gap:8px;display:flex}.tKsOKa_field{flex-direction:column;gap:6px;display:flex}.tKsOKa_fieldLabel{color:var(--foreground);font-size:13px;font-weight:500}.tKsOKa_input{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 10px;font-family:inherit;font-size:14px}.tKsOKa_input:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.tKsOKa_selectInput{border:1px solid var(--border-subtle);background:color-mix(in srgb, var(--muted) 30%, transparent);width:100%;height:32px;color:var(--foreground);box-sizing:border-box;border-radius:8px;outline:none;padding:0 28px 0 10px;font-family:inherit;font-size:14px}.tKsOKa_selectInput:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent)}.tKsOKa_addButton{background:var(--primary);height:32px;color:var(--primary-foreground);cursor:pointer;border:1px solid #0000;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.tKsOKa_addButton:hover:not(:disabled){background:var(--cs-brand-600)}.tKsOKa_addButton:disabled{opacity:.5;cursor:not-allowed}.tKsOKa_secondaryButton{border:1px solid var(--border-subtle);background:var(--secondary);height:32px;color:var(--secondary-foreground);cursor:pointer;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.tKsOKa_secondaryButton:hover:not(:disabled){background:var(--secondary-hover)}.tKsOKa_secondaryButton:disabled{opacity:.5;cursor:not-allowed}.tKsOKa_dangerButton{border:1px solid var(--error-border);height:32px;color:var(--destructive);cursor:pointer;background:0 0;border-radius:8px;justify-content:center;align-items:center;padding:0 14px;font-family:inherit;font-size:14px;display:inline-flex}.tKsOKa_dangerButton:hover{background:var(--error-subtle)}.tKsOKa_deleteDialog{background:var(--popover);border-radius:14px;flex-direction:column;gap:12px;padding:16px;display:flex}.tKsOKa_deleteConfirm{justify-content:flex-end;align-items:center;gap:8px;display:flex}";
		const tagId$6 = "@dsh-control-center/bundle/ModelsSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$6;
			tag.textContent = css$6;
			document.head.appendChild(tag);
		}
		var ModelsSection_module_css_default = {
			"rowHead": "tKsOKa_rowHead",
			"rowTag": "tKsOKa_rowTag",
			"setupCard": "tKsOKa_setupCard",
			"rowCard": "tKsOKa_rowCard",
			"savedNotice": "tKsOKa_savedNotice",
			"field": "tKsOKa_field",
			"selectInput": "tKsOKa_selectInput",
			"dangerButton": "tKsOKa_dangerButton",
			"rowIdentity": "tKsOKa_rowIdentity",
			"addBlock": "tKsOKa_addBlock",
			"notice": "tKsOKa_notice",
			"secondaryButton": "tKsOKa_secondaryButton",
			"input": "tKsOKa_input",
			"error": "tKsOKa_error",
			"section": "tKsOKa_section",
			"rowActions": "tKsOKa_rowActions",
			"addActions": "tKsOKa_addActions",
			"addButton": "tKsOKa_addButton",
			"credentialDot": "tKsOKa_credentialDot",
			"fieldLabel": "tKsOKa_fieldLabel",
			"addCard": "tKsOKa_addCard",
			"credentialDotConfigured": "tKsOKa_credentialDotConfigured",
			"deleteDialog": "tKsOKa_deleteDialog",
			"title": "tKsOKa_title",
			"deleteConfirm": "tKsOKa_deleteConfirm",
			"rows": "tKsOKa_rows",
			"credentialDotMissing": "tKsOKa_credentialDotMissing",
			"intro": "tKsOKa_intro",
			"rowName": "tKsOKa_rowName"
		};
		//#endregion
		//#region lib/types/client/EditorFooter.js
		/**
		* Render one provider card's action row.
		* @param props - the labels, commit gating, and handlers the owning card supplies.
		* @returns the cancel/commit row.
		*/
		function EditorFooter(props) {
			const { t } = props;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ModelsSection_module_css_default["editorActions"],
				children: [(0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: ModelsSection_module_css_default["secondaryButton"],
					disabled: props.busy,
					onClick: props.onCancel,
					children: t(props.cancelLabel ?? "cancel")
				}), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: ModelsSection_module_css_default["primaryButton"],
					disabled: props.submitDisabled,
					onClick: props.onSubmit,
					children: props.busy ? t(props.submitBusyLabel) : t(props.submitLabel)
				})]
			});
		}
		//#endregion
		//#region lib/types/client/DeepSeekModelsEditor.js
		/**
		* Curated editor for the direct DeepSeek adapter's advisory model catalog.
		* The settings layer replaces `models` as one array, so the parent supplies
		* the effective inherited rows until the first edit materializes a user
		* override; reset removes that override instead of copying defaults into it.
		*/
		/** Row index encoded in an editing-buffer key. */
		function rowOf(key) {
			return Number(key.slice(0, key.indexOf(":")));
		}
		/** Accepted capacity spellings: a decimal count with an optional K/M suffix. */
		const CAPACITY_PATTERN = /^(\d+(?:\.\d+)?)([km])?$/i;
		/** Decimal suffix scales — `1M` is 1000K, matching how model capacities are quoted. */
		const CAPACITY_SCALE = {
			k: 1e3,
			m: 1e6
		};
		/**
		* Read a typed capacity, so a user can write `256K` or `1M` instead of counting
		* zeroes. The stored value stays a plain token count.
		* @param text - raw field text.
		* @returns the count; `undefined` when blank (inherit), `NaN` when unreadable
		* (rejected by {@link validateDeepSeekModels} before any write).
		*/
		function parseCapacity(text) {
			const trimmed = text.trim();
			if (trimmed.length === 0) return void 0;
			const match = CAPACITY_PATTERN.exec(trimmed);
			if (match === null) return NaN;
			const suffix = match[2]?.toLowerCase();
			const scale = suffix === "k" || suffix === "m" ? CAPACITY_SCALE[suffix] : 1;
			const scaled = Number(match[1]) * scale;
			const rounded = Math.round(scaled);
			return Math.abs(scaled - rounded) < 1e-6 ? rounded : scaled;
		}
		/**
		* Spell a stored count back in the shortest form that survives a round trip
		* through {@link parseCapacity}; a count that is not a whole number of
		* thousands stays written out.
		* @param value - stored capacity.
		* @returns the field text.
		*/
		function formatCapacity(value) {
			if (!Number.isInteger(value) || value <= 0) return String(value);
			if (value % CAPACITY_SCALE.m === 0) return `${String(value / CAPACITY_SCALE.m)}M`;
			if (value % CAPACITY_SCALE.k === 0) return `${String(value / CAPACITY_SCALE.k)}K`;
			return String(value);
		}
		/** Convert a schema-validated catalog value into records without dropping hidden fields. */
		function modelDrafts(value) {
			if (!Array.isArray(value)) return [];
			return value.map((entry) => typeof entry === "object" && entry !== null && !Array.isArray(entry) ? entry : {});
		}
		/**
		* Validate adapter constraints that the serialized schema cannot express.
		* @param value - user-owned `models` value, or undefined while inherited.
		* @returns the first invalid row, or undefined when the adapter will accept it.
		*/
		function validateDeepSeekModels(value) {
			if (value === void 0) return void 0;
			const models = modelDrafts(value);
			const seen = /* @__PURE__ */ new Set();
			for (const [index, model] of models.entries()) {
				const id = model["id"];
				const trimmed = typeof id === "string" ? id.trim() : void 0;
				if (trimmed === void 0 || trimmed.length === 0) return {
					index,
					key: "modelIdRequired"
				};
				if (seen.has(trimmed)) return {
					index,
					key: "modelIdDuplicate"
				};
				seen.add(trimmed);
				const name = model["name"];
				if (name !== void 0 && (typeof name !== "string" || name.length === 0)) return {
					index,
					key: "modelNameInvalid"
				};
				const contextWindow = model["contextWindow"];
				if (contextWindow !== void 0 && (typeof contextWindow !== "number" || !Number.isInteger(contextWindow) || contextWindow <= 0)) return {
					index,
					key: "modelContextInvalid"
				};
				const maxTokens = model["maxTokens"];
				if (maxTokens !== void 0 && (typeof maxTokens !== "number" || !Number.isInteger(maxTokens) || maxTokens <= 0)) return {
					index,
					key: "modelMaxTokensInvalid"
				};
			}
		}
		/**
		* Render the direct DeepSeek adapter's model catalog: id and display name on
		* each row, capacities behind the row's own disclosure.
		* @param props - effective rows plus the array-level override actions.
		* @returns the catalog editor.
		*/
		function DeepSeekModelsEditor(props) {
			const [editing, setEditing] = (0, react.useState)(() => /* @__PURE__ */ new Map());
			const [expanded, setExpanded] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const update = (index, key, value) => {
				const next = props.models.map((model, at) => {
					const copy = { ...model };
					if (at !== index) return copy;
					if (value === void 0) Reflect.deleteProperty(copy, key);
					else copy[key] = value;
					return copy;
				});
				props.onChange(next);
			};
			const remove = (index) => {
				setEditing((current) => {
					const next = /* @__PURE__ */ new Map();
					for (const [key, text] of current) {
						const at = rowOf(key);
						if (at === index) continue;
						next.set(at > index ? key.replace(/^\d+/, String(at - 1)) : key, text);
					}
					return next;
				});
				setExpanded((current) => {
					const next = /* @__PURE__ */ new Set();
					for (const at of current) {
						if (at === index) continue;
						next.add(at > index ? at - 1 : at);
					}
					return next;
				});
				props.onChange(props.models.filter((_model, at) => at !== index).map((model) => ({ ...model })));
			};
			const reset = () => {
				setEditing(/* @__PURE__ */ new Map());
				setExpanded(/* @__PURE__ */ new Set());
				props.onReset();
			};
			const toggle = (index) => {
				setExpanded((current) => {
					const next = new Set(current);
					if (!next.delete(index)) next.add(index);
					return next;
				});
			};
			/** The field's text: its live keystrokes, else the stored count spelled short. */
			const capacityText = (model, index, field) => {
				const typed = editing.get(`${String(index)}:${field}`);
				if (typed !== void 0) return typed;
				const value = model[field];
				return typeof value === "number" ? formatCapacity(value) : "";
			};
			const settleCapacity = (index, field) => {
				const key = `${String(index)}:${field}`;
				const typed = editing.get(key);
				if (typed === void 0) return;
				const parsed = parseCapacity(typed);
				if (parsed !== void 0 && Number.isNaN(parsed)) return;
				setEditing((current) => {
					const next = new Map(current);
					next.delete(key);
					return next;
				});
			};
			/** One capacity field of one row, rendered inside the row's disclosure. */
			const capacityField = (model, index, field, fallback) => (0, react_jsx_runtime.jsxs)("label", {
				className: ModelsSection_module_css_default["modelField"],
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: ModelsSection_module_css_default["modelFieldLabel"],
					children: props.t(field === "contextWindow" ? "contextWindow" : "maxTokens")
				}), (0, react_jsx_runtime.jsx)("input", {
					className: ModelsSection_module_css_default["input"],
					type: "text",
					inputMode: "numeric",
					value: capacityText(model, index, field),
					placeholder: fallback === void 0 ? props.t(field === "contextWindow" ? "contextWindowPlaceholder" : "maxTokensPlaceholder") : formatCapacity(fallback),
					"aria-label": `${props.t(field === "contextWindow" ? "contextWindow" : "maxTokens")} ${String(index + 1)}`,
					disabled: props.disabled,
					onChange: (event) => {
						const text = event.target.value;
						setEditing((current) => new Map(current).set(`${String(index)}:${field}`, text));
						update(index, field, parseCapacity(text));
					},
					onBlur: () => {
						settleCapacity(index, field);
					}
				})]
			});
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ModelsSection_module_css_default["modelCatalog"],
				"aria-label": props.t("models"),
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["modelListHead"],
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: ModelsSection_module_css_default["modelCatalogHeading"],
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: ModelsSection_module_css_default["modelCatalogTitle"],
								children: props.t("models")
							}), (0, react_jsx_runtime.jsx)("span", {
								className: ModelsSection_module_css_default["modelCatalogMeta"],
								children: props.overridden ? props.t("modelsCustomized") : props.t("modelsInherited")
							})]
						}), props.overridden ? (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ModelsSection_module_css_default["linkButton"],
							disabled: props.disabled,
							onClick: reset,
							children: props.t("resetModels")
						}) : null]
					}),
					props.models.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["modelEmpty"],
						children: props.t("modelsEmpty")
					}) : (0, react_jsx_runtime.jsx)("div", {
						className: ModelsSection_module_css_default["modelList"],
						children: props.models.map((model, index) => (0, react_jsx_runtime.jsxs)("div", {
							className: ModelsSection_module_css_default["modelEntry"],
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: ModelsSection_module_css_default["modelRow"],
								children: [
									(0, react_jsx_runtime.jsx)("input", {
										className: ModelsSection_module_css_default["input"],
										type: "text",
										value: typeof model["id"] === "string" ? model["id"] : "",
										placeholder: props.t("modelId"),
										"aria-label": `${props.t("modelId")} ${String(index + 1)}`,
										disabled: props.disabled,
										onChange: (event) => {
											update(index, "id", event.target.value);
										},
										onBlur: (event) => {
											const trimmed = event.target.value.trim();
											if (trimmed !== event.target.value) update(index, "id", trimmed);
										}
									}),
									(0, react_jsx_runtime.jsx)("input", {
										className: ModelsSection_module_css_default["input"],
										type: "text",
										value: typeof model["name"] === "string" ? model["name"] : "",
										placeholder: props.t("modelName"),
										"aria-label": `${props.t("modelName")} ${String(index + 1)}`,
										disabled: props.disabled,
										onChange: (event) => {
											update(index, "name", event.target.value === "" ? void 0 : event.target.value);
										}
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ModelsSection_module_css_default["iconButton"],
										"aria-label": `${props.t("modelAdvanced")} ${String(index + 1)}`,
										"aria-expanded": expanded.has(index),
										title: props.t("modelAdvanced"),
										onClick: () => {
											toggle(index);
										},
										children: expanded.has(index) ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {})
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: `${ModelsSection_module_css_default["iconButton"]} ${ModelsSection_module_css_default["iconButtonDanger"]}`,
										"aria-label": `${props.t("removeModel")} ${String(index + 1)}`,
										title: props.t("removeModel"),
										disabled: props.disabled,
										onClick: () => {
											remove(index);
										},
										children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 })
									})
								]
							}), expanded.has(index) ? (0, react_jsx_runtime.jsxs)("div", {
								className: ModelsSection_module_css_default["modelAdvanced"],
								children: [capacityField(model, index, "contextWindow", props.defaultContextWindow), capacityField(model, index, "maxTokens", props.defaultMaxTokens)]
							}) : null]
						}, index))
					}),
					(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: ModelsSection_module_css_default["addModelButton"],
						disabled: props.disabled,
						onClick: () => {
							props.onChange([...props.models.map((model) => ({ ...model })), { id: "" }]);
						},
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 14 }), props.t("addModel")]
					})
				]
			});
		}
		//#endregion
		//#region ../../node_modules/.pnpm/@deepseek-ai+cosmokit@1.8.2/node_modules/@deepseek-ai/cosmokit/lib/index.js
		/** Return true when a value is `null` or `undefined`. */
		function isNullable(value) {
			return value === null || value === void 0;
		}
		/** Return true for non-array object values. */
		function isPlainObject(data) {
			return data && typeof data === "object" && !Array.isArray(data);
		}
		/** Filter object entries and return a new object. */
		function filterKeys(object, filter) {
			return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
		}
		/** Map object values while preserving the original key set. */
		function mapValues(object, transform) {
			return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
		}
		/** Pick selected keys from an object, optionally including `undefined` values. */
		function pick(source, keys, forced) {
			if (!keys) return { ...source };
			const result = {};
			for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
			return result;
		}
		/** Test values using `instanceof` with a `toStringTag` fallback. */
		function is(type, value) {
			if (arguments.length === 1) return (value) => is(type, value);
			return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
		}
		function isArrayBufferLike(value) {
			return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
		}
		function isArrayBufferSource(value) {
			return isArrayBufferLike(value) || ArrayBuffer.isView(value);
		}
		/** Binary source detection and base64/hex conversion helpers. */
		var Binary;
		(function(Binary) {
			Binary.is = isArrayBufferLike;
			Binary.isSource = isArrayBufferSource;
			function fromSource(source) {
				if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
				else return source;
			}
			Binary.fromSource = fromSource;
			function toBase64(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
				let binary = "";
				const bytes = new Uint8Array(source);
				for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
				return btoa(binary);
			}
			Binary.toBase64 = toBase64;
			function fromBase64(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
				return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
			}
			Binary.fromBase64 = fromBase64;
			function toHex(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
				return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
			}
			Binary.toHex = toHex;
			function fromHex(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
				const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
				const buffer = [];
				for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
				return Uint8Array.from(buffer).buffer;
			}
			Binary.fromHex = fromHex;
		})(Binary || (Binary = {}));
		Binary.fromBase64;
		Binary.toBase64;
		Binary.fromHex;
		Binary.toHex;
		/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
		function clone(source, refs = /* @__PURE__ */ new Map()) {
			if (!source || typeof source !== "object") return source;
			if (is("Date", source)) return new Date(source.valueOf());
			if (is("RegExp", source)) return new RegExp(source.source, source.flags);
			if (isArrayBufferLike(source)) return source.slice(0);
			if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
			const cached = refs.get(source);
			if (cached) return cached;
			if (Array.isArray(source)) {
				const result = [];
				refs.set(source, result);
				source.forEach((value, index) => {
					result[index] = Reflect.apply(clone, null, [value, refs]);
				});
				return result;
			}
			const result = Object.create(Object.getPrototypeOf(source));
			refs.set(source, result);
			for (const key of Reflect.ownKeys(source)) {
				const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
				if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
				Reflect.defineProperty(result, key, descriptor);
			}
			return result;
		}
		/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
		function deepEqual(a, b, strict) {
			if (a === b) return true;
			if (!strict && isNullable(a) && isNullable(b)) return true;
			if (typeof a !== typeof b) return false;
			if (typeof a !== "object") return false;
			if (!a || !b) return false;
			function check(test, then) {
				return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
			}
			return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
				if (a.byteLength !== b.byteLength) return false;
				const viewA = new Uint8Array(a);
				const viewB = new Uint8Array(b);
				for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
				return true;
			}) ?? Object.keys({
				...a,
				...b
			}).every((key) => deepEqual(a[key], b[key], strict));
		}
		/** Time constants plus parsing and formatting helpers. */
		var Time;
		(function(Time) {
			Time.millisecond = 1;
			Time.second = 1e3;
			Time.minute = Time.second * 60;
			Time.hour = Time.minute * 60;
			Time.day = Time.hour * 24;
			Time.week = Time.day * 7;
			let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
			function setTimezoneOffset(offset) {
				timezoneOffset = offset;
			}
			Time.setTimezoneOffset = setTimezoneOffset;
			function getTimezoneOffset() {
				return timezoneOffset;
			}
			Time.getTimezoneOffset = getTimezoneOffset;
			function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
				if (typeof date === "number") date = new Date(date);
				if (offset === void 0) offset = timezoneOffset;
				return Math.floor((date.valueOf() / Time.minute - offset) / 1440);
			}
			Time.getDateNumber = getDateNumber;
			function fromDateNumber(value, offset) {
				const date = new Date(value * Time.day);
				if (offset === void 0) offset = timezoneOffset;
				return new Date(+date + offset * Time.minute);
			}
			Time.fromDateNumber = fromDateNumber;
			const numeric = /\d+(?:\.\d+)?/.source;
			const timeRegExp = new RegExp(`^${[
				"w(?:eek(?:s)?)?",
				"d(?:ay(?:s)?)?",
				"h(?:our(?:s)?)?",
				"m(?:in(?:ute)?(?:s)?)?",
				"s(?:ec(?:ond)?(?:s)?)?"
			].map((unit) => `(${numeric}${unit})?`).join("")}$`);
			function parseTime(source) {
				const capture = timeRegExp.exec(source);
				if (!capture) return 0;
				return (parseFloat(capture[1]) * Time.week || 0) + (parseFloat(capture[2]) * Time.day || 0) + (parseFloat(capture[3]) * Time.hour || 0) + (parseFloat(capture[4]) * Time.minute || 0) + (parseFloat(capture[5]) * Time.second || 0);
			}
			Time.parseTime = parseTime;
			function parseDate(date) {
				const parsed = parseTime(date);
				if (parsed) date = Date.now() + parsed;
				else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
				else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
				return date ? new Date(date) : /* @__PURE__ */ new Date();
			}
			Time.parseDate = parseDate;
			function format(ms) {
				const abs = Math.abs(ms);
				if (abs >= Time.day - Time.hour / 2) return Math.round(ms / Time.day) + "d";
				else if (abs >= Time.hour - Time.minute / 2) return Math.round(ms / Time.hour) + "h";
				else if (abs >= Time.minute - Time.second / 2) return Math.round(ms / Time.minute) + "m";
				else if (abs >= Time.second) return Math.round(ms / Time.second) + "s";
				return ms + "ms";
			}
			Time.format = format;
			function toDigits(source, length = 2) {
				return source.toString().padStart(length, "0");
			}
			Time.toDigits = toDigits;
			function template(template, time = /* @__PURE__ */ new Date()) {
				return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
			}
			Time.template = template;
		})(Time || (Time = {}));
		//#endregion
		//#region ../../node_modules/.pnpm/@deepseek-ai+schemastery@3.18.1/node_modules/@deepseek-ai/schemastery/lib/index.mjs
		const kSchema = Symbol.for("schemastery");
		const kValidationError = Symbol.for("ValidationError");
		globalThis.__schemastery_index__ ??= 0;
		globalThis.__schemastery_refs__ = void 0;
		var ValidationError = class extends TypeError {
			options;
			name = "ValidationError";
			constructor(message, options) {
				let prefix = "$";
				for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
				else if (typeof segment === "number") prefix += "[" + segment + "]";
				else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
				if (prefix.startsWith(".")) prefix = prefix.slice(1);
				super((prefix === "$" ? "" : `${prefix} `) + message);
				this.options = options;
			}
			static is(error) {
				return !!error?.[kValidationError];
			}
		};
		Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
		const Schema = function(options) {
			const schema = function(data, options = {}) {
				return Schema.resolve(data, schema, options)[0];
			};
			if (options.refs) {
				const refs = mapValues(options.refs, (options) => new Schema(options));
				const getRef = (uid) => refs[uid];
				for (const key in refs) {
					const options = refs[key];
					options.sKey = getRef(options.sKey);
					options.inner = getRef(options.inner);
					options.list = options.list && options.list.map(getRef);
					options.dict = options.dict && mapValues(options.dict, getRef);
				}
				return refs[options.uid];
			}
			Object.assign(schema, options);
			if (typeof schema.callback === "string") try {
				schema.callback = new Function("return " + schema.callback)();
			} catch {}
			Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
			Object.setPrototypeOf(schema, Schema.prototype);
			schema.meta ||= {};
			schema.toString = schema.toString.bind(schema);
			return schema;
		};
		Schema.prototype = Object.create(Function.prototype);
		Schema.prototype[kSchema] = true;
		Object.defineProperty(Schema.prototype, "~standard", { get() {
			return {
				version: 1,
				vendor: "schemastery",
				validate: (value) => {
					try {
						return { value: Schema.resolve(value, this, {})[0] };
					} catch (error) {
						if (ValidationError.is(error)) return { issues: [{
							message: error.message,
							path: error.options.path
						}] };
						throw error;
					}
				}
			};
		} });
		Schema.ValidationError = ValidationError;
		Schema.prototype.toJSON = function toJSON() {
			if (globalThis.__schemastery_refs__) {
				globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
				return this.uid;
			}
			globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
			globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
			const result = {
				uid: this.uid,
				refs: globalThis.__schemastery_refs__
			};
			globalThis.__schemastery_refs__ = void 0;
			return result;
		};
		Schema.prototype.set = function set(key, value) {
			this.dict[key] = value;
			return this;
		};
		Schema.prototype.push = function push(value) {
			this.list.push(value);
			return this;
		};
		function mergeDesc(original, messages) {
			const result = typeof original === "string" ? { "": original } : { ...original };
			for (const locale in messages) {
				const value = messages[locale];
				if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
				else if (typeof value === "string") result[locale] = value;
			}
			return result;
		}
		function getInner(value) {
			return value?.$value ?? value?.$inner;
		}
		function extractKeys(data) {
			return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
		}
		Schema.prototype.i18n = function i18n(messages) {
			const schema = Schema(this);
			const desc = mergeDesc(schema.meta.description, messages);
			if (Object.keys(desc).length) schema.meta.description = desc;
			if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
				return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
			});
			if (schema.list) schema.list = schema.list.map((inner, index) => {
				return inner.i18n(mapValues(messages, (data = {}) => {
					if (Array.isArray(getInner(data))) return getInner(data)[index];
					if (Array.isArray(data)) return data[index];
					return extractKeys(data);
				}));
			});
			if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
				if (getInner(data)) return getInner(data);
				return extractKeys(data);
			}));
			if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
			return schema;
		};
		Schema.prototype.extra = function extra(key, value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		};
		for (const key of [
			"required",
			"disabled",
			"collapse",
			"hidden",
			"loose"
		]) Object.assign(Schema.prototype, { [key](value = true) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		Schema.prototype.deprecated = function deprecated() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "deprecated",
				type: "danger"
			});
			return schema;
		};
		Schema.prototype.experimental = function experimental() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "experimental",
				type: "warning"
			});
			return schema;
		};
		Schema.prototype.pattern = function pattern(regexp) {
			const schema = Schema(this);
			const pattern = pick(regexp, ["source", "flags"]);
			schema.meta = {
				...schema.meta,
				pattern
			};
			return schema;
		};
		Schema.prototype.simplify = function simplify(value) {
			if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
			if (isNullable(value)) return value;
			if (this.type === "object" || this.type === "dict") {
				const result = {};
				for (const key in value) {
					const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
					if (this.type === "dict" || !isNullable(item)) result[key] = item;
				}
				if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
				return result;
			} else if (this.type === "array" || this.type === "tuple") {
				const result = [];
				value.forEach((value, index) => {
					const schema = this.type === "array" ? this.inner : this.list[index];
					const item = schema ? schema.simplify(value) : value;
					result.push(item);
				});
				return result;
			} else if (this.type === "intersect") {
				const result = {};
				for (const item of this.list) Object.assign(result, item.simplify(value));
				return result;
			} else if (this.type === "union") for (const schema of this.list) try {
				Schema.resolve(value, schema, {});
				return schema.simplify(value);
			} catch {}
			return value;
		};
		Schema.prototype.toString = function toString(inline) {
			return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
		};
		Schema.prototype.role = function role(role, extra) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				role,
				extra
			};
			return schema;
		};
		for (const key of [
			"default",
			"link",
			"comment",
			"description",
			"max",
			"min",
			"step"
		]) Object.assign(Schema.prototype, { [key](value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		const resolvers = {};
		Schema.extend = function extend(type, resolve) {
			resolvers[type] = resolve;
		};
		Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
			if (!schema) return [data];
			if (options.ignore?.(data, schema)) return [data];
			if (isNullable(data) && schema.type !== "lazy") {
				if (schema.meta.required) throw new ValidationError(`missing required value`, options);
				let current = schema;
				let fallback = schema.meta.default;
				while (current?.type === "intersect" && isNullable(fallback)) {
					current = current.list[0];
					fallback = current?.meta.default;
				}
				if (isNullable(fallback)) return [data];
				data = clone(fallback);
			}
			const callback = resolvers[schema.type];
			if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
			try {
				return callback(data, schema, options, strict);
			} catch (error) {
				if (!schema.meta.loose) throw error;
				return [schema.meta.default];
			}
		};
		Schema.from = function from(source) {
			if (isNullable(source)) return Schema.any();
			else if ([
				"string",
				"number",
				"boolean"
			].includes(typeof source)) return Schema.const(source).required();
			else if (source[kSchema]) return source;
			else if (typeof source === "function") switch (source) {
				case String: return Schema.string().required();
				case Number: return Schema.number().required();
				case Boolean: return Schema.boolean().required();
				case Function: return Schema.function().required();
				default: return Schema.is(source).required();
			}
			else throw new TypeError(`cannot infer schema from ${source}`);
		};
		Schema.lazy = function lazy(builder) {
			const toJSON = () => {
				if (!schema.inner[kSchema]) {
					schema.inner = schema.builder();
					schema.inner.meta = {
						...schema.meta,
						...schema.inner.meta
					};
				}
				return schema.inner.toJSON();
			};
			const schema = new Schema({
				type: "lazy",
				builder,
				inner: { toJSON }
			});
			return schema;
		};
		Schema.natural = function natural() {
			return Schema.number().step(1).min(0);
		};
		Schema.percent = function percent() {
			return Schema.number().step(.01).min(0).max(1).role("slider");
		};
		Schema.date = function date() {
			return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
				const date = new Date(value);
				if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
				return date;
			}, true)]);
		};
		Schema.regExp = function regExp(flag = "") {
			return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
				try {
					return new RegExp(value, flag);
				} catch (e) {
					throw new ValidationError(e.message, options);
				}
			}, true)]);
		};
		Schema.arrayBuffer = function arrayBuffer(encoding) {
			return Schema.union([
				Schema.is(ArrayBuffer),
				Schema.is(SharedArrayBuffer),
				Schema.transform(Schema.any(), (value, options) => {
					if (Binary.isSource(value)) return Binary.fromSource(value);
					throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
				}, true),
				...encoding ? [Schema.transform(Schema.string(), (value, options) => {
					try {
						return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
					} catch (e) {
						throw new ValidationError(e.message, options);
					}
				}, true)] : []
			]);
		};
		Schema.extend("lazy", (data, schema, options, strict) => {
			if (!schema.inner[kSchema]) {
				schema.inner = schema.builder();
				schema.inner.meta = {
					...schema.meta,
					...schema.inner.meta
				};
			}
			return Schema.resolve(data, schema.inner, options, strict);
		});
		Schema.extend("any", (data) => {
			return [data];
		});
		Schema.extend("never", (data, _, options) => {
			throw new ValidationError(`expected nullable but got ${data}`, options);
		});
		Schema.extend("const", (data, { value }, options) => {
			if (deepEqual(data, value)) return [value];
			throw new ValidationError(`expected ${value} but got ${data}`, options);
		});
		function checkWithinRange(data, meta, description, options, skipMin = false) {
			const { max = Infinity, min = -Infinity } = meta;
			if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
			if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
		}
		Schema.extend("string", (data, { meta }, options) => {
			if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
			if (meta.pattern) {
				const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
				if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
			}
			checkWithinRange(data.length, meta, "string length", options);
			return [data];
		});
		function decimalShift(data, digits) {
			const str = data.toString();
			if (str.includes("e")) return data * Math.pow(10, digits);
			const index = str.indexOf(".");
			if (index === -1) return data * Math.pow(10, digits);
			const frac = str.slice(index + 1);
			const integer = str.slice(0, index);
			if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
			return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
		}
		function isMultipleOf(data, min, step) {
			step = Math.abs(step);
			if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
			const index = step.toString().indexOf(".");
			const digits = step.toString().slice(index + 1).length;
			return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
		}
		Schema.extend("number", (data, { meta }, options) => {
			if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
			checkWithinRange(data, meta, "number", options);
			const { step } = meta;
			if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
			return [data];
		});
		Schema.extend("boolean", (data, _, options) => {
			if (typeof data === "boolean") return [data];
			throw new ValidationError(`expected boolean but got ${data}`, options);
		});
		Schema.extend("bitset", (data, { bits, meta }, options) => {
			let value = 0, keys = [];
			if (typeof data === "number") {
				value = data;
				for (const key in bits) if (data & bits[key]) keys.push(key);
			} else if (Array.isArray(data)) {
				keys = data;
				for (const key of keys) {
					if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
					if (key in bits) value |= bits[key];
				}
			} else throw new ValidationError(`expected number or array but got ${data}`, options);
			if (value === meta.default) return [value];
			return [value, keys];
		});
		Schema.extend("function", (data, _, options) => {
			if (typeof data === "function") return [data];
			throw new ValidationError(`expected function but got ${data}`, options);
		});
		Schema.extend("is", (data, { constructor }, options) => {
			if (typeof constructor === "function") {
				if (data instanceof constructor) return [data];
				throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
			} else {
				if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
				let prototype = Object.getPrototypeOf(data);
				while (prototype) {
					if (prototype.constructor?.name === constructor) return [data];
					prototype = Object.getPrototypeOf(prototype);
				}
				throw new ValidationError(`expected ${constructor} but got ${data}`, options);
			}
		});
		function property(data, key, schema, options) {
			try {
				const [value, adapted] = Schema.resolve(data[key], schema, {
					...options,
					path: [...options.path || [], key]
				});
				if (adapted !== void 0) data[key] = adapted;
				return value;
			} catch (e) {
				if (!options?.autofix) throw e;
				delete data[key];
				return schema.meta.default;
			}
		}
		Schema.extend("array", (data, { inner, meta }, options) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
			return [data.map((_, index) => property(data, index, inner, options))];
		});
		Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in data) {
				let rKey;
				try {
					rKey = Schema.resolve(key, sKey, options)[0];
				} catch (error) {
					if (strict) continue;
					throw error;
				}
				result[rKey] = property(data, key, inner, options);
				data[rKey] = data[key];
				if (key !== rKey) delete data[key];
			}
			return [result];
		});
		Schema.extend("tuple", (data, { list }, options, strict) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			const result = list.map((inner, index) => property(data, index, inner, options));
			if (strict) return [result];
			result.push(...data.slice(list.length));
			return [result];
		});
		function merge(result, data) {
			for (const key in data) {
				if (key in result) continue;
				result[key] = data[key];
			}
		}
		Schema.extend("object", (data, { dict }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in dict) {
				const value = property(data, key, dict[key], options);
				if (!isNullable(value) || key in data) result[key] = value;
			}
			if (!strict) merge(result, data);
			return [result];
		});
		Schema.extend("union", (data, { list, toString }, options, strict) => {
			const messages = [];
			for (const inner of list) try {
				return Schema.resolve(data, inner, options, strict);
			} catch (error) {
				messages.push(error);
			}
			throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		});
		Schema.extend("intersect", (data, { list, toString }, options, strict) => {
			if (!list.length) return [data];
			let result;
			for (const inner of list) {
				const value = Schema.resolve(data, inner, options, true)[0];
				if (isNullable(value)) continue;
				if (isNullable(result)) result = value;
				else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
				else if (typeof value === "object") merge(result ??= {}, value);
				else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
			}
			if (!strict && isPlainObject(data)) merge(result, data);
			return [result];
		});
		Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
			const [result, adapted = data] = Schema.resolve(data, inner, options, true);
			if (preserve) return [callback(result)];
			else return [callback(result), callback(adapted)];
		});
		const formatters = {};
		function defineMethod(name, keys, format) {
			formatters[name] = format;
			Object.assign(Schema, { [name](...args) {
				const schema = new Schema({ type: name });
				keys.forEach((key, index) => {
					switch (key) {
						case "sKey":
							schema.sKey = args[index] ?? Schema.string();
							break;
						case "inner":
							schema.inner = Schema.from(args[index]);
							break;
						case "list":
							schema.list = args[index].map(Schema.from);
							break;
						case "dict":
							schema.dict = mapValues(args[index], Schema.from);
							break;
						case "bits":
							schema.bits = {};
							for (const key in args[index]) {
								if (typeof args[index][key] !== "number") continue;
								schema.bits[key] = args[index][key];
							}
							break;
						case "callback": {
							const callback = schema.callback = args[index];
							callback["toJSON"] ||= () => callback.toString();
							break;
						}
						case "constructor": {
							const constructor = schema.constructor = args[index];
							if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
							break;
						}
						default: schema[key] = args[index];
					}
				});
				if (name === "object" || name === "dict") schema.meta.default = {};
				else if (name === "array" || name === "tuple") schema.meta.default = [];
				else if (name === "bitset") schema.meta.default = 0;
				return schema;
			} });
		}
		defineMethod("is", ["constructor"], ({ constructor }) => {
			if (typeof constructor === "function") return constructor.name;
			else return constructor;
		});
		defineMethod("any", [], () => "any");
		defineMethod("never", [], () => "never");
		defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
		defineMethod("string", [], () => "string");
		defineMethod("number", [], () => "number");
		defineMethod("boolean", [], () => "boolean");
		defineMethod("bitset", ["bits"], () => "bitset");
		defineMethod("function", [], () => "function");
		defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
		defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
		defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
		defineMethod("object", ["dict"], ({ dict }) => {
			if (Object.keys(dict).length === 0) return "{}";
			return `{ ${Object.entries(dict).map(([key, inner]) => {
				return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
			}).join(", ")} }`;
		});
		defineMethod("union", ["list"], ({ list }, inline) => {
			const result = list.map(({ toString: format }) => format()).join(" | ");
			return inline ? `(${result})` : result;
		});
		defineMethod("intersect", ["list"], ({ list }) => {
			return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
		});
		defineMethod("transform", [
			"inner",
			"callback",
			"preserve"
		], ({ inner }, isInner) => inner.toString(isInner));
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
		//#region lib/types/client/schema-safety.js
		/** Browser-side fail-closed gate for settings namespaces used by Provider editors. */
		/** Reject a wire descriptor whose secret descendants use unsupported wrappers. */
		function assertProviderSchemasSafe(views) {
			for (const view of views) {
				if (view.ns !== "llm-deepseek" && view.ns !== "llm-pi-ai" && view.ns !== "agent-default-model") continue;
				assertSecretSchemaSafe(view.ns, new Schema(view.schema));
			}
		}
		//#endregion
		//#region lib/types/client/store.js
		/**
		* Models settings page store: one snapshot joining the configurable-provider
		* directory (`llm.providers`), the settings namespaces (`settings.describe`),
		* and the referenced credentials (`credentials.describe`). The host stays the
		* single fact source — every mutation writes through the wire and the page
		* re-renders from the next describe, pushed or refetched.
		*/
		/**
		* Any route key walks a dict schema to the same profile node, so the lookup
		* names one that cannot collide with a configured route.
		*/
		const PROBE_ROUTE = "\0probe";
		/**
		* Human text for a rejected wire call. A transport failure rejects with an
		* Error; a host or a runtime can reject with anything, and the page still has
		* to say something.
		* @param error - the rejection value.
		* @returns the message to show.
		*/
		function messageOf$1(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/**
		* Derive the conventional credential reference for a provider route: the v1
		* page never asks for an environment-variable name, so a typed key stores
		* under this derived reference and the profile records it as `apiKeyEnv`.
		* @param provider - provider route id (e.g. `anthropic`, `minimax-cn`).
		* @returns the derived reference name (e.g. `MINIMAX_CN_API_KEY`).
		*/
		function deriveKeyRef(provider) {
			return `${provider.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_API_KEY`;
		}
		/**
		* The wire protocols a hand-declared route may name, read out of the owning
		* namespace's own schema. This stays a schema read rather than a wire field so
		* the choices the page offers cannot drift from the ones the adapter accepts:
		* both come from the same `Config`.
		* @param namespace - the namespace view whose schema declares the profile shape.
		* @returns the protocol identifiers, or an empty list when the schema has none.
		*/
		function protocolChoices(namespace) {
			if (namespace === void 0) return [];
			const list = (0, _deepseek_ai_dsh_client_schema_form.nodeAtPath)((0, _deepseek_ai_dsh_client_schema_form.rehydrateSchema)(namespace.schema), [
				"providers",
				PROBE_ROUTE,
				"api"
			]);
			if (list?.type !== "union" || list.list === void 0) return [];
			return list.list.map((entry) => entry.value).filter((value) => typeof value === "string");
		}
		/** The credential reference a resolved profile names (its `apiKeyEnv` field). */
		function apiKeyEnvOf(namespace, path) {
			if (namespace === void 0) return void 0;
			const profile = (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.value, path);
			if (typeof profile !== "object" || profile === null) return void 0;
			const ref = profile.apiKeyEnv;
			return typeof ref === "string" && ref.length > 0 ? ref : void 0;
		}
		/** The models settings page controller (one per settings surface). */
		var ModelsSettingsStore = class {
			api;
			/** The snapshot the section renders from (uSES-safe store). */
			store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
				status: "idle",
				error: null,
				credentialError: null,
				writable: false,
				rows: [],
				namespaces: /* @__PURE__ */ new Map()
			});
			/** Latest load wins; an older response never overwrites a newer one. */
			generation = 0;
			/**
			* @param api - the wire face (settings/credentials/llm domains).
			*/
			constructor(api) {
				this.api = api;
			}
			/**
			* Refresh the whole page snapshot: directory and namespaces in parallel,
			* then one batched credential describe over every referenced ref. A
			* failure keeps the last good rows and surfaces the error.
			* @returns nothing; the snapshot carries the outcome.
			*/
			async load() {
				const generation = ++this.generation;
				this.store.update((s) => {
					s.status = "loading";
					s.error = null;
				});
				let providers;
				let writable;
				let views;
				try {
					const [providersResponse, settingsResponse] = await Promise.all([this.api.llm.providers({}), this.api.settings.describe({})]);
					if (!providersResponse.result.ok) throw new Error(providersResponse.result.error.message);
					if (!settingsResponse.result.ok) throw new Error(settingsResponse.result.error.message);
					providers = providersResponse.result.value.providers;
					writable = settingsResponse.result.value.writable;
					views = settingsResponse.result.value.namespaces;
					assertProviderSchemasSafe(views);
				} catch (error) {
					if (generation !== this.generation) return;
					this.store.update((s) => {
						s.status = "error";
						s.error = error instanceof Error ? error.message : String(error);
					});
					return;
				}
				const namespaces = new Map(views.map((view) => [view.ns, view]));
				const rows = providers.map((entry) => {
					const namespace = namespaces.get(entry.settingsNs);
					return {
						entry,
						configured: namespace !== void 0 && (entry.settingsPath.length === 0 || (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.value, entry.settingsPath) !== void 0),
						removable: namespace !== void 0 && entry.settingsPath.length > 0 && (0, _deepseek_ai_dsh_client_schema_form.hasPath)(namespace.user, entry.settingsPath) && !(0, _deepseek_ai_dsh_client_schema_form.hasPath)(namespace.base, entry.settingsPath),
						apiKeyEnv: apiKeyEnvOf(namespace, entry.settingsPath),
						credential: void 0
					};
				});
				const refs = [...new Set(rows.flatMap((row) => row.apiKeyEnv === void 0 ? [] : [row.apiKeyEnv]))];
				let credentials = {};
				let credentialError = null;
				if (refs.length > 0) try {
					const response = await this.api.credentials.describe({ refs });
					if (response.result.ok) credentials = response.result.value.credentials;
					else credentialError = response.result.error.message;
				} catch (error) {
					credentialError = messageOf$1(error);
				}
				if (generation !== this.generation) return;
				this.store.update((s) => {
					s.status = "ready";
					s.error = null;
					s.credentialError = credentialError;
					s.writable = writable;
					s.rows = rows.map((row) => ({
						...row,
						...row.apiKeyEnv !== void 0 && credentials[row.apiKeyEnv] !== void 0 ? { credential: credentials[row.apiKeyEnv] } : {}
					}));
					s.namespaces = namespaces;
				});
			}
		};
		/**
		* Whether a joined row can serve model requests as it stands: the route is
		* registered with the adapter registry, and whatever credential its resolved
		* profile names is stored. A profile naming no reference authenticates through
		* the provider's own path (the Bedrock chain, Vertex ADC, a gateway that needs
		* nothing), as does a live route with no settings address at all, so neither
		* owes this page a key.
		* @param row - one joined provider row.
		* @returns whether the user already has this provider to talk to.
		*/
		function providerUsable(row) {
			if (!row.entry.active) return false;
			if (row.apiKeyEnv === void 0) return true;
			return row.credential?.configured === true;
		}
		/**
		* Project first-run readiness from the provider/settings/credential join used
		* by the Models page. The step exists to leave the user with a model to talk
		* to, so ANY usable provider ends it; only when none exists does the official
		* DeepSeek route — the one route the prompt can offer a key field for — decide
		* whether prompting can help. A missing official configurable-provider
		* declaration means the adapter is not repairable by navigating to Models.
		* @param state - current shared Models join snapshot.
		* @returns the onboarding state without reading a parallel fact source.
		*/
		function onboardingReadiness(state) {
			if ((state.status === "idle" || state.status === "loading") && state.rows.length === 0) return { kind: "loading" };
			if (state.status === "error") return {
				kind: "unavailable",
				reason: "load-failed"
			};
			if (state.rows.some(providerUsable)) return { kind: "provider-ready" };
			const row = state.rows.find((candidate) => candidate.entry.provider === "deepseek-official" && candidate.entry.settingsNs === "llm-deepseek" && candidate.entry.settingsPath.length === 0);
			if (row === void 0) return { kind: "adapter-absent" };
			if (!row.entry.active) return {
				kind: "unavailable",
				reason: "provider-inactive"
			};
			if (state.credentialError !== null || row.credential === void 0) return {
				kind: "unavailable",
				reason: "credentials-unavailable"
			};
			if (!state.writable) return {
				kind: "unavailable",
				reason: "settings-read-only"
			};
			if (!row.credential.writable) return {
				kind: "unavailable",
				reason: "credential-read-only"
			};
			return { kind: "credential-missing" };
		}
		//#endregion
		//#region lib/types/client/ModelListEditor.js
		/**
		* The model list of one pi-ai provider profile, plus the action that asks the
		* provider what it serves.
		*
		* The list is the profile's `models` array as the card holds it: an empty list
		* means "serve this route's built-in catalog", and any entry replaces that
		* catalog, so a row is only ever added deliberately. Fetching asks the endpoint
		* **the form currently shows** — including a key typed but not yet saved — so
		* adding a provider is one pass instead of save-then-return; the reply is
		* candidates the user picks from, never configuration written behind them.
		*
		* A provider that cannot be interrogated (an unreachable endpoint, a protocol
		* with no readable listing) is not a dead end: the failure is shown next to the
		* rows the user can still fill in by hand.
		*/
		/** A row's text field, or the empty string when unset or not a string. */
		function textOf(model, key) {
			const value = model[key];
			return typeof value === "string" ? value : "";
		}
		/** A row's numeric field, or `undefined` when unset or not a number. */
		function numberOf(model, key) {
			const value = model[key];
			return typeof value === "number" ? value : void 0;
		}
		/** Disclosure chevron; rotates to point down while its row is open. */
		function IconChevron({ open }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": true,
				style: {
					transform: open ? "rotate(90deg)" : void 0,
					transition: "transform 120ms ease"
				},
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M6 3.5L10.5 8L6 12.5",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			});
		}
		/** Removal glyph for one model row. */
		function IconTrash() {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": true,
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9a1 1 0 001 .9h4.6a1 1 0 001-.9L12 4M6.5 6.8v4.4M9.5 6.8v4.4",
					stroke: "currentColor",
					strokeWidth: "1.3",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			});
		}
		/**
		* What an empty capacity field is worth, shown as its placeholder so a row left
		* blank does not read as a model with no capacity at all.
		*
		* The magnitudes are the adapter's own route-level fallbacks (`llm-pi-ai`'s
		* `defaultContextWindow` and `defaultMaxTokens`), spelled the way a person
		* would say them. They are a hint, not a mirror: this page counts `K` as 1000,
		* so typing `256K` stores 256000 while leaving the field blank keeps the
		* adapter's 262144. A deployment that overrides those defaults is not
		* reflected here — nothing on this page can read them.
		*/
		const CAPACITY_HINT = {
			contextWindow: "256K",
			maxTokens: "32K"
		};
		/**
		* Spell a stored count for a field that may be unset. The spelling itself is
		* {@link formatCapacity}, shared with the DeepSeek catalog editor so both
		* surfaces read and write one K/M vocabulary.
		* @param value - stored capacity, or `undefined` for an unset field.
		* @returns the field text, empty when unset.
		*/
		function capacitySpelling(value) {
			return value === void 0 ? "" : formatCapacity(value);
		}
		/** Adopt a candidate, keeping whatever capacities the provider disclosed. */
		function adopt(candidate) {
			return {
				id: candidate.id,
				...candidate.name === void 0 ? {} : { name: candidate.name },
				...candidate.contextWindow === void 0 ? {} : { contextWindow: candidate.contextWindow },
				...candidate.maxTokens === void 0 ? {} : { maxTokens: candidate.maxTokens }
			};
		}
		/**
		* Render the model list with its fetch action.
		* @param props - the drafted rows, probe target, wire face, and copy.
		* @returns the model-list editor.
		*/
		function ModelListEditor(props) {
			const { models, onChange, probe, api, t, disabled } = props;
			const [busy, setBusy] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)(void 0);
			const [candidates, setCandidates] = (0, react.useState)(void 0);
			const [picked, setPicked] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [expanded, setExpanded] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [editing, setEditing] = (0, react.useState)(/* @__PURE__ */ new Map());
			/** Buffer key for one capacity field; the row half moves when rows do. */
			const bufferKey = (index, field) => `${String(index)}:${field}`;
			const editCapacity = (index, field, text) => {
				setEditing((current) => new Map(current).set(bufferKey(index, field), text));
				patch(index, { [field]: parseCapacity(text) });
			};
			/** What a capacity field shows: the buffer while typing, else the stored count. */
			const capacityText = (model, index, field) => editing.get(bufferKey(index, field)) ?? capacitySpelling(numberOf(model, field));
			/** Drop one row's entries and shift the rows after it down, in one pass. */
			const reindexOnRemove = (current, index) => {
				const next = /* @__PURE__ */ new Map();
				for (const [key, value] of current) {
					const at = Number(key.slice(0, key.indexOf(":")));
					if (at === index) continue;
					next.set(at > index ? key.replace(/^\d+/, String(at - 1)) : key, value);
				}
				return next;
			};
			const toggleExpanded = (index) => {
				setExpanded((current) => {
					const next = new Set(current);
					if (!next.delete(index)) next.add(index);
					return next;
				});
			};
			const patch = (index, next) => {
				onChange(models.map((model, at) => {
					if (at !== index) return model;
					const cleared = new Set(Object.entries(next).filter(([, value]) => value === void 0 || value === "").map(([key]) => key));
					return Object.fromEntries(Object.entries({
						...model,
						...next
					}).filter(([key]) => !cleared.has(key)));
				}));
			};
			const fetchModels = async () => {
				setBusy(true);
				setFailure(void 0);
				try {
					const response = await api.llm.discoverModels({
						settingsNs: probe.settingsNs,
						...probe.provider === void 0 ? {} : { provider: probe.provider },
						...probe.baseURL === void 0 || probe.baseURL.length === 0 ? {} : { baseURL: probe.baseURL },
						...probe.api === void 0 ? {} : { api: probe.api },
						...probe.apiKey === void 0 ? {} : { apiKey: probe.apiKey }
					});
					if (!response.result.ok) {
						setFailure(response.result.error.message);
						return;
					}
					const found = response.result.value.models;
					if (found.length === 0) {
						setFailure(t("fetchEmpty"));
						return;
					}
					const known = new Set(models.map((model) => textOf(model, "id")));
					setCandidates(found);
					setPicked(new Set(found.filter((model) => !known.has(model.id)).map((model) => model.id)));
				} catch (error) {
					setFailure(messageOf$1(error));
				} finally {
					setBusy(false);
				}
			};
			const closePicker = () => {
				setCandidates(void 0);
				setPicked(/* @__PURE__ */ new Set());
			};
			const adoptPicked = () => {
				/* v8 ignore next -- the dialog only renders with candidates loaded */
				if (candidates === void 0) return;
				const byId = new Map(models.map((model) => [textOf(model, "id"), model]));
				for (const candidate of candidates) {
					if (!picked.has(candidate.id)) continue;
					byId.set(candidate.id, byId.get(candidate.id) ?? adopt(candidate));
				}
				onChange([...byId.values()]);
				closePicker();
			};
			const toggle = (id) => {
				setPicked((current) => {
					const next = new Set(current);
					if (!next.delete(id)) next.add(id);
					return next;
				});
			};
			const askable = probe.provider !== void 0 || probe.baseURL !== void 0 && probe.baseURL.length > 0;
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ModelsSection_module_css_default["modelCatalog"],
				"aria-label": t("models"),
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["modelListHead"],
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								className: ModelsSection_module_css_default["modelCatalogHeading"],
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ModelsSection_module_css_default["modelCatalogTitle"],
									children: t("models")
								}), props.overridden === void 0 ? null : (0, react_jsx_runtime.jsx)("span", {
									className: ModelsSection_module_css_default["modelCatalogMeta"],
									children: props.overridden ? t("modelsCustomized") : t("modelsInherited")
								})]
							}),
							props.overridden === true && props.onReset !== void 0 ? (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ModelsSection_module_css_default["linkButton"],
								disabled,
								onClick: props.onReset,
								children: t("resetModels")
							}) : null,
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ModelsSection_module_css_default["linkButton"],
								disabled: disabled || busy || !askable || props.probeBlocked !== void 0,
								title: props.probeBlocked !== void 0 ? t(props.probeBlocked) : askable ? void 0 : t("fetchNeedsBaseUrl"),
								onClick: () => {
									fetchModels();
								},
								children: busy ? t("fetching") : t("fetchModels")
							})
						]
					}),
					models.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["modelEmpty"],
						children: t("modelsEmpty")
					}) : null,
					models.map((model, index) => (0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["modelEntry"],
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: ModelsSection_module_css_default["modelRow"],
							children: [
								(0, react_jsx_runtime.jsx)("input", {
									className: ModelsSection_module_css_default["input"],
									type: "text",
									value: textOf(model, "id"),
									placeholder: t("modelId"),
									"aria-label": `${t("modelId")} ${index + 1}`,
									disabled,
									onChange: (event) => {
										patch(index, { id: event.target.value });
									}
								}),
								(0, react_jsx_runtime.jsx)("input", {
									className: ModelsSection_module_css_default["input"],
									type: "text",
									value: textOf(model, "name"),
									placeholder: t("modelName"),
									"aria-label": `${t("modelName")} ${index + 1}`,
									disabled,
									onChange: (event) => {
										patch(index, { name: event.target.value === "" ? void 0 : event.target.value });
									}
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ModelsSection_module_css_default["iconButton"],
									"aria-label": `${t("modelAdvanced")} ${index + 1}`,
									"aria-expanded": expanded.has(index),
									title: t("modelAdvanced"),
									onClick: () => {
										toggleExpanded(index);
									},
									children: (0, react_jsx_runtime.jsx)(IconChevron, { open: expanded.has(index) })
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: `${ModelsSection_module_css_default["iconButton"]} ${ModelsSection_module_css_default["iconButtonDanger"]}`,
									"aria-label": `${t("removeModel")} ${index + 1}`,
									title: t("removeModel"),
									disabled,
									onClick: () => {
										onChange(models.filter((_model, at) => at !== index));
										setExpanded((current) => {
											const next = /* @__PURE__ */ new Set();
											for (const at of current) if (at < index) next.add(at);
											else if (at > index) next.add(at - 1);
											return next;
										});
										setEditing((current) => reindexOnRemove(current, index));
									},
									children: (0, react_jsx_runtime.jsx)(IconTrash, {})
								})
							]
						}), expanded.has(index) ? (0, react_jsx_runtime.jsxs)("div", {
							className: ModelsSection_module_css_default["modelAdvanced"],
							children: [(0, react_jsx_runtime.jsxs)("label", {
								className: ModelsSection_module_css_default["modelField"],
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ModelsSection_module_css_default["modelFieldLabel"],
									children: t("modelContextWindow")
								}), (0, react_jsx_runtime.jsx)("input", {
									className: ModelsSection_module_css_default["input"],
									type: "text",
									inputMode: "numeric",
									value: capacityText(model, index, "contextWindow"),
									placeholder: CAPACITY_HINT.contextWindow,
									"aria-label": `${t("modelContextWindow")} ${index + 1}`,
									disabled,
									onChange: (event) => {
										editCapacity(index, "contextWindow", event.target.value);
									}
								})]
							}), (0, react_jsx_runtime.jsxs)("label", {
								className: ModelsSection_module_css_default["modelField"],
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ModelsSection_module_css_default["modelFieldLabel"],
									children: t("modelMaxTokens")
								}), (0, react_jsx_runtime.jsx)("input", {
									className: ModelsSection_module_css_default["input"],
									type: "text",
									inputMode: "numeric",
									value: capacityText(model, index, "maxTokens"),
									placeholder: CAPACITY_HINT.maxTokens,
									"aria-label": `${t("modelMaxTokens")} ${index + 1}`,
									disabled,
									onChange: (event) => {
										editCapacity(index, "maxTokens", event.target.value);
									}
								})]
							})]
						}) : null]
					}, index)),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ModelsSection_module_css_default["addModelButton"],
						disabled,
						onClick: () => {
							onChange([...models, { id: "" }]);
						},
						children: t("addModel")
					}),
					failure !== void 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["error"],
						children: failure
					}) : null,
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: candidates !== void 0,
						onClose: closePicker,
						title: t("fetchTitle"),
						closeLabel: t("close"),
						description: t("fetchDescription"),
						className: ModelsSection_module_css_default["fetchDialog"],
						footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							onClick: closePicker,
							children: t("cancel")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							onClick: adoptPicked,
							children: t("fetchAdopt")
						})] }),
						children: (0, react_jsx_runtime.jsx)("ul", {
							className: ModelsSection_module_css_default["candidateList"],
							children: (candidates ?? []).map((candidate) => (0, react_jsx_runtime.jsx)("li", {
								className: ModelsSection_module_css_default["candidate"],
								children: (0, react_jsx_runtime.jsxs)("label", {
									className: ModelsSection_module_css_default["candidateLabel"],
									children: [(0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: picked.has(candidate.id),
										onChange: () => {
											toggle(candidate.id);
										}
									}), (0, react_jsx_runtime.jsx)("span", {
										className: ModelsSection_module_css_default["candidateId"],
										children: candidate.id
									})]
								})
							}, candidate.id))
						})
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/CustomProviderCard.js
		/**
		* The card that declares a provider pi-ai does not ship — an OpenAI-compatible
		* gateway, a self-hosted server, or a provider newer than the installed
		* catalog.
		*
		* This is a create, not an edit, which is why it is its own card rather than
		* the provider editor with extra fields: the route id is being *chosen* here,
		* and the settings address does not exist until it is. One `settings.mutate`
		* sets the whole profile at `providers.<route>`; the key travels separately
		* through `credentials.set` under the reference the profile records, exactly as
		* an existing provider's key does.
		*
		* The three fields a hand-declared route cannot default — endpoint, protocol,
		* and at least one model — are required here rather than at load, so the
		* failure names the field while the user is still looking at it.
		*
		* There is deliberately no reasoning-effort control, here or on the editor
		* card: effort is a per-MODEL capability, and the models under one provider
		* disagree about it, so a provider-scoped control can only be set to a value
		* some of them reject. The composer's model picker offers each model its own
		* levels instead.
		*/
		/** The settings namespace a hand-declared provider is written into. */
		const NS = "llm-pi-ai";
		/**
		* A route id usable as a settings key AND as the stem of a credential name.
		* The leading letter is the second half of that: `deriveKeyRef` uppercases the
		* id and replaces every non-alphanumeric run with `_`, and a credential
		* reference is a POSIX shell identifier, which cannot start with a digit. A
		* digit-leading id passes every check this card makes and then fails at the
		* credential seam with a raw regular expression the user cannot act on.
		*/
		const ROUTE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
		/**
		* Render the custom-provider creation card.
		* @param props - existing routes, protocol choices, wire faces, and copy.
		* @returns the creation card.
		*/
		function CustomProviderCard(props) {
			const { taken, protocols, api, t } = props;
			const [openedAt] = (0, react.useState)(() => props.revision);
			const [route, setRoute] = (0, react.useState)("");
			const [displayName, setDisplayName] = (0, react.useState)("");
			const [baseURL, setBaseURL] = (0, react.useState)("");
			const [protocol, setProtocol] = (0, react.useState)(protocols[0] ?? "");
			const [keyDraft, setKeyDraft] = (0, react.useState)("");
			const [models, setModels] = (0, react.useState)([]);
			const [busy, setBusy] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)(void 0);
			/**
			* The profile write landed. Only the key write can still be outstanding, so
			* the fields that describe the provider are settled and the retry path is
			* the credential alone.
			*/
			const [committed, setCommitted] = (0, react.useState)(false);
			const disabled = props.readOnly || busy;
			/** Everything but the key stops being editable once the provider exists. */
			const profileDisabled = disabled || committed;
			const routeInvalid = route.length > 0 && !ROUTE_PATTERN.test(route);
			const routeTaken = taken.includes(route);
			const modelFailure = validateDeepSeekModels(models);
			const keyFailure = apiKeyFailure(keyDraft);
			const keyValue = keyDraft.trim();
			const ready = route.length > 0 && !routeInvalid && !routeTaken && baseURL.length > 0 && models.length > 0 && modelFailure === void 0 && keyFailure === void 0;
			const hint = failure !== void 0 || ready || keyFailure !== void 0 || route.length === 0 || routeInvalid || routeTaken ? void 0 : baseURL.length === 0 ? t("customNeedsBaseUrl") : modelFailure !== void 0 ? `${t("model")} ${String(modelFailure.index + 1)}: ${t(modelFailure.key)}` : t("customNeedsModels");
			/** Perform the create, returning a failure message or undefined. */
			const createOnce = async () => {
				const keyRef = deriveKeyRef(route);
				const storesKey = keyValue.length > 0;
				if (!committed) {
					const profile = {
						...displayName.length === 0 ? {} : { displayName },
						...storesKey ? { apiKeyEnv: keyRef } : {},
						api: protocol,
						baseURL,
						models: models.map((model) => ({ ...model }))
					};
					const response = await api.settings.mutate({
						ns: NS,
						ops: [{
							op: "set",
							path: ["providers", route],
							value: profile
						}],
						expectedRevision: openedAt
					});
					if (!response.result.ok) return response.result.error.message;
					setCommitted(true);
				}
				if (storesKey) {
					const stored = await api.credentials.set({
						ref: keyRef,
						value: keyValue
					});
					if (!stored.result.ok) return stored.result.error.message;
				}
			};
			const create = async () => {
				setBusy(true);
				setFailure(void 0);
				try {
					const outcome = await createOnce();
					if (outcome !== void 0) {
						setFailure(outcome);
						return;
					}
					props.onClose(true);
				} catch (error) {
					setFailure(messageOf$1(error));
				} finally {
					setBusy(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ModelsSection_module_css_default["editor"],
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: ModelsSection_module_css_default["editorHeader"],
						children: (0, react_jsx_runtime.jsx)("span", {
							className: ModelsSection_module_css_default["editorTitle"],
							children: t("customTitle")
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["field"],
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ModelsSection_module_css_default["fieldLabel"],
							children: t("customRoute")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: ModelsSection_module_css_default["input"],
							type: "text",
							value: route,
							placeholder: "acme-gateway",
							"aria-label": t("customRoute"),
							disabled: profileDisabled,
							onChange: (event) => {
								setRoute(event.target.value);
							}
						})]
					}),
					routeInvalid || routeTaken ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["error"],
						children: t(routeInvalid ? "customRouteInvalid" : "customRouteTaken")
					}) : (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["advancedHint"],
						children: t("customRouteHint")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["field"],
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ModelsSection_module_css_default["fieldLabel"],
							children: t("customDisplayName")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: ModelsSection_module_css_default["input"],
							type: "text",
							value: displayName,
							placeholder: route.length === 0 ? t("customDisplayName") : route,
							"aria-label": t("customDisplayName"),
							disabled: profileDisabled,
							onChange: (event) => {
								setDisplayName(event.target.value);
							}
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["field"],
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ModelsSection_module_css_default["fieldLabel"],
							children: t("baseUrl")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: ModelsSection_module_css_default["input"],
							type: "text",
							value: baseURL,
							placeholder: "https://gateway.example/v1",
							"aria-label": t("baseUrl"),
							disabled: profileDisabled,
							onChange: (event) => {
								setBaseURL(event.target.value);
							}
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["field"],
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ModelsSection_module_css_default["fieldLabel"],
							children: t("customApi")
						}), (0, react_jsx_runtime.jsx)("select", {
							className: `${ModelsSection_module_css_default["input"]} ${ModelsSection_module_css_default["selectInput"]}`,
							value: protocol,
							"aria-label": t("customApi"),
							disabled: profileDisabled,
							onChange: (event) => {
								setProtocol(event.target.value);
							},
							children: protocols.map((choice) => (0, react_jsx_runtime.jsx)("option", {
								value: choice,
								children: choice
							}, choice))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["field"],
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: ModelsSection_module_css_default["fieldLabel"],
								children: t("keyInput")
							}),
							(0, react_jsx_runtime.jsx)("input", {
								className: ModelsSection_module_css_default["input"],
								type: "password",
								autoComplete: "off",
								value: keyDraft,
								placeholder: t("keyPlaceholder"),
								"aria-label": t("keyInput"),
								disabled,
								onChange: (event) => {
									setKeyDraft(event.target.value);
								}
							}),
							keyFailure === void 0 ? null : (0, react_jsx_runtime.jsx)("p", {
								className: ModelsSection_module_css_default["error"],
								children: t(keyFailure === "keyBlank" ? "keyBlankNew" : keyFailure)
							})
						]
					}),
					(0, react_jsx_runtime.jsx)(ModelListEditor, {
						models,
						onChange: setModels,
						probe: {
							settingsNs: NS,
							baseURL,
							api: protocol,
							...keyValue.length === 0 ? {} : { apiKey: keyValue }
						},
						probeBlocked: keyFailure === "keyBlank" ? "keyBlankNew" : keyFailure,
						api,
						t,
						disabled: profileDisabled
					}),
					failure !== void 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["error"],
						children: failure
					}) : null,
					hint === void 0 ? null : (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["advancedHint"],
						children: hint
					}),
					(0, react_jsx_runtime.jsx)(EditorFooter, {
						t,
						busy,
						submitDisabled: disabled || !ready,
						submitLabel: "create",
						submitBusyLabel: "creating",
						onCancel: () => {
							props.onClose(committed);
						},
						onSubmit: () => {
							create();
						}
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/ModelSelectionPanel.js
		const DEFAULT_NAMESPACE = "agent-default-model";
		var ModelSelectionStore = class {
			api;
			store;
			generation = 0;
			constructor(api) {
				this.api = api;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "idle",
					error: null,
					defaultSelection: null,
					defaultRevision: null,
					currentSessionId: void 0,
					currentAddressed: false,
					currentSelection: null,
					currentRoutable: null,
					groups: [],
					currentResult: "idle"
				});
			}
			async load(sessionId, addressed = false) {
				const generation = ++this.generation;
				this.store.update((state) => {
					state.status = "loading";
					state.error = null;
					state.currentSessionId = sessionId;
					state.currentAddressed = addressed;
					state.currentResult = "idle";
				});
				try {
					const [settingsResponse, modelsResponse, catalogResponse] = await Promise.all([
						this.api.settings.describe({}),
						sessionId === void 0 || addressed ? Promise.resolve(void 0) : this.api.sessions.models({ sessionId }),
						sessionId === void 0 || addressed ? this.api.llm.models({}) : Promise.resolve(void 0)
					]);
					if (!settingsResponse.result.ok) throw new Error(settingsResponse.result.error.message);
					if (modelsResponse !== void 0 && !modelsResponse.result.ok) throw new Error(modelsResponse.result.error.message);
					if (catalogResponse !== void 0 && !catalogResponse.result.ok) throw new Error(catalogResponse.result.error.message);
					assertProviderSchemasSafe(settingsResponse.result.value.namespaces);
					const namespace = settingsResponse.result.value.namespaces.find((view) => view.ns === DEFAULT_NAMESPACE);
					if (namespace === void 0) throw new Error("agent-default-model settings are unavailable");
					const current = modelsResponse?.result.ok === true ? modelsResponse.result.value : void 0;
					if (generation !== this.generation) return;
					this.store.update((state) => {
						state.status = "ready";
						state.defaultSelection = selectionOf(namespace.value);
						state.defaultRevision = namespace.revision;
						state.currentSelection = current?.current ?? null;
						state.currentRoutable = current?.routable ?? null;
						state.groups = current?.groups ?? (catalogResponse?.result.ok === true ? catalogResponse.result.value.groups : []);
					});
				} catch (error) {
					if (generation !== this.generation) return;
					this.store.update((state) => {
						state.status = "error";
						state.error = error instanceof Error ? error.message : String(error);
					});
				}
			}
			async saveDefault(selection) {
				const revision = this.store.getSnapshot().defaultRevision;
				if (revision === null) return false;
				this.store.update((state) => {
					state.status = "saving";
					state.error = null;
				});
				const result = (await this.api.settings.mutate({
					ns: DEFAULT_NAMESPACE,
					expectedRevision: revision,
					ops: [
						{
							op: "set",
							path: ["provider"],
							value: selection.provider
						},
						{
							op: "set",
							path: ["model"],
							value: selection.model
						},
						...selection.reasoningEffort === void 0 ? [{
							op: "unset",
							path: ["reasoningEffort"]
						}] : [{
							op: "set",
							path: ["reasoningEffort"],
							value: selection.reasoningEffort
						}]
					]
				})).result;
				if (!result.ok) {
					this.store.update((state) => {
						state.status = "error";
						state.error = result.error.message;
					});
					return false;
				}
				this.store.update((state) => {
					state.status = "ready";
					state.defaultSelection = selection;
					state.defaultRevision = result.value.revision;
				});
				return true;
			}
			async selectCurrent(selection) {
				const sessionId = this.store.getSnapshot().currentSessionId;
				if (sessionId === void 0 || this.store.getSnapshot().currentAddressed) return false;
				this.store.update((state) => {
					state.status = "saving";
					state.error = null;
					state.currentResult = "idle";
				});
				const selectedResult = (await this.api.sessions.selectModel({
					sessionId,
					...selection
				})).result;
				if (!selectedResult.ok) {
					this.store.update((state) => {
						state.status = "error";
						state.error = selectedResult.error.message;
					});
					return false;
				}
				const described = await this.api.settings.describe({});
				const defaultSelection = described.result.ok ? selectionOf(described.result.value.namespaces.find((view) => view.ns === DEFAULT_NAMESPACE)?.value) : null;
				const both = sameSelection(defaultSelection, selectedResult.value.selected);
				this.store.update((state) => {
					state.status = "ready";
					state.currentSelection = selectedResult.value.selected;
					state.currentRoutable = true;
					state.currentResult = both ? "both-updated" : "current-only";
					if (described.result.ok) {
						const namespace = described.result.value.namespaces.find((view) => view.ns === DEFAULT_NAMESPACE);
						state.defaultSelection = defaultSelection;
						state.defaultRevision = namespace?.revision ?? state.defaultRevision;
					}
				});
				return true;
			}
		};
		function selectionOf(value) {
			const provider = (0, _deepseek_ai_dsh_client_schema_form.getPath)(value, ["provider"]);
			const model = (0, _deepseek_ai_dsh_client_schema_form.getPath)(value, ["model"]);
			const reasoningEffort = (0, _deepseek_ai_dsh_client_schema_form.getPath)(value, ["reasoningEffort"]);
			if (typeof provider !== "string" || typeof model !== "string") return null;
			return {
				provider,
				model,
				...typeof reasoningEffort === "string" ? { reasoningEffort } : {}
			};
		}
		function sameSelection(left, right) {
			return left?.provider === right.provider && left.model === right.model && left.reasoningEffort === right.reasoningEffort;
		}
		function options(groups) {
			return groups.flatMap((group) => group.models.map((model) => ({
				selection: {
					provider: group.id,
					model: model.id,
					...model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort }
				},
				label: `${group.name} · ${model.name}`
			})));
		}
		/** Render distinct future-session default and current-session model controls. */
		function ModelSelectionPanel(props) {
			const currentSessionId = props.useSessions((state) => state.current);
			const currentAddressed = props.useSessions((state) => state.currentAddress !== void 0);
			const state = props.useSnapshot((snapshot) => snapshot);
			(0, react.useEffect)(() => {
				props.load(currentSessionId, currentAddressed);
			}, [
				currentSessionId,
				currentAddressed,
				props.load
			]);
			const rows = options(state.groups);
			const defaultValue = state.defaultSelection === null ? "" : `${state.defaultSelection.provider}/${state.defaultSelection.model}`;
			const currentValue = state.currentSelection === null ? "" : `${state.currentSelection.provider}/${state.currentSelection.model}`;
			const choose = (value) => rows.find((row) => `${row.selection.provider}/${row.selection.model}` === value)?.selection;
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ModelsSection_module_css_default.modelSelectionPanel,
				"aria-labelledby": "control-center-model-selection-title",
				children: [
					(0, react_jsx_runtime.jsx)("h3", {
						id: "control-center-model-selection-title",
						className: ModelsSection_module_css_default.modelSelectionTitle,
						children: props.t("selectionTitle")
					}),
					state.error === null ? null : (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default.error,
						role: "alert",
						children: state.error
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: ModelsSection_module_css_default.field,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: ModelsSection_module_css_default.fieldLabel,
								children: props.t("defaultModel")
							}),
							(0, react_jsx_runtime.jsxs)("select", {
								className: `${ModelsSection_module_css_default.input} ${ModelsSection_module_css_default.selectInput}`,
								value: defaultValue,
								disabled: state.status === "loading" || state.status === "saving" || rows.length === 0,
								onChange: (event) => {
									const selection = choose(event.target.value);
									if (selection !== void 0) props.controller.saveDefault(selection);
								},
								children: [(0, react_jsx_runtime.jsx)("option", {
									value: "",
									children: props.t("modelUnset")
								}), rows.map((row) => (0, react_jsx_runtime.jsx)("option", {
									value: `${row.selection.provider}/${row.selection.model}`,
									children: row.label
								}, `${row.selection.provider}/${row.selection.model}`))]
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: ModelsSection_module_css_default.advancedHint,
								children: props.t("defaultModelHint")
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: ModelsSection_module_css_default.field,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: ModelsSection_module_css_default.fieldLabel,
								children: props.t("currentModel")
							}),
							currentSessionId === void 0 ? (0, react_jsx_runtime.jsx)("span", {
								className: ModelsSection_module_css_default.advancedHint,
								children: props.t("currentModelNone")
							}) : currentAddressed ? (0, react_jsx_runtime.jsx)("span", {
								className: ModelsSection_module_css_default.advancedHint,
								children: props.t("currentModelSubagent")
							}) : (0, react_jsx_runtime.jsxs)("select", {
								className: `${ModelsSection_module_css_default.input} ${ModelsSection_module_css_default.selectInput}`,
								value: currentValue,
								disabled: state.status === "loading" || state.status === "saving" || rows.length === 0,
								onChange: (event) => {
									const selection = choose(event.target.value);
									if (selection !== void 0) props.controller.selectCurrent(selection);
								},
								children: [(0, react_jsx_runtime.jsx)("option", {
									value: "",
									children: props.t("modelUnset")
								}), rows.map((row) => (0, react_jsx_runtime.jsx)("option", {
									value: `${row.selection.provider}/${row.selection.model}`,
									children: row.label
								}, `${row.selection.provider}/${row.selection.model}`))]
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: ModelsSection_module_css_default.advancedHint,
								children: props.t("currentModelHint")
							})
						]
					}),
					state.currentResult === "both-updated" ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default.savedNotice,
						role: "status",
						children: props.t("currentAndDefaultUpdated")
					}) : null,
					state.currentResult === "current-only" ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default.notice,
						role: "status",
						children: props.t("currentOnlyUpdated")
					}) : null,
					state.currentRoutable === false ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default.notice,
						children: props.t("modelUnroutable")
					}) : null
				]
			});
		}
		//#endregion
		//#region lib/types/client/ProviderEditor.js
		/**
		* One provider's editor card, hand-written per adapter family: the primary
		* field is a single write-only **API key** input (the page never asks for an
		* environment-variable name — a typed key stores through `credentials.set`
		* under the profile's reference, deriving `<ROUTE>_API_KEY` when the profile
		* has none. The pi-ai profile records that derivation as `apiKeyEnv` only when
		* a key is entered; a blank key materializes a reference-free profile for
		* provider-native authentication);
		* the collapsed 自定义设置 area carries the per-family extras (`baseURL` for
		* both families, DeepSeek's id/name/context-window model catalog, and the
		* display name and wire protocol of a pi-ai route the adapter does not ship —
		* the two fields the create card asked that route for, editable here for the
		* same reason).
		* Reasoning effort is deliberately absent: it is a per-MODEL capability, and
		* the models under one provider disagree about it, so a provider-scoped
		* control can only be set to a value some of them reject. The composer's
		* model picker offers each model its own levels; `settings.yaml` keeps the
		* profile field for a deployment that knows its route. Everything else stays
		* owned by `settings.yaml`. Profile edits land as minimal `settings.mutate`
		* path ops against the stored section — the card names only the fields it can
		* see instead of rebuilding the whole subtree from a partial descriptor.
		*/
		/** The public DeepSeek endpoint shown as the deepseek base-URL placeholder. */
		const DEEPSEEK_PUBLIC_BASE_URL = "https://api.deepseek.com";
		/** A user-section subtree as a plain draft object (absent → empty). */
		function draftAt(namespace, path) {
			const subtree = (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.user, path);
			if (typeof subtree !== "object" || subtree === null || Array.isArray(subtree)) return {};
			return structuredClone(subtree);
		}
		/**
		* The minimal path ops carrying `after` over `before`, both as the card sees
		* them. Only keys the card observed are named; fields absent from both sides
		* produce no op, which is why edits are path-addressed rather than a rebuilt
		* section.
		* @param base - path of the edited subtree inside the user section.
		* @param before - the subtree as loaded, or undefined when it is new.
		* @param after - the subtree as edited.
		* @returns ordered set/unset ops; empty when nothing changed.
		*/
		function pathOps(base, before, after) {
			const previous = typeof before === "object" && before !== null && !Array.isArray(before) ? before : {};
			const ops = [];
			for (const [key, value] of Object.entries(after)) {
				if (JSON.stringify(previous[key]) === JSON.stringify(value)) continue;
				ops.push({
					op: "set",
					path: [...base, key],
					value
				});
			}
			for (const key of Object.keys(previous)) if (!(key in after)) ops.push({
				op: "unset",
				path: [...base, key]
			});
			return ops;
		}
		/** The editor layout the owning namespace selects. */
		function layoutOf(ns) {
			if (ns === "llm-deepseek") return "deepseek";
			if (ns === "llm-pi-ai") return "pi-ai";
			return "unknown";
		}
		/** The credential reference this profile resolves keys through. */
		function refFor(namespace, path, provider) {
			const profile = (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.value, path);
			const named = typeof profile === "object" && profile !== null ? profile.apiKeyEnv : void 0;
			return typeof named === "string" && named.length > 0 ? named : deriveKeyRef(provider);
		}
		/**
		* Render one provider's editing card.
		* @param props - the addressed profile plus wire faces and copy.
		* @returns the editor card.
		*/
		function ProviderEditor(props) {
			const { namespace, settingsPath, api, t } = props;
			const [draft, setDraft] = (0, react.useState)(() => draftAt(namespace, settingsPath));
			const [keyDraft, setKeyDraft] = (0, react.useState)("");
			const [keyState, setKeyState] = (0, react.useState)(void 0);
			const [busy, setBusy] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)(void 0);
			const [committedOriginal, setCommittedOriginal] = (0, react.useState)(() => (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.user, settingsPath));
			const [expectedRevision, setExpectedRevision] = (0, react.useState)(() => namespace.revision);
			const root = (0, react.useMemo)(() => (0, _deepseek_ai_dsh_client_schema_form.rehydrateSchema)(namespace.schema), [namespace.schema]);
			const node = (0, react.useMemo)(() => (0, _deepseek_ai_dsh_client_schema_form.nodeAtPath)(root, settingsPath), [root, settingsPath]);
			const fallback = (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.value, settingsPath);
			const disabled = props.readOnly || busy;
			const layout = layoutOf(namespace.ns);
			const keyRef = refFor(namespace, settingsPath, props.provider);
			const protocols = (0, react.useMemo)(() => layout === "pi-ai" ? protocolChoices(namespace) : [], [layout, namespace]);
			(0, react.useEffect)(() => {
				let stale = false;
				setKeyState(void 0);
				api.credentials.describe({ refs: [keyRef] }).then((response) => {
					if (stale || !response.result.ok) return;
					setKeyState(response.result.value.credentials[keyRef]);
				}, () => void 0);
				return () => {
					stale = true;
				};
			}, [api.credentials, keyRef]);
			const stringAt = (source, key) => {
				const value = (0, _deepseek_ai_dsh_client_schema_form.getPath)(source, [key]);
				return typeof value === "string" && value.trim().length > 0 ? value : void 0;
			};
			const setField = (key, next) => {
				const value = next === void 0 || next.trim().length === 0 ? void 0 : next;
				setDraft((current) => value === void 0 ? (0, _deepseek_ai_dsh_client_schema_form.deletePath)(current, [key]) : (0, _deepseek_ai_dsh_client_schema_form.setPath)(current, [key], value));
			};
			const modelFailure = validateDeepSeekModels((0, _deepseek_ai_dsh_client_schema_form.getPath)(draft, ["models"]));
			const keyFailure = apiKeyFailure(keyDraft);
			const keyValue = keyDraft.trim();
			const shownKeyFailure = (props.credentialRequired === true && keyDraft.length > 0 && keyValue.length === 0 ? "keyRequired" : void 0) ?? keyFailure;
			const probeApi = stringAt(draft, "api") ?? stringAt(fallback, "api");
			const probeBaseURL = stringAt(draft, "baseURL") ?? stringAt(fallback, "baseURL");
			const probe = {
				settingsNs: namespace.ns,
				provider: props.provider,
				...probeBaseURL === void 0 ? {} : { baseURL: probeBaseURL },
				...probeApi === void 0 ? {} : { api: probeApi },
				...keyValue.length === 0 ? {} : { apiKey: keyValue }
			};
			/**
			* The write for this card, or a failure message. Every edit travels as
			* path ops against the STORED section: the draft comes from the redacted
			* descriptor, so a wholesale replace rebuilt from it could delete fields
			* outside the card. Ops name only the fields this card can see.
			*/
			const applyOnce = async () => {
				const ns = namespace.ns;
				const next = layout === "pi-ai" && stringAt(draft, "apiKeyEnv") === void 0 && stringAt(fallback, "apiKeyEnv") === void 0 && keyValue.length > 0 ? (0, _deepseek_ai_dsh_client_schema_form.setPath)(draft, ["apiKeyEnv"], keyRef) : draft;
				if (props.credentialOnly !== true) {
					const failure = validateDeepSeekModels((0, _deepseek_ai_dsh_client_schema_form.getPath)(next, ["models"]));
					/* v8 ignore next 3 -- unreachable from the card: the same failure disables submit */
					if (failure !== void 0) return `${t("model")} ${String(failure.index + 1)}: ${t(failure.key)}`;
				}
				/* v8 ignore next -- apply is only reachable from the rendered card, which required a resolved node */
				if (props.credentialOnly !== true && node !== void 0 && settingsPath.length === 0) {
					const sectionError = (0, _deepseek_ai_dsh_client_schema_form.validateDraft)(node, next);
					if (sectionError !== void 0) return sectionError;
				}
				const materializesNativeProfile = layout === "pi-ai" && fallback === void 0 && committedOriginal === void 0 && Object.keys(next).length === 0;
				const ops = props.credentialOnly === true ? [] : materializesNativeProfile ? [{
					op: "set",
					path: [...settingsPath],
					value: {}
				}] : pathOps(settingsPath, committedOriginal, next);
				if (ops.length > 0) {
					const response = await api.settings.mutate({
						ns,
						ops,
						expectedRevision
					});
					if (!response.result.ok) return response.result.error.code === "settings-conflict" ? t("conflict") : response.result.error.message;
					setCommittedOriginal((0, _deepseek_ai_dsh_client_schema_form.getPath)(response.result.value.user, settingsPath));
					setExpectedRevision(response.result.value.revision);
					setDraft(next);
				}
				if (keyValue.length > 0) {
					const stored = await api.credentials.set({
						ref: keyRef,
						value: keyValue
					});
					if (!stored.result.ok) return stored.result.error.message;
				}
				setKeyDraft("");
			};
			const apply = async () => {
				setBusy(true);
				setFailure(void 0);
				try {
					const failure = await applyOnce();
					if (failure !== void 0) {
						setFailure(failure);
						return;
					}
					props.onClose(true);
				} catch (error) {
					setFailure(messageOf$1(error));
				} finally {
					setBusy(false);
				}
			};
			if (node === void 0) return (0, react_jsx_runtime.jsx)("p", {
				className: ModelsSection_module_css_default["error"],
				children: `${props.provider}: unresolvable settings path`
			});
			const keyLocked = keyState?.writable === false;
			/**
			* The catalog beneath the user layer: what the composition entry pinned, or
			* else the schema default that `resolve` would supply. The effective value
			* cannot answer this — it still carries the stored override until the unset
			* is applied, so reading it would echo that override straight back the
			* moment reset drops it, leaving the rows unchanged until a reload.
			*/
			const inheritedModels = () => {
				return (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.base, [...settingsPath, "models"]) ?? (0, _deepseek_ai_dsh_client_schema_form.nodeAtPath)(root, [...settingsPath, "models"])?.meta.default;
			};
			/**
			* The curated fields of one known adapter family. The family arrives
			* narrowed so the per-family branches below are total: an unknown namespace
			* renders the hint instead and never reaches this body.
			*/
			const curatedFields = (family) => {
				const ownsIdentity = family === "pi-ai" && props.declared === true;
				const customModels = (0, _deepseek_ai_dsh_client_schema_form.getPath)(draft, ["models"]);
				const modelsOverridden = (0, _deepseek_ai_dsh_client_schema_form.hasPath)(draft, ["models"]);
				const models = modelDrafts(modelsOverridden ? customModels : inheritedModels());
				const defaultContextWindow = (0, _deepseek_ai_dsh_client_schema_form.getPath)(fallback, ["defaultContextWindow"]);
				const defaultMaxTokens = (0, _deepseek_ai_dsh_client_schema_form.getPath)(fallback, ["maxTokens"]);
				const keyPlaceholder = keyLocked ? t("keyEnvLocked") : keyState?.configured === true && props.credentialRequired !== true ? t("keyStored") : family === "pi-ai" ? t("keyPlaceholderNative") : t("keyPlaceholder");
				/** What both family editors take: the rows, whose layer owns them, and the two writes. */
				const catalogProps = {
					models,
					overridden: modelsOverridden,
					t,
					disabled,
					onChange: (next) => {
						setDraft((current) => (0, _deepseek_ai_dsh_client_schema_form.setPath)(current, ["models"], next));
					},
					onReset: () => {
						setDraft((current) => (0, _deepseek_ai_dsh_client_schema_form.deletePath)(current, ["models"]));
					}
				};
				return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
					className: ModelsSection_module_css_default["field"],
					children: [
						(0, react_jsx_runtime.jsx)("span", {
							className: ModelsSection_module_css_default["fieldLabel"],
							children: t("keyInput")
						}),
						(0, react_jsx_runtime.jsx)("input", {
							className: ModelsSection_module_css_default["input"],
							type: "password",
							autoComplete: "off",
							value: keyDraft,
							placeholder: keyPlaceholder,
							"aria-label": t("keyInput"),
							"aria-invalid": shownKeyFailure !== void 0,
							required: props.credentialRequired === true,
							autoFocus: props.autoFocusCredential === true,
							disabled: disabled || keyLocked,
							onChange: (event) => {
								setKeyDraft(event.target.value);
							}
						}),
						shownKeyFailure === void 0 ? null : (0, react_jsx_runtime.jsx)("p", {
							className: ModelsSection_module_css_default["error"],
							children: t(shownKeyFailure)
						})
					]
				}), props.credentialOnly === true ? null : (0, react_jsx_runtime.jsxs)("details", {
					className: ModelsSection_module_css_default["customized"],
					children: [(0, react_jsx_runtime.jsx)("summary", {
						className: ModelsSection_module_css_default["customizedSummary"],
						children: t("customized")
					}), (0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["customizedBody"],
						children: [
							ownsIdentity ? (0, react_jsx_runtime.jsxs)("div", {
								className: ModelsSection_module_css_default["field"],
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ModelsSection_module_css_default["fieldLabel"],
									children: t("customDisplayName")
								}), (0, react_jsx_runtime.jsx)("input", {
									className: ModelsSection_module_css_default["input"],
									type: "text",
									value: stringAt(draft, "displayName") ?? "",
									placeholder: stringAt((0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.base, settingsPath), "displayName") ?? props.provider,
									"aria-label": t("customDisplayName"),
									disabled,
									onChange: (event) => {
										setField("displayName", event.target.value);
									}
								})]
							}) : null,
							(0, react_jsx_runtime.jsxs)("div", {
								className: ModelsSection_module_css_default["field"],
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ModelsSection_module_css_default["fieldLabel"],
									children: t("baseUrl")
								}), (0, react_jsx_runtime.jsx)("input", {
									className: ModelsSection_module_css_default["input"],
									type: "text",
									value: stringAt(draft, "baseURL") ?? "",
									placeholder: family === "deepseek" ? DEEPSEEK_PUBLIC_BASE_URL : stringAt(fallback, "baseURL") ?? t("baseUrlDefault"),
									"aria-label": t("baseUrl"),
									disabled,
									onChange: (event) => {
										setField("baseURL", event.target.value === "" ? void 0 : event.target.value);
									}
								})]
							}),
							ownsIdentity ? (0, react_jsx_runtime.jsxs)("div", {
								className: ModelsSection_module_css_default["field"],
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ModelsSection_module_css_default["fieldLabel"],
									children: t("customApi")
								}), (0, react_jsx_runtime.jsxs)("select", {
									className: `${ModelsSection_module_css_default["input"]} ${ModelsSection_module_css_default["selectInput"]}`,
									value: probeApi ?? "",
									"aria-label": t("customApi"),
									disabled,
									onChange: (event) => {
										setField("api", event.target.value);
									},
									children: [probeApi === void 0 ? (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("customApiUnset")
									}) : null, protocols.map((choice) => (0, react_jsx_runtime.jsx)("option", {
										value: choice,
										children: choice
									}, choice))]
								})]
							}) : null,
							family === "deepseek" ? (0, react_jsx_runtime.jsx)(DeepSeekModelsEditor, {
								...catalogProps,
								defaultContextWindow: typeof defaultContextWindow === "number" ? defaultContextWindow : void 0,
								defaultMaxTokens: typeof defaultMaxTokens === "number" ? defaultMaxTokens : void 0
							}) : (0, react_jsx_runtime.jsx)(ModelListEditor, {
								...catalogProps,
								probe,
								probeBlocked: keyFailure,
								api
							})
						]
					})]
				})] });
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: props.credentialOnly === true ? ModelsSection_module_css_default["addBlock"] : ModelsSection_module_css_default["editor"],
				children: [
					props.hideTitle === true ? null : (0, react_jsx_runtime.jsxs)("div", {
						className: ModelsSection_module_css_default["editorHeader"],
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ModelsSection_module_css_default["editorTitle"],
							children: props.displayName
						}), props.provider !== props.displayName ? (0, react_jsx_runtime.jsx)("span", {
							className: ModelsSection_module_css_default["editorRoute"],
							children: props.provider
						}) : null]
					}),
					layout === "unknown" ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["advancedHint"],
						children: `${t("advancedHint")} (${namespace.ns})`
					}) : curatedFields(layout),
					failure !== void 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["error"],
						children: failure
					}) : null,
					props.credentialOnly === true || modelFailure === void 0 ? null : (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["advancedHint"],
						children: `${t("model")} ${String(modelFailure.index + 1)}: ${t(modelFailure.key)}`
					}),
					(0, react_jsx_runtime.jsx)(EditorFooter, {
						t,
						busy,
						submitDisabled: disabled || layout === "unknown" || props.credentialOnly !== true && modelFailure !== void 0 || shownKeyFailure !== void 0 || props.credentialRequired === true && keyValue.length === 0,
						submitLabel: props.submitLabel ?? "apply",
						submitBusyLabel: props.submitBusyLabel ?? "applying",
						...props.cancelLabel === void 0 ? {} : { cancelLabel: props.cancelLabel },
						onCancel: () => {
							props.onClose(false);
						},
						onSubmit: () => {
							apply();
						}
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/ModelsSection.js
		/**
		* Models settings section: the provider rows joined from the configurable
		* directory, settings namespaces, and credential states, with one editor
		* card at a time. Rows expose only confirmed API-key state through accessible
		* solid configured or missing dots. A whole-section provider without a
		* configured key renders as its open setup card instead of a row, but only in
		* the first-run posture — no provider on the page can serve requests yet — and
		* only until the user closes that card; the add flow is a card carrying the
		* dormant-provider select. Each card kind owns its own open state, so closing
		* one never discards a draft in another. Every mutation writes through the
		* wire, while a provider removal first requires confirmation; the page
		* re-renders from pushed invalidations or the post-apply reload.
		*/
		/** Render an editor for either the setup posture or an expanded provider row. */
		function renderProviderEditor({ target, ...props }) {
			return (0, react_jsx_runtime.jsx)(ProviderEditor, {
				provider: target.provider,
				displayName: target.displayName,
				settingsPath: target.settingsPath,
				...target.declared === true ? { declared: true } : {},
				...props
			});
		}
		/**
		* Remove one user-added provider and its page-managed credential. Credential
		* removal comes first so a second-step failure leaves the provider row visible
		* and the whole operation safely retryable; both unsets are idempotent.
		* The settings removal names the profile rather than rebuilding its whole
		* namespace from a partial view.
		* @param api - settings and credential wire faces.
		* @param controller - the page store to refresh.
		* @param target - the provider's settings address and optional managed credential.
		* @returns the failure message, or undefined once the write and reload landed.
		*/
		async function removeProviderProfile(api, controller, target) {
			try {
				if (target.credentialRef !== void 0) {
					const credential = await api.credentials.unset({ ref: target.credentialRef });
					if (!credential.result.ok) return credential.result.error.message;
				}
				const response = await api.settings.mutate({
					ns: target.settingsNs,
					ops: [{
						op: "unset",
						path: [...target.settingsPath]
					}]
				});
				if (!response.result.ok) return response.result.error.message;
			} catch (error) {
				return messageOf$1(error);
			}
			await controller.load();
		}
		/**
		* Whether a whole-section provider still needs its first key: an unconfigured
		* credential opens the setup card instead of showing a row. This is the
		* first-run posture alone — a user who can already reach some provider gets an
		* ordinary row with the missing-key dot, since nothing here is blocking them.
		* @param row - the joined provider row.
		* @param anyUsable - whether any joined row can already serve requests.
		* @returns whether to render the setup card.
		*/
		function needsSetup(row, anyUsable) {
			if (anyUsable) return false;
			if (row.entry.settingsPath.length > 0) return false;
			return row.credential?.configured !== true;
		}
		function targetOf(row) {
			const managedRef = deriveKeyRef(row.entry.provider);
			const credentialRef = row.apiKeyEnv === managedRef && row.credential?.configured === true && row.credential.writable ? managedRef : void 0;
			return {
				provider: row.entry.provider,
				displayName: row.entry.displayName,
				settingsNs: row.entry.settingsNs,
				settingsPath: row.entry.settingsPath,
				...credentialRef === void 0 ? {} : { credentialRef },
				...row.entry.declared === true ? { declared: true } : {}
			};
		}
		/** Stable visible and accessible identity for one provider target. */
		function providerTargetLabel(target) {
			return target.provider === target.displayName ? target.provider : `${target.displayName} (${target.provider})`;
		}
		/** Replace the one provider placeholder in localized destructive-action copy. */
		function providerCopy(template, target) {
			return template.replace("{provider}", () => providerTargetLabel(target));
		}
		/**
		* Render the Models section content column.
		* @param props - slot-delivered injected dependencies.
		* @returns the section, or null while the shell has not injected yet.
		*/
		function ModelsSection(props) {
			const { controller, useSnapshot, api, t, modelSelection } = props;
			if (controller === void 0 || useSnapshot === void 0 || api === void 0 || t === void 0 || modelSelection === void 0) return null;
			return (0, react_jsx_runtime.jsx)(Loaded, { injected: {
				controller,
				useSnapshot,
				api,
				t,
				modelSelection
			} });
		}
		function Loaded({ injected }) {
			const { controller, api, t, modelSelection } = injected;
			const state = injected.useSnapshot((snapshot) => snapshot);
			const [editing, setEditing] = (0, react.useState)(void 0);
			const [adding, setAdding] = (0, react.useState)(false);
			const [deleteTarget, setDeleteTarget] = (0, react.useState)(void 0);
			const [deleting, setDeleting] = (0, react.useState)(false);
			const [deleteFailure, setDeleteFailure] = (0, react.useState)(void 0);
			const [savedTarget, setSavedTarget] = (0, react.useState)(void 0);
			const [declaring, setDeclaring] = (0, react.useState)(false);
			const [dismissedSetup, setDismissedSetup] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const announceSaved = (target) => {
				controller.load().then(() => {
					setSavedTarget(target);
				});
			};
			const closeEditor = (changed, target) => {
				setEditing(void 0);
				setAdding(false);
				setDeclaring(false);
				if (changed) announceSaved(target);
			};
			/**
			* Close a setup card, which owns none of the state above: the row-editor,
			* add, and declare cards each own one of those, so clearing them here would
			* discard a draft the user opened beside this card. Dismissal is this card's
			* own — the provider falls back to an ordinary row for the rest of the
			* session, and reopens through Edit.
			*/
			const closeSetup = (changed, target) => {
				setDismissedSetup((previous) => /* @__PURE__ */ new Set([...previous, target.provider]));
				if (changed) announceSaved(target);
			};
			const closeDelete = () => {
				if (deleting) return;
				setDeleteTarget(void 0);
				setDeleteFailure(void 0);
			};
			const confirmDelete = () => {
				/* v8 ignore next -- the action only renders with a target and is disabled while a deletion is pending */
				if (deleteTarget === void 0 || deleting) return;
				setDeleting(true);
				setDeleteFailure(void 0);
				removeProviderProfile(api, controller, deleteTarget).then((failure) => {
					if (failure !== void 0) {
						setDeleteFailure(failure);
						return;
					}
					setDeleteTarget(void 0);
				}).finally(() => {
					setDeleting(false);
				});
			};
			if (state.status === "idle") controller.load();
			if (state.status === "error") {
				/* v8 ignore next -- an error status always carries text; the fallback satisfies the nullable type */
				const errorText = state.error ?? "";
				return (0, react_jsx_runtime.jsxs)("div", {
					className: ModelsSection_module_css_default["section"],
					children: [(0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["error"],
						children: `${t("loadFailed")}: ${errorText}`
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ModelsSection_module_css_default["secondaryButton"],
						onClick: () => {
							controller.load();
						},
						children: t("retry")
					})]
				});
			}
			const savedRow = savedTarget === void 0 ? void 0 : state.rows.find((row) => row.entry.provider === savedTarget.provider);
			const savedIdentity = savedRow === void 0 ? savedTarget : {
				provider: savedRow.entry.provider,
				displayName: savedRow.entry.displayName
			};
			const anyUsable = state.rows.some(providerUsable);
			const configured = state.rows.filter((row) => row.configured);
			const addable = state.rows.filter((row) => !row.configured && row.entry.settingsNs !== "");
			const addTarget = adding ? editing : void 0;
			const addNamespace = addTarget === void 0 ? void 0 : state.namespaces.get(addTarget.settingsNs);
			const protocols = protocolChoices(state.namespaces.get("llm-pi-ai"));
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ModelsSection_module_css_default["section"],
				children: [
					(0, react_jsx_runtime.jsx)("h2", {
						className: ModelsSection_module_css_default["title"],
						children: t("title")
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["intro"],
						children: t("intro")
					}),
					!state.writable && state.status === "ready" ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["notice"],
						children: t("readOnly")
					}) : null,
					savedIdentity === void 0 ? null : (0, react_jsx_runtime.jsx)("p", {
						className: ModelsSection_module_css_default["savedNotice"],
						role: "status",
						"aria-live": "polite",
						children: providerCopy(t("savedProvider"), savedIdentity)
					}),
					(0, react_jsx_runtime.jsx)("ul", {
						className: ModelsSection_module_css_default["rows"],
						children: configured.map((row) => {
							const target = targetOf(row);
							const namespace = state.namespaces.get(target.settingsNs);
							/* v8 ignore next -- the join marks a row configured only when its namespace resolved */
							if (namespace === void 0) return null;
							if (needsSetup(row, anyUsable) && !dismissedSetup.has(row.entry.provider)) return (0, react_jsx_runtime.jsx)("li", {
								className: ModelsSection_module_css_default["setupCard"],
								children: renderProviderEditor({
									target,
									namespace,
									api,
									t,
									readOnly: !state.writable,
									onClose: (changed) => {
										closeSetup(changed, target);
									}
								})
							}, row.entry.provider);
							const open = !adding && editing?.provider === row.entry.provider;
							const credentialConfigured = row.credential?.configured === true;
							const credentialMissing = !credentialConfigured && row.apiKeyEnv !== void 0 && row.credential?.configured === false;
							return (0, react_jsx_runtime.jsxs)("li", {
								className: ModelsSection_module_css_default["rowCard"],
								children: [(0, react_jsx_runtime.jsxs)("div", {
									className: ModelsSection_module_css_default["rowHead"],
									children: [(0, react_jsx_runtime.jsxs)("span", {
										className: ModelsSection_module_css_default["rowIdentity"],
										children: [
											(0, react_jsx_runtime.jsx)("span", {
												className: ModelsSection_module_css_default["rowName"],
												children: row.entry.displayName
											}),
											row.entry.declared === true ? (0, react_jsx_runtime.jsx)("span", {
												className: ModelsSection_module_css_default["rowTag"],
												children: t("customTag")
											}) : null,
											credentialConfigured ? (0, react_jsx_runtime.jsx)("span", {
												className: `${ModelsSection_module_css_default["credentialDot"]} ${ModelsSection_module_css_default["credentialDotConfigured"]}`,
												role: "img",
												"aria-label": t("credentialConfigured"),
												title: t("credentialConfigured")
											}) : credentialMissing ? (0, react_jsx_runtime.jsx)("span", {
												className: `${ModelsSection_module_css_default["credentialDot"]} ${ModelsSection_module_css_default["credentialDotMissing"]}`,
												role: "img",
												"aria-label": t("credentialMissing"),
												title: t("credentialMissing")
											}) : null
										]
									}), (0, react_jsx_runtime.jsxs)("span", {
										className: ModelsSection_module_css_default["rowActions"],
										children: [(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: ModelsSection_module_css_default["secondaryButton"],
											"aria-label": providerCopy(t("editProvider"), target),
											onClick: () => {
												setSavedTarget(void 0);
												setDeclaring(false);
												setAdding(false);
												setEditing(open ? void 0 : target);
											},
											children: t("edit")
										}), row.removable ? (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: ModelsSection_module_css_default["dangerButton"],
											"aria-label": providerCopy(t("removeProvider"), target),
											disabled: !state.writable,
											onClick: () => {
												setSavedTarget(void 0);
												setDeleteFailure(void 0);
												setDeleteTarget(target);
											},
											children: t("remove")
										}) : null]
									})]
								}), open ? renderProviderEditor({
									target,
									namespace,
									api,
									t,
									readOnly: !state.writable,
									onClose: (changed) => {
										closeEditor(changed, target);
									}
								}) : null]
							}, row.entry.provider);
						})
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: ModelsSection_module_css_default["addBlock"],
						children: addTarget !== void 0 && addNamespace !== void 0 ? (0, react_jsx_runtime.jsxs)("div", {
							className: ModelsSection_module_css_default["addCard"],
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: ModelsSection_module_css_default["field"],
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ModelsSection_module_css_default["fieldLabel"],
									children: t("provider")
								}), (0, react_jsx_runtime.jsx)("select", {
									className: `${ModelsSection_module_css_default["input"]} ${ModelsSection_module_css_default["selectInput"]}`,
									value: addTarget.provider,
									"aria-label": t("provider"),
									onChange: (event) => {
										const row = addable.find((candidate) => candidate.entry.provider === event.target.value);
										/* v8 ignore next -- the select only lists addable rows */
										if (row === void 0) return;
										setEditing(targetOf(row));
									},
									children: addable.map((row) => (0, react_jsx_runtime.jsx)("option", {
										value: row.entry.provider,
										children: row.entry.displayName
									}, row.entry.provider))
								})]
							}), (0, react_jsx_runtime.jsx)(ProviderEditor, {
								provider: addTarget.provider,
								displayName: addTarget.displayName,
								hideTitle: true,
								namespace: addNamespace,
								settingsPath: addTarget.settingsPath,
								api,
								t,
								readOnly: !state.writable,
								onClose: (changed) => {
									closeEditor(changed, addTarget);
								}
							}, addTarget.provider)]
						}) : declaring ? (0, react_jsx_runtime.jsx)("div", {
							className: ModelsSection_module_css_default["addCard"],
							children: (0, react_jsx_runtime.jsx)(CustomProviderCard, {
								taken: state.rows.map((row) => row.entry.provider),
								protocols,
								/* v8 ignore next -- the card only opens from a button disabled without this namespace */
								revision: state.namespaces.get("llm-pi-ai")?.revision ?? 0,
								api,
								t,
								readOnly: !state.writable,
								onClose: (changed) => {
									setDeclaring(false);
									if (changed) controller.load();
								}
							})
						}) : (0, react_jsx_runtime.jsxs)("div", {
							className: ModelsSection_module_css_default["addActions"],
							children: [(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: ModelsSection_module_css_default["addButton"],
								disabled: addable.length === 0 || !state.writable,
								onClick: () => {
									const first = addable[0];
									/* v8 ignore next -- the button is disabled while nothing is addable */
									if (first === void 0) return;
									setSavedTarget(void 0);
									setDeclaring(false);
									setAdding(true);
									setEditing(targetOf(first));
								},
								children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 14 }), t("add")]
							}), (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: ModelsSection_module_css_default["addButton"],
								disabled: protocols.length === 0 || !state.writable,
								onClick: () => {
									setSavedTarget(void 0);
									setAdding(false);
									setEditing(void 0);
									setDeclaring(true);
								},
								children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 14 }), t("customAdd")]
							})]
						})
					}),
					(0, react_jsx_runtime.jsx)(ModelSelectionPanel, { ...modelSelection }),
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: deleteTarget !== void 0,
						onClose: closeDelete,
						title: deleteTarget === void 0 ? "" : providerCopy(t("deleteTitle"), deleteTarget),
						closeLabel: t("close"),
						description: deleteTarget === void 0 ? "" : providerCopy(deleteTarget.credentialRef === void 0 ? t("deleteDescription") : t("deleteDescriptionWithCredential"), deleteTarget),
						className: ModelsSection_module_css_default["deleteDialog"],
						footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							autoFocus: true,
							disabled: deleting,
							onClick: closeDelete,
							children: t("cancel")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							className: ModelsSection_module_css_default["deleteConfirm"],
							disabled: deleting,
							onClick: confirmDelete,
							children: deleteTarget === void 0 ? "" : providerCopy(deleting ? t("deleting") : t("deleteConfirm"), deleteTarget)
						})] }),
						children: deleteFailure === void 0 ? null : (0, react_jsx_runtime.jsx)("p", {
							className: ModelsSection_module_css_default["error"],
							children: deleteFailure
						})
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\OnboardingModal.module.css.mjs
		const css$5 = ".C_CJ_a_dialog{width:min(600px,100%);padding:0}.C_CJ_a_content{box-sizing:border-box;flex-direction:column;max-height:calc(100vh - 48px);padding:28px;display:flex;overflow-y:auto}.C_CJ_a_title{color:var(--foreground);outline:none;margin:0;font-size:20px;font-weight:500;line-height:28px}.C_CJ_a_body{margin-top:20px}@media (width<=560px){.C_CJ_a_content{padding:24px}}";
		const tagId$5 = "@dsh-control-center/bundle/OnboardingModal.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var OnboardingModal_module_css_default = {
			"title": "C_CJ_a_title",
			"content": "C_CJ_a_content",
			"body": "C_CJ_a_body",
			"dialog": "C_CJ_a_dialog"
		};
		//#endregion
		//#region lib/types/client/OnboardingModal.js
		/** Shared modal chrome for every step registered by this onboarding plugin. */
		const ignoreImplicitDismiss = () => {};
		/**
		* Render a blocking onboarding dialog and keep the application root inert.
		* @param props.title - accessible and visible dialog title.
		* @param props.focusTitle - focus the title when the step has no form control.
		* @param props.children - step-owned body and actions.
		* @returns the body-portaled modal.
		*/
		function OnboardingModal({ title, focusTitle = false, children }) {
			const titleRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const appRoot = document.getElementById("root");
				if (appRoot === null) return;
				const previous = appRoot.inert;
				appRoot.inert = true;
				return () => {
					appRoot.inert = previous;
				};
			}, []);
			(0, react.useEffect)(() => {
				if (focusTitle) titleRef.current?.focus();
			}, [focusTitle]);
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				title,
				onClose: ignoreImplicitDismiss,
				headless: true,
				className: `${OnboardingModal_module_css_default.dialog} cc-surface`,
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: OnboardingModal_module_css_default.content,
					children: [(0, react_jsx_runtime.jsx)("h2", {
						ref: titleRef,
						className: OnboardingModal_module_css_default.title,
						tabIndex: focusTitle ? -1 : void 0,
						children: title
					}), (0, react_jsx_runtime.jsx)("div", {
						className: OnboardingModal_module_css_default.body,
						children
					})]
				})
			});
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\DeepSeekOnboardingDialog.module.css.mjs
		const css$4 = ".oxcHWa_description{color:var(--muted-foreground);margin:0;font-size:14px;line-height:24px}.oxcHWa_editor{margin-top:24px}@media (width<=560px){.oxcHWa_editor{margin-top:20px}}";
		const tagId$4 = "@dsh-control-center/bundle/DeepSeekOnboardingDialog.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var DeepSeekOnboardingDialog_module_css_default = {
			"description": "oxcHWa_description",
			"editor": "oxcHWa_editor"
		};
		//#endregion
		//#region lib/types/client/DeepSeekOnboardingDialog.js
		/**
		* Official-DeepSeek first-run step. Readiness comes from the same
		* provider/settings/credential join as the Models page: any provider the user
		* can already talk to ends the step, and only a user with none is offered the
		* official DeepSeek route. The step reuses that page's credential editor in
		* the onboarding plugin's shared modal, so the key is entered once.
		*/
		/* v8 ignore next 3 -- closed-union defaults only defend future source widening */
		function assertNever(_value) {
			throw new Error("unexpected DeepSeek onboarding state");
		}
		/**
		* Prompt a first-run user for the official DeepSeek credential while no
		* provider can serve requests and that credential is writable.
		* @param props - settings-shell owner state and Models feature dependencies.
		* @returns the onboarding modal or null when onboarding needs no intervention.
		*/
		function DeepSeekOnboardingDialog(props) {
			const { complete, controller, useModels, api, t } = props;
			const state = useModels((snapshot) => snapshot);
			const readiness = onboardingReadiness(state);
			(0, react.useEffect)(() => {
				if (state.status === "idle") controller.load();
			}, [controller, state.status]);
			(0, react.useEffect)(() => {
				if (readiness.kind === "adapter-absent" || readiness.kind === "provider-ready" || readiness.kind === "unavailable") complete();
			}, [complete, readiness.kind]);
			switch (readiness.kind) {
				case "loading":
				case "adapter-absent":
				case "provider-ready":
				case "unavailable": return null;
				case "credential-missing": break;
				/* v8 ignore next -- every current readiness variant is handled above */
				default: return assertNever(readiness);
			}
			const row = state.rows.find((candidate) => candidate.entry.provider === "deepseek-official" && candidate.entry.settingsNs === "llm-deepseek" && candidate.entry.settingsPath.length === 0);
			const namespace = state.namespaces.get("llm-deepseek");
			/* v8 ignore next 2 -- credential-missing is derived only from this exact joined row. */
			if (row === void 0 || namespace === void 0) return null;
			const finishCredential = (changed) => {
				if (!changed) {
					complete();
					return;
				}
				controller.load();
			};
			return (0, react_jsx_runtime.jsxs)(OnboardingModal, {
				title: t("onboardingTitle"),
				children: [(0, react_jsx_runtime.jsx)("p", {
					className: DeepSeekOnboardingDialog_module_css_default.description,
					children: t("onboardingDescription")
				}), (0, react_jsx_runtime.jsx)("div", {
					className: DeepSeekOnboardingDialog_module_css_default.editor,
					children: (0, react_jsx_runtime.jsx)(ProviderEditor, {
						provider: row.entry.provider,
						displayName: row.entry.displayName,
						namespace,
						settingsPath: row.entry.settingsPath,
						api,
						t,
						readOnly: false,
						hideTitle: true,
						credentialOnly: true,
						credentialRequired: true,
						autoFocusCredential: true,
						cancelLabel: "onboardingLater",
						submitLabel: "onboardingSave",
						submitBusyLabel: "onboardingSaving",
						onClose: finishCredential
					})
				})]
			});
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\WelcomeNotice.module.css.mjs
		const css$3 = ".RFswhG_copy{color:var(--muted-foreground);font-size:14px;line-height:24px}.RFswhG_copy p{margin:0}.RFswhG_copy p+p{margin-top:12px}.RFswhG_error{color:var(--error);margin:16px 0 0;font-size:14px;line-height:22px}.RFswhG_actions{justify-content:flex-end;margin-top:24px;display:flex}.RFswhG_primary{min-width:120px}@media (width<=560px){.RFswhG_primary{width:100%}}";
		const tagId$3 = "@dsh-control-center/bundle/WelcomeNotice.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var WelcomeNotice_module_css_default = {
			"error": "RFswhG_error",
			"copy": "RFswhG_copy",
			"actions": "RFswhG_actions",
			"primary": "RFswhG_primary"
		};
		//#endregion
		//#region lib/types/client/WelcomeNotice.js
		/** Product-wide, versioned internal-testing notice. */
		/**
		* Render the current notice until its exact copy version is acknowledged.
		* @param props - settings-shell owner state and welcome dependencies.
		* @returns the welcome modal or null while the step decides not to show.
		*/
		function WelcomeNotice(props) {
			const { complete, controller, useWelcome, t } = props;
			const state = useWelcome((snapshot) => snapshot);
			const finished = (0, react.useRef)(false);
			const finish = (0, react.useCallback)(() => {
				if (finished.current) return;
				finished.current = true;
				complete();
			}, [complete]);
			(0, react.useEffect)(() => {
				if (state.status === "idle") controller.load();
			}, [controller, state.status]);
			(0, react.useEffect)(() => {
				if (state.acknowledged) finish();
			}, [finish, state.acknowledged]);
			if (state.status === "idle" || state.status === "loading" || state.acknowledged) return null;
			const acknowledge = async () => {
				if (await controller.acknowledge()) finish();
			};
			const paragraphs = t("welcomeBody").split("\n\n");
			return (0, react_jsx_runtime.jsxs)(OnboardingModal, {
				title: t("welcomeTitle"),
				focusTitle: true,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: WelcomeNotice_module_css_default.copy,
						children: paragraphs.map((paragraph) => (0, react_jsx_runtime.jsx)("p", { children: paragraph }, paragraph))
					}),
					state.error === null ? null : (0, react_jsx_runtime.jsx)("p", {
						className: WelcomeNotice_module_css_default.error,
						role: "alert",
						children: t("welcomeError")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: WelcomeNotice_module_css_default.actions,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							className: WelcomeNotice_module_css_default.primary,
							disabled: state.status === "saving",
							onClick: () => {
								acknowledge();
							},
							children: t("welcomeContinue")
						})
					})
				]
			});
		}
		//#endregion
		//#region lib/types/onboarding-copy.js
		/** Durable settings namespace for product-wide GUI onboarding facts. */
		const WELCOME_NOTICE_SETTINGS_NAMESPACE = "ui-onboarding";
		/** Field storing the last welcome notice version the user acknowledged. */
		const WELCOME_NOTICE_ACK_FIELD = "welcomeNoticeVersion";
		/**
		* Bump only when the notice changes materially and every user should see it
		* again. The acknowledgement is compared for exact equality.
		*/
		const WELCOME_NOTICE_VERSION = "2026-08-13.1";
		/** The complete editable internal-testing notice in both supported GUI locales. */
		const WELCOME_NOTICE_COPY = {
			zh: {
				title: "内测声明",
				body: "DeepSeek Harness 目前的 0.1 版本仍处在面向 Harness 开发者进行测试的阶段，还有许多地方需要持续改进和打磨，希望听取广大开发者的反馈建议。预计 DeepSeek Harness 的核心插件以及基础 API 都会在接下来的一段时间内快速迭代、持续演化。\n\n我们期待与全球开发者一起，在开源、开放、可复用、可组合的基础设施之上，共同探索智能上限。欢迎全球 Harness 开发者加入 DSH 插件生态。",
				continueLabel: "继续"
			},
			en: {
				title: "Internal Testing Notice",
				body: "DeepSeek Harness 0.1 remains in testing for Harness developers. Many areas need further improvement, and we welcome feedback from the developer community. DeepSeek Harness's core plugins and foundational APIs will continue to evolve rapidly over the coming months.\n\nWe look forward to exploring the limits of intelligence with developers around the world, building on open-source, open, reusable, and composable infrastructure. We welcome Harness developers everywhere to join the DSH plugin ecosystem.",
				continueLabel: "Continue"
			}
		};
		//#endregion
		//#region lib/types/client/welcome-store.js
		/** Welcome-notice state, durable when the browser may use Host settings. */
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function acknowledgementOf(view) {
			if (typeof view.value !== "object" || view.value === null) return void 0;
			const value = view.value[WELCOME_NOTICE_ACK_FIELD];
			return typeof value === "string" ? value : void 0;
		}
		/** Coordinates durable Host acknowledgement or a process-local remote fallback. */
		var WelcomeNoticeStore = class {
			api;
			persistence;
			/** uSES-safe state source shared by the registered welcome step. */
			store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
				status: "idle",
				acknowledged: false,
				error: null
			});
			generation = 0;
			/**
			* @param api - settings wire face used for durable reads and writes.
			* @param persistence - remote browsers use memory because settings is loopback-only.
			*/
			constructor(api, persistence = "host") {
				this.api = api;
				this.persistence = persistence;
			}
			/** Load the acknowledgement from Host settings or initialize process-local state. */
			async load() {
				const generation = ++this.generation;
				if (this.persistence === "memory") {
					this.store.update((state) => {
						state.status = "ready";
						state.error = null;
					});
					return;
				}
				this.store.update((state) => {
					state.status = "loading";
					state.error = null;
				});
				try {
					const response = await this.api.settings.describe({});
					if (!response.result.ok) throw new Error(response.result.error.message);
					const view = response.result.value.namespaces.find((candidate) => candidate.ns === WELCOME_NOTICE_SETTINGS_NAMESPACE);
					if (view === void 0) throw new Error("welcome acknowledgement settings are unavailable");
					if (generation !== this.generation) return;
					this.store.update((state) => {
						state.status = "ready";
						state.acknowledged = acknowledgementOf(view) === WELCOME_NOTICE_VERSION;
						state.error = null;
					});
				} catch (error) {
					if (generation !== this.generation) return;
					this.store.update((state) => {
						state.status = "error";
						state.acknowledged = false;
						state.error = messageOf(error);
					});
				}
			}
			/**
			* Persist this copy version, or advance only this process for a remote browser.
			* @returns true when the selected persistence mode accepted the acknowledgement.
			*/
			async acknowledge() {
				const generation = ++this.generation;
				if (this.persistence === "memory") {
					this.store.update((state) => {
						state.status = "ready";
						state.acknowledged = true;
						state.error = null;
					});
					return true;
				}
				this.store.update((state) => {
					state.status = "saving";
					state.error = null;
				});
				try {
					const response = await this.api.settings.mutate({
						ns: WELCOME_NOTICE_SETTINGS_NAMESPACE,
						ops: [{
							op: "set",
							path: [WELCOME_NOTICE_ACK_FIELD],
							value: WELCOME_NOTICE_VERSION
						}]
					});
					if (!response.result.ok) throw new Error(response.result.error.message);
					if (generation === this.generation) this.store.update((state) => {
						state.status = "ready";
						state.acknowledged = true;
						state.error = null;
					});
					return true;
				} catch (error) {
					if (generation === this.generation) this.store.update((state) => {
						state.status = "error";
						state.acknowledged = false;
						state.error = messageOf(error);
					});
					return false;
				}
			}
		};
		/**
		* Refresh only after welcome state has left idle. A memory-mode load retains
		* acknowledgement so reconnect does not reopen a process-local notice.
		* @param controller - welcome state owner whose current status decides whether to load.
		*/
		function refreshWelcomeIfLoaded(controller) {
			if (controller.store.getSnapshot().status === "idle") return;
			controller.load();
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** Copy dictionaries for the Models settings section. */
		/** English strings (the key-set source of truth for this pair). */
		const en = {
			nav: "Models",
			title: "Models",
			intro: "Enter your API keys to use models from the following providers.",
			edit: "Edit",
			editProvider: "Edit {provider}",
			remove: "Delete",
			removeProvider: "Delete {provider}",
			deleteTitle: "Delete {provider}?",
			deleteDescription: "Deleting {provider} removes its configuration. Any credential it uses is managed elsewhere and will be kept.",
			deleteDescriptionWithCredential: "Deleting {provider} removes its configuration and stored API key.",
			deleteConfirm: "Delete {provider}",
			deleting: "Deleting {provider}…",
			add: "Add provider",
			provider: "Provider",
			close: "Close",
			cancel: "Cancel",
			apply: "Apply",
			applying: "Applying…",
			savedProvider: "Saved {provider}.",
			credentialConfigured: "API key configured",
			credentialMissing: "API key missing",
			readOnly: "The settings document is read-only in this deployment.",
			loadFailed: "Loading the provider directory failed",
			conflict: "Someone else changed these settings while this card was open. Close it and reopen to edit the current values.",
			retry: "Retry",
			keyInput: "API key",
			keyPlaceholder: "Enter your API key",
			keyPlaceholderNative: "Enter an API key, or leave blank to use environment authentication",
			keyStored: "Configured — enter a new value to replace",
			keyEnvLocked: "Provided by the launch environment (read-only)",
			customized: "Customized settings",
			baseUrl: "Base URL",
			baseUrlDefault: "Provider default",
			models: "Models",
			modelsInherited: "Using the adapter defaults",
			modelsCustomized: "Customized model catalog",
			resetModels: "Restore defaults",
			model: "Model",
			modelId: "Model ID",
			modelName: "Display name",
			modelNamePlaceholder: "Uses the model ID when empty",
			contextWindow: "Context window",
			contextWindowPlaceholder: "Uses the provider default",
			maxTokens: "Max output tokens",
			maxTokensPlaceholder: "Uses the provider default",
			modelAdvanced: "Capacities",
			addModel: "Add model",
			removeModel: "Delete model",
			modelsEmpty: "No models will be shown in the selector. Unlisted IDs can still be sent directly.",
			keyBlank: "Enter the API key, or leave the field empty to keep the stored one.",
			keyBlankNew: "Enter the API key, or leave the field empty if this provider authenticates another way.",
			keyIllegalCharacters: "This API key is not in a valid format. Please check it.",
			modelIdRequired: "Model ID is required.",
			modelIdDuplicate: "Model ID must be unique.",
			modelNameInvalid: "Display name cannot be empty.",
			modelContextInvalid: "Context window must be a positive count, like 131072, 256K, or 1M.",
			modelMaxTokensInvalid: "Max output tokens must be a positive count, like 8192, 64K, or 1M.",
			advancedHint: "Other fields live in settings.yaml; edit that section directly.",
			modelCapacityInvalid: "A capacity must be a number, optionally suffixed K or M.",
			modelDuplicate: "Each model ID may appear once.",
			modelContextWindow: "Context window",
			modelMaxTokens: "Max output tokens",
			fetchModels: "Fetch available models",
			fetching: "Asking the provider…",
			fetchNeedsBaseUrl: "Enter the base URL first, then fetch.",
			fetchEmpty: "The provider listed no models. Add them by hand.",
			fetchTitle: "Choose models to add",
			fetchDescription: "These are the models this provider has available. Choose the ones to add.",
			fetchAdopt: "Add selected",
			customAdd: "Add a custom provider",
			customTitle: "Custom provider",
			customTag: "Custom",
			customRoute: "Provider ID",
			customRouteHint: "Lowercase identifier, starting with a letter, that uniquely names this provider in requests and as its credential name.",
			customRouteInvalid: "Start with a lowercase letter; then lowercase letters, digits, and dashes.",
			customRouteTaken: "A provider already uses this ID.",
			customDisplayName: "Display name",
			customApi: "API protocol",
			customApiUnset: "Not selected",
			customNeedsBaseUrl: "A custom provider needs a base URL.",
			customNeedsModels: "A custom provider needs at least one model.",
			create: "Create provider",
			creating: "Creating…",
			welcomeTitle: WELCOME_NOTICE_COPY.en.title,
			welcomeBody: WELCOME_NOTICE_COPY.en.body,
			welcomeContinue: WELCOME_NOTICE_COPY.en.continueLabel,
			welcomeError: "The acknowledgement could not be saved. Please try again.",
			onboardingTitle: "Add an API key to get started",
			onboardingDescription: "Configure the official DeepSeek provider to start building.",
			onboardingLater: "Configure later",
			onboardingSave: "Save and continue",
			onboardingSaving: "Saving…",
			keyRequired: "Enter an API key to continue.",
			selectionTitle: "Model selection",
			defaultModel: "Default model for future sessions",
			defaultModelHint: "Used when a newly created session has not logged its own model route.",
			currentModel: "Current session model",
			currentModelHint: "DSH rc.7 also tries to save a current-session switch as the future default.",
			currentModelNone: "No current session. Open a workspace to select a current model.",
			currentModelSubagent: "Addressed subagent sessions inherit their direct-parent continuation route and cannot switch here.",
			currentAndDefaultUpdated: "The current session and future default now use this model.",
			currentOnlyUpdated: "The current session changed, but the future default was not confirmed. Retry it above.",
			modelUnroutable: "The selected route is unavailable. Model selection remains enabled for recovery.",
			modelUnset: "Select a model"
		};
		/** Chinese strings (same keys as {@link en}). */
		const zh = {
			nav: "模型",
			title: "模型",
			intro: "填入各提供方的 API 密钥即可使用其模型。",
			edit: "编辑",
			editProvider: "编辑 {provider}",
			remove: "删除",
			removeProvider: "删除 {provider}",
			deleteTitle: "删除 {provider}？",
			deleteDescription: "删除 {provider} 会移除其配置；其使用的凭证（如有）由其他位置管理，将会保留。",
			deleteDescriptionWithCredential: "删除 {provider} 会移除其配置和存储的 API 密钥。",
			deleteConfirm: "删除 {provider}",
			deleting: "正在删除 {provider}…",
			add: "添加提供方",
			provider: "提供方",
			close: "关闭",
			cancel: "取消",
			apply: "保存",
			applying: "保存中…",
			savedProvider: "已保存 {provider}。",
			credentialConfigured: "API 密钥已配置",
			credentialMissing: "API 密钥缺失",
			readOnly: "当前部署的设置文档为只读。",
			loadFailed: "加载提供方目录失败",
			conflict: "这张卡片打开期间，这些设置已被其他地方改动。请关闭后重新打开，在当前值上编辑。",
			retry: "重试",
			keyInput: "API 密钥",
			keyPlaceholder: "输入 API 密钥",
			keyPlaceholderNative: "输入 API 密钥，或留空使用环境认证",
			keyStored: "已配置——输入新值可替换",
			keyEnvLocked: "由启动环境提供（只读）",
			customized: "自定义设置",
			baseUrl: "API 地址",
			baseUrlDefault: "提供方默认",
			models: "模型目录",
			modelsInherited: "正在使用适配器默认模型",
			modelsCustomized: "已自定义模型目录",
			resetModels: "恢复默认模型",
			model: "模型",
			modelId: "模型 ID",
			modelName: "显示名称",
			modelNamePlaceholder: "留空时使用模型 ID",
			contextWindow: "上下文窗口",
			contextWindowPlaceholder: "使用提供方默认值",
			maxTokens: "最大输出 token 数",
			maxTokensPlaceholder: "使用提供方默认值",
			modelAdvanced: "容量",
			addModel: "添加模型",
			removeModel: "删除模型",
			modelsEmpty: "模型选择器中将不显示任何模型；目录外 ID 仍可直接发送。",
			keyBlank: "请输入 API 密钥；留空则保持已存储的密钥。",
			keyBlankNew: "请输入 API 密钥；若该提供方以其他方式鉴权，可以留空。",
			keyIllegalCharacters: "该 API 密钥格式错误，请检查。",
			modelIdRequired: "模型 ID 不能为空。",
			modelIdDuplicate: "模型 ID 不能重复。",
			modelNameInvalid: "显示名称不能为空。",
			modelContextInvalid: "上下文窗口必须是正数，例如 131072、256K 或 1M。",
			modelMaxTokensInvalid: "最大输出 token 数必须是正数，例如 8192、64K 或 1M。",
			advancedHint: "其余字段在 settings.yaml 中，请直接编辑对应段。",
			modelCapacityInvalid: "容量需为数字，可加 K 或 M 后缀。",
			modelDuplicate: "每个模型 ID 只能出现一次。",
			modelContextWindow: "上下文窗口",
			modelMaxTokens: "最大输出 token",
			fetchModels: "获取可用模型",
			fetching: "正在询问提供方…",
			fetchNeedsBaseUrl: "请先填写 API 地址，再获取。",
			fetchEmpty: "该提供方没有列出任何模型，请手动添加。",
			fetchTitle: "选择要添加的模型",
			fetchDescription: "以下是模型提供方的可用模型，勾选要添加的模型。",
			fetchAdopt: "添加所选",
			customAdd: "添加自定义提供方",
			customTitle: "自定义提供方",
			customTag: "自定义",
			customRoute: "Provider ID",
			customRouteHint: "以小写字母开头的标识，在请求中唯一标识该提供方，并用于派生凭据名。",
			customRouteInvalid: "需以小写字母开头，之后可用小写字母、数字和短横线。",
			customRouteTaken: "已有提供方使用了这个 ID。",
			customDisplayName: "显示名称",
			customApi: "API 协议",
			customApiUnset: "未选择",
			customNeedsBaseUrl: "自定义提供方需要填写 API 地址。",
			customNeedsModels: "自定义提供方至少需要一个模型。",
			create: "创建提供方",
			creating: "创建中…",
			welcomeTitle: WELCOME_NOTICE_COPY.zh.title,
			welcomeBody: WELCOME_NOTICE_COPY.zh.body,
			welcomeContinue: WELCOME_NOTICE_COPY.zh.continueLabel,
			welcomeError: "暂时无法保存确认状态，请重试。",
			onboardingTitle: "添加一个 API Key 开始使用",
			onboardingDescription: "配置 DeepSeek 官方模型，即可开始使用。",
			onboardingLater: "稍后配置",
			onboardingSave: "保存并继续",
			onboardingSaving: "保存中…",
			keyRequired: "请输入 API 密钥后继续。",
			selectionTitle: "模型选择",
			defaultModel: "未来会话的默认模型",
			defaultModelHint: "新建会话尚未记录自己的模型路由时使用。",
			currentModel: "当前会话模型",
			currentModelHint: "DSH rc.7 切换当前会话时，还会尝试把同一选择保存为未来默认。",
			currentModelNone: "当前没有会话。连接工作区后可选择当前模型。",
			currentModelSubagent: "已寻址的子代理会话沿用直接父会话的续接路由，不能在此切换。",
			currentAndDefaultUpdated: "当前会话和未来默认均已使用该模型。",
			currentOnlyUpdated: "当前会话已切换，但未确认未来默认；请在上方重试。",
			modelUnroutable: "当前选择的路由不可用；模型选择入口保持可用以便恢复。",
			modelUnset: "选择模型"
		};
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\ProductWorkspaceNavItem.module.css.mjs
		const css$2 = ".UFuZ_q_item{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);min-width:36px;height:36px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;border-radius:10px;justify-content:center;align-items:center;gap:7px;padding:0;display:inline-flex;box-shadow:0 4px 18px #00000014}.UFuZ_q_item[data-wide]{justify-content:flex-start;min-width:124px;padding:0 12px}.UFuZ_q_item:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.UFuZ_q_item[data-active]{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}.UFuZ_q_item:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}";
		const tagId$2 = "@dsh-control-center/bundle/ProductWorkspaceNavItem.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var ProductWorkspaceNavItem_module_css_default = { "item": "UFuZ_q_item" };
		//#endregion
		//#region lib/types/client/ProductWorkspaceNavItem.js
		function WorkspaceIcon$1({ id }) {
			if (id === "translation") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconGlobeOutline14, { size: 16 });
			if (id === "painting") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, { size: 16 });
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, { size: 16 });
		}
		/** Render one product-workspace navigation action. */
		function ProductWorkspaceNavItem({ id, label, wide, activeId, select }) {
			const active = activeId === id;
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ProductWorkspaceNavItem_module_css_default.item,
				"data-active": active || void 0,
				"data-wide": wide || void 0,
				"aria-label": label,
				"aria-pressed": active,
				onClick: () => {
					select(id);
				},
				children: [(0, react_jsx_runtime.jsx)(WorkspaceIcon$1, { id }), wide ? (0, react_jsx_runtime.jsx)("span", { children: label }) : null]
			});
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\ProductWorkspaceSurface.module.css.mjs
		const css$1 = ".mzcFbW_root{min-width:0;min-height:0;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);flex-direction:column;flex:1;padding:28px;display:flex}.mzcFbW_header{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:flex-start;gap:18px;padding-bottom:20px;display:flex}.mzcFbW_identity{align-items:center;gap:12px;display:flex}.mzcFbW_icon{background:var(--dsw-alias-interactive-bg-active);border-radius:12px;justify-content:center;align-items:center;width:42px;height:42px;display:inline-flex}.mzcFbW_header h1{margin:4px 0 0;font-size:28px;line-height:1.2}.mzcFbW_eyebrow{color:var(--dsw-alias-label-tertiary);text-transform:uppercase;letter-spacing:.08em;margin:0;font-size:12px}.mzcFbW_close{border:1px solid var(--dsw-alias-border-l2);min-height:34px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border-radius:10px;padding:0 14px}.mzcFbW_body{border:1px dashed var(--dsw-alias-border-l2);max-width:720px;color:var(--dsw-alias-label-secondary);border-radius:14px;margin-top:32px;padding:24px;line-height:1.7}@media (width<=760px){.mzcFbW_root{padding:18px}.mzcFbW_header{align-items:center}.mzcFbW_header h1{font-size:23px}}";
		const tagId$1 = "@dsh-control-center/bundle/ProductWorkspaceSurface.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ProductWorkspaceSurface_module_css_default = {
			"root": "mzcFbW_root",
			"header": "mzcFbW_header",
			"eyebrow": "mzcFbW_eyebrow",
			"close": "mzcFbW_close",
			"body": "mzcFbW_body",
			"icon": "mzcFbW_icon",
			"identity": "mzcFbW_identity"
		};
		//#endregion
		//#region lib/types/client/ProductWorkspaceSurface.js
		function WorkspaceIcon({ id }) {
			if (id === "translation") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconGlobeOutline14, { size: 22 });
			if (id === "painting") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, { size: 22 });
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, { size: 22 });
		}
		/** Render the capability-owned product workspace frame. */
		function ProductWorkspaceSurface({ id, title, description, closeLabel, close }) {
			return (0, react_jsx_runtime.jsxs)("main", {
				className: ProductWorkspaceSurface_module_css_default.root,
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: ProductWorkspaceSurface_module_css_default.header,
					children: [(0, react_jsx_runtime.jsxs)("div", {
						className: ProductWorkspaceSurface_module_css_default.identity,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ProductWorkspaceSurface_module_css_default.icon,
							children: (0, react_jsx_runtime.jsx)(WorkspaceIcon, { id })
						}), (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("p", {
							className: ProductWorkspaceSurface_module_css_default.eyebrow,
							children: "DSH Control Center"
						}), (0, react_jsx_runtime.jsx)("h1", { children: title })] })]
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ProductWorkspaceSurface_module_css_default.close,
						onClick: close,
						children: closeLabel
					})]
				}), (0, react_jsx_runtime.jsx)("section", {
					className: ProductWorkspaceSurface_module_css_default.body,
					children: (0, react_jsx_runtime.jsx)("p", { children: description })
				})]
			});
		}
		//#endregion
		//#region \0dsh-control-center-css:D:\Github_Open\dsh-control-center\packages\control-center\src\client\TranslationWorkspace.module.css.mjs
		const css = "._8lesPa_root{background:var(--background);min-width:0;min-height:0;color:var(--foreground);flex-direction:column;flex:1;gap:16px;padding:24px;display:flex;overflow:auto}._8lesPa_header{justify-content:space-between;align-items:center;gap:16px;display:flex}._8lesPa_header h1{margin:2px 0 0;font-size:28px}._8lesPa_eyebrow{color:var(--foreground-tertiary);letter-spacing:.08em;text-transform:uppercase;margin:0;font-size:12px}._8lesPa_toolbar{border:1px solid var(--border-subtle);border-radius:12px;flex-wrap:wrap;align-items:center;gap:8px;padding:12px;display:flex}._8lesPa_toolbar select{border:1px solid var(--border);background:var(--background);min-height:34px;color:inherit;border-radius:9px;padding:0 10px}._8lesPa_toolbar select:last-child{max-width:260px;margin-left:auto}._8lesPa_swap{background:var(--muted);width:34px;height:34px;color:inherit;cursor:pointer;border:none;border-radius:50%}._8lesPa_panes{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;min-height:360px;display:grid}._8lesPa_pane{border:1px solid var(--border-subtle);background:var(--background);border-radius:14px;flex-direction:column;min-width:0;display:flex;overflow:hidden}._8lesPa_pane textarea{resize:none;box-sizing:border-box;width:100%;min-height:300px;color:inherit;font:inherit;background:0 0;border:none;outline:none;flex:1;padding:18px;line-height:1.65}._8lesPa_actions{border-top:1px solid var(--border-subtle);min-height:52px;color:var(--foreground-tertiary);justify-content:flex-end;align-items:center;gap:8px;padding:8px 12px;display:flex}._8lesPa_actions span{margin-right:auto}._8lesPa_actions button:not(._8lesPa_secondary),._8lesPa_pane ._8lesPa_actions>button:first-of-type{background:var(--primary);min-height:34px;color:var(--primary-foreground);cursor:pointer;border:none;border-radius:9px;padding:0 16px}._8lesPa_secondary{border:1px solid var(--border);min-height:34px;color:inherit;cursor:pointer;background:0 0;border-radius:9px;padding:0 12px}._8lesPa_secondary:disabled,._8lesPa_actions button:disabled{opacity:.45;cursor:not-allowed}._8lesPa_error{color:var(--foreground);background:var(--error-subtle);border-radius:9px;margin:0;padding:10px 12px}._8lesPa_history{padding-top:6px}._8lesPa_history h2{margin:0 0 10px;font-size:18px}._8lesPa_historyItem{border-top:1px solid var(--border-subtle);padding:14px 0}._8lesPa_historyItem>div{justify-content:space-between;gap:12px;display:flex}._8lesPa_historyItem time{color:var(--foreground-tertiary);font-size:12px}._8lesPa_historyItem p{white-space:pre-wrap;margin:7px 0;line-height:1.5}._8lesPa_historyItem p:nth-of-type(2){color:var(--muted-foreground)}._8lesPa_link{color:var(--primary);cursor:pointer;background:0 0;border:none;margin-right:12px;padding:0}._8lesPa_empty{color:var(--foreground-tertiary)}@media (width<=760px){._8lesPa_root{padding:14px}._8lesPa_panes{grid-template-columns:1fr}._8lesPa_toolbar select:last-child{margin-left:0}}";
		const tagId = "@dsh-control-center/bundle/TranslationWorkspace.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/bundle";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var TranslationWorkspace_module_css_default = {
			"secondary": "_8lesPa_secondary",
			"empty": "_8lesPa_empty",
			"panes": "_8lesPa_panes",
			"error": "_8lesPa_error",
			"root": "_8lesPa_root",
			"swap": "_8lesPa_swap",
			"link": "_8lesPa_link",
			"historyItem": "_8lesPa_historyItem",
			"pane": "_8lesPa_pane",
			"eyebrow": "_8lesPa_eyebrow",
			"toolbar": "_8lesPa_toolbar",
			"header": "_8lesPa_header",
			"actions": "_8lesPa_actions",
			"history": "_8lesPa_history"
		};
		//#endregion
		//#region lib/types/client/TranslationWorkspace.js
		function modelOptions(groups) {
			return groups.flatMap((group) => group.models.map((model) => ({
				value: `${group.id}/${model.id}`,
				label: `${group.name} · ${model.name}`,
				selection: {
					provider: group.id,
					model: model.id,
					...model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort }
				}
			})));
		}
		/** Full Translation product workspace over the Control Center Host service. */
		function TranslationWorkspace({ getTranslation, listModels, useTranslationReady, close }) {
			const translationReady = useTranslationReady((value) => value);
			const translation = translationReady ? getTranslation() : void 0;
			const [languages, setLanguages] = (0, react.useState)([]);
			const [sourceLanguage, setSourceLanguage] = (0, react.useState)("auto");
			const [targetLanguage, setTargetLanguage] = (0, react.useState)("zh-CN");
			const [models, setModels] = (0, react.useState)([]);
			const [selection, setSelection] = (0, react.useState)(null);
			const [input, setInput] = (0, react.useState)("");
			const [job, setJob] = (0, react.useState)(null);
			const [history, setHistory] = (0, react.useState)([]);
			const [nextCursor, setNextCursor] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const options = (0, react.useMemo)(() => modelOptions(models), [models]);
			const refreshHistory = async (cursor, append = false) => {
				const result = await translation.history(cursor, 20);
				if (!result.ok) throw new Error(result.error.message);
				setHistory((previous) => append ? [...previous, ...result.value.items] : result.value.items);
				setNextCursor(result.value.nextCursor ?? null);
			};
			(0, react.useEffect)(() => {
				if (!translationReady) return;
				let active = true;
				listModels().then((groups) => {
					if (!active) return;
					setModels(groups);
					setSelection((current) => current ?? modelOptions(groups)[0]?.selection ?? null);
				}).catch((reason) => {
					if (active) setError(reason instanceof Error ? reason.message : String(reason));
				});
				Promise.all([translation.languages(), translation.history(null, 20)]).then(([languageResult, historyResult]) => {
					if (!active) return;
					if (!languageResult.ok) throw new Error(languageResult.error.message);
					if (!historyResult.ok) throw new Error(historyResult.error.message);
					setLanguages(languageResult.value.source);
					setHistory(historyResult.value.items);
					setNextCursor(historyResult.value.nextCursor ?? null);
				}).catch((reason) => {
					if (active) setError(reason instanceof Error ? reason.message : String(reason));
				});
				return () => {
					active = false;
				};
			}, [
				listModels,
				translation,
				translationReady
			]);
			(0, react.useEffect)(() => {
				if (job?.status !== "running") return;
				const timer = window.setInterval(() => {
					translation.get(job.jobId).then((result) => {
						if (!result.ok) {
							setError(result.error.message);
							return;
						}
						setJob(result.value);
						if (result.value.status === "completed") refreshHistory(null).catch((reason) => {
							setError(String(reason));
						});
					});
				}, 250);
				return () => {
					window.clearInterval(timer);
				};
			}, [
				job?.jobId,
				job?.status,
				translation
			]);
			const translate = async () => {
				if (selection === null || input.trim() === "") return;
				setError(null);
				const result = await translation.start({
					sourceLanguage,
					targetLanguage,
					text: input,
					selection
				});
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				const view = await translation.get(result.value.jobId);
				if (!view.ok) {
					setError(view.error.message);
					return;
				}
				setJob(view.value);
			};
			const addLanguage = async () => {
				const id = window.prompt("Language id")?.trim();
				if (!id) return;
				const label = window.prompt("Language label", id)?.trim();
				if (!label) return;
				const result = await translation.putLanguage(id, label);
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				setLanguages((current) => [...current, result.value].sort((left, right) => left.label.localeCompare(right.label)));
			};
			if (!translationReady) return (0, react_jsx_runtime.jsx)("main", {
				className: ` cc-surface`,
				children: (0, react_jsx_runtime.jsx)("p", {
					role: "status",
					children: "正在连接翻译服务…"
				})
			});
			return (0, react_jsx_runtime.jsxs)("main", {
				className: ` cc-surface`,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: TranslationWorkspace_module_css_default.header,
						children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("p", {
							className: TranslationWorkspace_module_css_default.eyebrow,
							children: "DSH Control Center"
						}), (0, react_jsx_runtime.jsx)("h1", { children: "翻译" })] }), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: TranslationWorkspace_module_css_default.secondary,
							onClick: close,
							children: "返回对话"
						})]
					}),
					error === null ? null : (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						className: TranslationWorkspace_module_css_default.error,
						children: error
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: TranslationWorkspace_module_css_default.toolbar,
						children: [
							(0, react_jsx_runtime.jsx)("select", {
								"aria-label": "源语言",
								value: sourceLanguage,
								onChange: (event) => {
									setSourceLanguage(event.target.value);
								},
								children: languages.map((item) => (0, react_jsx_runtime.jsx)("option", {
									value: item.id,
									children: item.label
								}, item.id))
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: TranslationWorkspace_module_css_default.swap,
								onClick: () => {
									if (sourceLanguage === "auto") return;
									setSourceLanguage(targetLanguage);
									setTargetLanguage(sourceLanguage);
								},
								children: "⇄"
							}),
							(0, react_jsx_runtime.jsx)("select", {
								"aria-label": "目标语言",
								value: targetLanguage,
								onChange: (event) => {
									setTargetLanguage(event.target.value);
								},
								children: languages.filter((item) => item.id !== "auto").map((item) => (0, react_jsx_runtime.jsx)("option", {
									value: item.id,
									children: item.label
								}, item.id))
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: TranslationWorkspace_module_css_default.secondary,
								onClick: () => {
									addLanguage();
								},
								children: "管理语言"
							}),
							(0, react_jsx_runtime.jsx)("select", {
								"aria-label": "翻译模型",
								value: selection === null ? "" : `${selection.provider}/${selection.model}`,
								onChange: (event) => {
									setSelection(options.find((item) => item.value === event.target.value)?.selection ?? null);
								},
								children: options.map((item) => (0, react_jsx_runtime.jsx)("option", {
									value: item.value,
									children: item.label
								}, item.value))
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: TranslationWorkspace_module_css_default.panes,
						children: [(0, react_jsx_runtime.jsxs)("section", {
							className: TranslationWorkspace_module_css_default.pane,
							children: [(0, react_jsx_runtime.jsx)("textarea", {
								"aria-label": "待翻译文本",
								value: input,
								onChange: (event) => {
									setInput(event.target.value);
								},
								placeholder: "输入要翻译的内容"
							}), (0, react_jsx_runtime.jsxs)("div", {
								className: TranslationWorkspace_module_css_default.actions,
								children: [(0, react_jsx_runtime.jsxs)("span", { children: [input.length, " 字符"] }), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: selection === null || input.trim() === "" || job?.status === "running",
									onClick: () => {
										translate();
									},
									children: "翻译"
								})]
							})]
						}), (0, react_jsx_runtime.jsxs)("section", {
							className: TranslationWorkspace_module_css_default.pane,
							children: [
								(0, react_jsx_runtime.jsx)("textarea", {
									"aria-label": "翻译结果",
									readOnly: true,
									value: job?.output ?? "",
									placeholder: "翻译结果将在这里流式显示"
								}),
								job?.failure === void 0 ? null : (0, react_jsx_runtime.jsx)("p", {
									role: "alert",
									className: TranslationWorkspace_module_css_default.error,
									children: job.failure.message
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: TranslationWorkspace_module_css_default.actions,
									children: [
										(0, react_jsx_runtime.jsx)("span", { children: job?.status === "running" ? "翻译中…" : job?.status === "error" ? "失败" : job?.status === "cancelled" ? "已取消" : "" }),
										job?.status === "running" ? (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: TranslationWorkspace_module_css_default.secondary,
											onClick: () => {
												translation.cancel(job.jobId).then((result) => {
													if (result.ok) setJob(result.value);
												});
											},
											children: "取消"
										}) : null,
										(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: TranslationWorkspace_module_css_default.secondary,
											disabled: !job?.output,
											onClick: () => {
												navigator.clipboard.writeText(job?.output ?? "");
											},
											children: "复制"
										}),
										(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: TranslationWorkspace_module_css_default.secondary,
											disabled: !job?.output,
											onClick: () => {
												setInput(job?.output ?? "");
											},
											children: "替换原文"
										})
									]
								})
							]
						})]
					}),
					(0, react_jsx_runtime.jsxs)("aside", {
						className: TranslationWorkspace_module_css_default.history,
						children: [
							(0, react_jsx_runtime.jsx)("h2", { children: "翻译历史" }),
							history.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
								className: TranslationWorkspace_module_css_default.empty,
								children: "暂无历史"
							}) : history.map((item) => (0, react_jsx_runtime.jsxs)("article", {
								className: TranslationWorkspace_module_css_default.historyItem,
								children: [
									(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsxs)("strong", { children: [
										item.sourceLanguage,
										" → ",
										item.targetLanguage
									] }), (0, react_jsx_runtime.jsx)("time", { children: new Date(item.createdAt).toLocaleString() })] }),
									(0, react_jsx_runtime.jsx)("p", { children: item.sourceText }),
									(0, react_jsx_runtime.jsx)("p", { children: item.translatedText }),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: TranslationWorkspace_module_css_default.link,
										onClick: () => {
											setInput(item.sourceText);
											setSourceLanguage(item.sourceLanguage);
											setTargetLanguage(item.targetLanguage);
										},
										children: "复用"
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: TranslationWorkspace_module_css_default.link,
										onClick: () => {
											translation.deleteHistory(item.id).then((result) => {
												if (result.ok) setHistory((current) => current.filter((row) => row.id !== item.id));
											});
										},
										children: "删除"
									})
								]
							}, item.id)),
							nextCursor === null ? null : (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: TranslationWorkspace_module_css_default.secondary,
								onClick: () => {
									refreshHistory(nextCursor, true).catch((reason) => {
										setError(String(reason));
									});
								},
								children: "加载更多"
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/index.js
		const SHELL_NS = "control-center";
		const MODELS_NS = "control-center.models";
		const KNOWN_NATIVE = /* @__PURE__ */ new Set([
			"general",
			"agent-presets",
			"plugins"
		]);
		/** Cherry settings group mapping: models are core, capabilities/personal get
		* their own groups, DSH-owned sections stay native. */
		function groupOf(id) {
			if (id === "models") return "core";
			if (id === "general") return "personal";
			if (id === "skills" || id === "providers" || id === "mcp" || id === "websearch" || id === "file-processing" || id === "ocr") return "capabilities";
			if (KNOWN_NATIVE.has(id)) return "native";
			return "other";
		}
		const inject = [
			"slots",
			"locale",
			"connection",
			"remote",
			"sessions"
		];
		/** Register the settings shell, Provider/Model page, and onboarding steps. */
		function apply(ctx) {
			const remote = ctx.remote;
			let translation;
			const translationReadySource = {
				getSnapshot: () => translation !== void 0,
				subscribe: (listener) => {
					const timer = window.setInterval(() => {
						if (translation === void 0) return;
						window.clearInterval(timer);
						listener();
					}, 25);
					return () => {
						window.clearInterval(timer);
					};
				}
			};
			let painting;
			const paintingReadySource = {
				getSnapshot: () => painting !== void 0,
				subscribe: (listener) => {
					const timer = window.setInterval(() => {
						if (painting === void 0) return;
						window.clearInterval(timer);
						listener();
					}, 25);
					return () => {
						window.clearInterval(timer);
					};
				}
			};
			let knowledge;
			const knowledgeReadySource = {
				getSnapshot: () => knowledge !== void 0,
				subscribe: (listener) => {
					const timer = window.setInterval(() => {
						if (knowledge === void 0) return;
						window.clearInterval(timer);
						listener();
					}, 25);
					return () => {
						window.clearInterval(timer);
					};
				}
			};
			let skills;
			let providers;
			let mcp;
			let websearch;
			let repos;
			let fileProcessing;
			const reposReadySource = {
				getSnapshot: () => repos !== void 0,
				subscribe: (listener) => {
					const timer = window.setInterval(() => {
						if (repos === void 0) return;
						window.clearInterval(timer);
						listener();
					}, 25);
					return () => {
						window.clearInterval(timer);
					};
				}
			};
			ctx.effect(async () => {
				const controlCenterRemote = {
					package: "@dsh-control-center/control-center",
					descriptors: [
						...translationRemote.descriptors,
						...paintingRemote.descriptors,
						...knowledgeRemote.descriptors,
						...skillsRemote.descriptors,
						...providersRemote.descriptors,
						...mcpRemote.descriptors,
						...webSearchRemote.descriptors,
						...reposRemote.descriptors,
						...fileProcessingRemote.descriptors
					]
				};
				const dispose = await remote.$mount(controlCenterRemote);
				translation = ctx.get("remote.controlCenterTranslation");
				painting = ctx.get("remote.controlCenterPainting");
				knowledge = ctx.get("remote.controlCenterKnowledge");
				skills = ctx.get("remote.controlCenterSkills");
				providers = ctx.get("remote.controlCenterProviders");
				mcp = ctx.get("remote.controlCenterMcp");
				websearch = ctx.get("remote.controlCenterWebSearch");
				repos = ctx.get("remote.controlCenterRepos");
				fileProcessing = ctx.get("remote.controlCenterFileProcessing");
				return dispose;
			}, "control-center: control-center Remote namespaces");
			ctx.effect(() => ctx.locale.register(SHELL_NS, {
				zh: zh$1,
				en: en$1
			}), "control-center: shell dictionaries");
			ctx.effect(() => ctx.locale.register(MODELS_NS, {
				zh,
				en
			}), "control-center: model dictionaries");
			const shellT = ctx.locale.bind(SHELL_NS);
			const modelT = ctx.locale.bind(MODELS_NS);
			const connection = ctx.get("connection");
			const documentController = connection.isLoopback ? new SettingsDocumentStore(connection.api) : void 0;
			const documentInjected = documentController === void 0 ? void 0 : (() => {
				const useSnapshot = (0, _deepseek_ai_dsh_client_web_react.bindSnapshotSelector)(documentController.store);
				return () => ({
					controller: documentController,
					useSnapshot
				});
			})();
			const modelsController = new ModelsSettingsStore(connection.api);
			const useModels = (0, _deepseek_ai_dsh_client_web_react.bindSnapshotSelector)(modelsController.store);
			const selectionController = new ModelSelectionStore(connection.api);
			const useSelection = (0, _deepseek_ai_dsh_client_web_react.bindSnapshotSelector)(selectionController.store);
			const welcomeController = new WelcomeNoticeStore(connection.api, connection.isLoopback ? "host" : "memory");
			let rowsVersion = -1;
			let rowsRevision = -1;
			let rows = [];
			let onboardingVersion = -1;
			let onboardingSteps = [];
			const shellInjected = () => ({
				labels: {
					core: shellT("coreGroup"),
					capabilities: shellT("capabilitiesGroup"),
					personal: shellT("personalGroup"),
					native: shellT("nativeGroup"),
					other: shellT("otherGroup")
				},
				hooks: {
					sections: {
						getSnapshot: () => {
							const version = ctx.slots.getVersion("settings.section");
							const revision = ctx.locale.getSnapshot().revision;
							if (version !== rowsVersion || revision !== rowsRevision) {
								rowsVersion = version;
								rowsRevision = revision;
								rows = ctx.slots.entries("settings.section").map((entry) => ({
									id: entry.options.id ?? "",
									order: entry.options.order ?? 0,
									label: (0, _deepseek_ai_dsh_client_ui_slots.resolveSlotLabel)(entry.options.label) ?? "",
									group: groupOf(entry.options.id ?? "")
								})).sort((left, right) => left.order - right.order);
							}
							return rows;
						},
						subscribe: (listener) => {
							const offSlots = ctx.slots.subscribe("settings.section", listener);
							const offLocale = ctx.locale.subscribe(listener);
							return () => {
								offSlots();
								offLocale();
							};
						}
					},
					onboardingSteps: {
						getSnapshot: () => {
							const version = ctx.slots.getVersion("settings.onboarding");
							if (version !== onboardingVersion) {
								onboardingVersion = version;
								onboardingSteps = ctx.slots.entries("settings.onboarding").map((entry) => ({
									id: entry.options.id ?? "",
									order: entry.options.order ?? 0
								})).sort((left, right) => left.order - right.order);
							}
							return onboardingSteps;
						},
						subscribe: (listener) => ctx.slots.subscribe("settings.onboarding", listener)
					}
				}
			});
			const modelSelection = {
				controller: selectionController,
				useSnapshot: useSelection,
				useSessions: (0, _deepseek_ai_dsh_client_web_react.bindSnapshotSelector)(ctx.sessions.list),
				load: (sessionId, addressed) => {
					selectionController.load(sessionId, addressed);
				},
				t: modelT
			};
			const modelsInjected = () => ({
				controller: modelsController,
				useSnapshot: useModels,
				api: connection.api,
				modelSelection,
				t: modelT
			});
			const skillsInjected = () => ({ skills });
			const providersInjected = () => ({ providers });
			const mcpInjected = () => ({ mcp });
			const websearchInjected = () => ({ websearch });
			const deepSeekOnboardingInjected = () => ({
				controller: modelsController,
				hooks: { models: modelsController.store },
				api: connection.api,
				t: modelT
			});
			const welcomeInjected = () => ({
				controller: welcomeController,
				hooks: { welcome: welcomeController.store },
				t: modelT
			});
			ctx.effect(() => ctx.on("connection/reset", () => {
				refreshDocumentIfLoaded(documentController);
				refreshIfLoaded(modelsController);
				refreshWelcomeIfLoaded(welcomeController);
				const current = ctx.sessions.list.getSnapshot().current;
				selectionController.load(current);
			}), "control-center: connection invalidations");
			ctx.effect(() => {
				const refreshModels = () => {
					refreshIfLoaded(modelsController);
				};
				const disposers = [
					ctx.remote.$on("settings/document-updated", (namespace) => {
						refreshModels();
						if (namespace === "ui-onboarding") refreshWelcomeIfLoaded(welcomeController);
					}),
					ctx.remote.$on("credentials/updated", refreshModels),
					ctx.remote.$on("llm/adapters-updated", refreshModels)
				];
				return () => {
					for (const dispose of disposers) dispose();
				};
			}, "control-center: pushed invalidations");
			for (const workspace of [
				{
					id: "translation",
					order: 0,
					label: "workspaceTranslation",
					description: "workspaceTranslationDescription"
				},
				{
					id: "painting",
					order: 10,
					label: "workspacePainting",
					description: "workspacePaintingDescription"
				},
				{
					id: "knowledge",
					order: 20,
					label: "workspaceKnowledge",
					description: "workspaceKnowledgeDescription"
				},
				{
					id: "repo",
					order: 30,
					label: "workspaceRepo",
					description: "workspaceRepoDescription"
				}
			]) {
				ctx.slots.inject("application.navigation", () => ctx.slots.register({
					name: "application.navigation",
					id: workspace.id,
					order: workspace.order,
					label: () => shellT(workspace.label),
					inject: () => ({
						id: workspace.id,
						label: shellT(workspace.label)
					})
				}, ProductWorkspaceNavItem));
				if (workspace.id === "translation") ctx.slots.inject("application.surface", () => ctx.slots.register({
					name: "application.surface",
					key: "translation",
					inject: () => ({
						getTranslation: () => {
							if (translation === void 0) throw new Error("translation Remote namespace is not mounted");
							return translation;
						},
						hooks: { translationReady: translationReadySource },
						listModels: async () => {
							const result = await connection.api.llm.models({});
							if (!result.result.ok) throw new Error(result.result.error.message);
							return result.result.value.groups;
						}
					})
				}, TranslationWorkspace));
				else if (workspace.id === "painting") ctx.slots.inject("application.surface", () => ctx.slots.register({
					name: "application.surface",
					key: "painting",
					inject: () => ({
						getPainting: () => {
							if (painting === void 0) throw new Error("painting Remote namespace is not mounted");
							return painting;
						},
						hooks: { paintingReady: paintingReadySource }
					})
				}, PaintingWorkspace));
				else if (workspace.id === "knowledge") ctx.slots.inject("application.surface", () => ctx.slots.register({
					name: "application.surface",
					key: "knowledge",
					inject: () => ({
						getKnowledge: () => {
							if (knowledge === void 0) throw new Error("knowledge Remote namespace is not mounted");
							return knowledge;
						},
						hooks: { knowledgeReady: knowledgeReadySource }
					})
				}, KnowledgeWorkspace));
				else if (workspace.id === "repo") ctx.slots.inject("application.surface", () => ctx.slots.register({
					name: "application.surface",
					key: "repo",
					inject: () => ({
						getRepos: () => {
							if (repos === void 0) throw new Error("repos Remote namespace is not mounted");
							return repos;
						},
						hooks: { reposReady: reposReadySource }
					})
				}, RepoWorkspace));
				else ctx.slots.inject("application.surface", () => ctx.slots.register({
					name: "application.surface",
					key: workspace.id,
					inject: () => ({
						id: workspace.id,
						title: shellT(workspace.label),
						description: shellT(workspace.description),
						closeLabel: shellT("workspaceBack")
					})
				}, ProductWorkspaceSurface));
			}
			ctx.slots.inject("sidebar.settings", () => ctx.slots.register({
				name: "sidebar.settings",
				children: {
					"settings.trigger": {
						kind: "single",
						scope: "root"
					},
					"settings.header": {
						kind: "single",
						scope: "root"
					},
					"settings.action": {
						kind: "list",
						scope: "root"
					},
					"settings.close": {
						kind: "single",
						scope: "root"
					},
					"settings.section": {
						kind: "list",
						scope: "root"
					},
					"settings.onboarding": {
						kind: "list",
						scope: "root"
					}
				},
				inject: shellInjected
			}, SettingsRoot));
			ctx.slots.inject("settings.trigger", () => ctx.slots.register({
				name: "settings.trigger",
				locale: SHELL_NS
			}, TriggerContent));
			ctx.slots.inject("settings.header", () => ctx.slots.register({
				name: "settings.header",
				locale: SHELL_NS
			}, HeaderContent));
			if (documentInjected !== void 0) ctx.slots.inject("settings.action", () => ctx.slots.register({
				name: "settings.action",
				id: "open-document",
				order: 0,
				locale: SHELL_NS,
				inject: documentInjected
			}, SettingsDocumentAction));
			ctx.slots.inject("settings.close", () => ctx.slots.register({
				name: "settings.close",
				locale: SHELL_NS
			}, CloseLabel));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "general",
				order: 0,
				label: () => shellT("generalNav"),
				locale: SHELL_NS,
				children: { "settings.general.item": {
					kind: "list",
					scope: "root"
				} }
			}, GeneralSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "models",
				order: 10,
				label: () => modelT("nav"),
				inject: modelsInjected
			}, ModelsSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "skills",
				order: 20,
				label: () => "Skills",
				inject: skillsInjected
			}, SkillsSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "providers",
				order: 30,
				label: () => shellT("providersNav"),
				inject: providersInjected
			}, ProvidersSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "mcp",
				order: 40,
				label: () => "MCP",
				inject: mcpInjected
			}, McpSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "websearch",
				order: 50,
				label: () => shellT("webSearchNav"),
				inject: websearchInjected
			}, WebSearchSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "file-processing",
				order: 55,
				label: () => shellT("fileProcessingNav"),
				inject: () => ({
					feature: "document_to_markdown",
					title: shellT("fileProcessingTitle"),
					description: shellT("fileProcessingDescription"),
					service: fileProcessing
				})
			}, ProcessorSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "ocr",
				order: 60,
				label: () => shellT("ocrNav"),
				inject: () => ({
					feature: "image_to_text",
					title: shellT("ocrTitle"),
					description: shellT("ocrDescription"),
					service: fileProcessing
				})
			}, ProcessorSection));
			ctx.slots.inject("settings.onboarding", () => ctx.slots.register({
				name: "settings.onboarding",
				id: "welcome-notice",
				order: -100,
				inject: welcomeInjected
			}, WelcomeNotice));
			ctx.slots.inject("settings.onboarding", () => ctx.slots.register({
				name: "settings.onboarding",
				id: "deepseek-official",
				order: 0,
				inject: deepSeekOnboardingInjected
			}, DeepSeekOnboardingDialog));
		}
		function refreshIfLoaded(controller) {
			if (controller.store.getSnapshot().status !== "idle") controller.load();
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map