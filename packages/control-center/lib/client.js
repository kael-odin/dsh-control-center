window.__ModuleLoader__.load({
	id: "@dsh-control-center/control-center",
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
		const css$9 = "._4STY0G_trigger{box-sizing:border-box;cursor:pointer;width:calc(100% + 4px);height:42px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:12px;flex:none;align-items:center;gap:8px;margin:4px -2px;padding:0 10px 0 8px;font-family:inherit;font-size:14px;line-height:22px;display:flex;overflow:hidden}._4STY0G_trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}._4STY0G_trigger._4STY0G_rail{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;margin:8px 0 10px;padding:0}._4STY0G_triggerLabel{white-space:nowrap;overflow:hidden}._4STY0G_overlay{z-index:1000;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}._4STY0G_mask{background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur);position:absolute;inset:0}._4STY0G_panel{z-index:1;background:var(--dsw-alias-bg-layer-2);width:min(1080px,100vw - 48px);height:min(700px,100vh - 48px);box-shadow:var(--dsw-shadow-lv3);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:18px;display:flex;position:relative;overflow:hidden}._4STY0G_nav{box-sizing:border-box;border-right:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);flex-direction:column;flex:none;gap:12px;width:236px;padding:22px 14px 14px;display:flex}._4STY0G_navTitle{color:var(--dsw-alias-label-primary);padding:0 12px;font-size:16px;font-weight:500;line-height:24px}._4STY0G_navScroll{min-height:0;overflow-y:auto}._4STY0G_navGroup{border-top:1px solid var(--dsw-alias-border-l2);padding:8px 0}._4STY0G_navGroup:first-child{border-top:none;padding-top:0}._4STY0G_navGroupTitle{color:var(--dsw-alias-label-tertiary);text-transform:uppercase;letter-spacing:.04em;padding:4px 12px 6px;font-size:11px;font-weight:500;line-height:16px}._4STY0G_navList{flex-direction:column;gap:4px;display:flex}._4STY0G_navCell{box-sizing:border-box;cursor:pointer;height:40px;color:var(--dsw-alias-label-primary);text-align:left;background:0 0;border:none;border-radius:12px;align-items:center;gap:8px;padding:9px 16px 9px 12px;font-family:inherit;font-size:14px;font-weight:400;line-height:22px;display:flex}._4STY0G_navCell:hover{background:var(--dsw-specific-sidebar-nav-item-hover)}._4STY0G_navCell._4STY0G_active{background:var(--dsw-specific-sidebar-nav-item-active)}._4STY0G_navIcon{flex:none}._4STY0G_navLabel{white-space:nowrap;text-overflow:ellipsis;flex:1;min-width:0;overflow:hidden}._4STY0G_content{flex-direction:column;flex:1;min-width:0;display:flex}._4STY0G_header{box-sizing:border-box;flex:none;justify-content:space-between;align-items:flex-start;gap:8px;height:54px;padding:20px 14px 8px 10px;display:flex}._4STY0G_actions{justify-content:flex-end;align-items:center;gap:8px;min-width:0;margin-left:auto;display:flex}._4STY0G_close{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:28px;justify-content:center;align-items:center;padding:0;display:inline-flex}._4STY0G_close:hover{background:var(--dsw-alias-interactive-bg-hover)}._4STY0G_options{flex:1;min-height:0;padding:0 24px 24px;overflow:hidden}@media (width<=760px){._4STY0G_overlay{align-items:stretch}._4STY0G_panel{border-radius:0;width:100vw;height:100vh}._4STY0G_nav{width:176px;padding-inline:10px}}@media (width<=560px){._4STY0G_panel{flex-direction:column}._4STY0G_nav{border-right:none;border-bottom:1px solid var(--dsw-alias-border-l2);width:100%;max-height:42vh}._4STY0G_navGroup{padding-block:4px}._4STY0G_options{padding-inline:16px}}._4STY0G_hiddenLabel{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}";
		const tagId$9 = "@dsh-control-center/control-center/SettingsRoot.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId$9;
			tag.textContent = css$9;
			document.head.appendChild(tag);
		}
		var SettingsRoot_module_css_default = {
			"navCell": "_4STY0G_navCell",
			"overlay": "_4STY0G_overlay",
			"navGroupTitle": "_4STY0G_navGroupTitle",
			"navGroup": "_4STY0G_navGroup",
			"mask": "_4STY0G_mask",
			"content": "_4STY0G_content",
			"rail": "_4STY0G_rail",
			"navTitle": "_4STY0G_navTitle",
			"actions": "_4STY0G_actions",
			"nav": "_4STY0G_nav",
			"close": "_4STY0G_close",
			"navIcon": "_4STY0G_navIcon",
			"navList": "_4STY0G_navList",
			"hiddenLabel": "_4STY0G_hiddenLabel",
			"active": "_4STY0G_active",
			"triggerLabel": "_4STY0G_triggerLabel",
			"trigger": "_4STY0G_trigger",
			"panel": "_4STY0G_panel",
			"header": "_4STY0G_header",
			"navScroll": "_4STY0G_navScroll",
			"options": "_4STY0G_options",
			"navLabel": "_4STY0G_navLabel"
		};
		//#endregion
		//#region lib/types/client/SettingsRoot.js
		/** Cherry-style settings shell over DSH's additive settings slots. */
		const GROUPS = [
			"core",
			"native",
			"other"
		];
		function navIcon(id) {
			if (id === "models") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, {
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
					className: SettingsRoot_module_css_default.panel,
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
									children: [group === "core" ? null : (0, react_jsx_runtime.jsx)("div", {
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
		const css$8 = ".uIwUgq_triggerLabel{white-space:nowrap;overflow:hidden}";
		const tagId$8 = "@dsh-control-center/control-center/chrome.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$8) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId$8;
			tag.textContent = css$8;
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
		const css$7 = ".DFoDHW_section{flex-direction:column;width:100%;display:flex}.DFoDHW_section>[data-slot=\"settings.general.item\"]>:last-child{border-bottom:none}";
		const tagId$7 = "@dsh-control-center/control-center/GeneralSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId$7;
			tag.textContent = css$7;
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
		const css$6 = ".SgSrUG_action{align-items:center;gap:8px;min-width:0;display:flex}.SgSrUG_error{max-width:180px;color:var(--dsw-alias-state-error-primary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}";
		const tagId$6 = "@dsh-control-center/control-center/SettingsDocumentAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId$6;
			tag.textContent = css$6;
			document.head.appendChild(tag);
		}
		var SettingsDocumentAction_module_css_default = {
			"error": "SgSrUG_error",
			"action": "SgSrUG_action"
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
			nativeGroup: "DSH native",
			otherGroup: "DSH native / Other",
			openDocument: "Open configuration file",
			openDocumentError: "The configuration file could not be opened.",
			workspaceTranslation: "Translation",
			workspacePainting: "Painting",
			workspaceKnowledge: "Knowledge Base",
			workspaceBack: "Back to conversation",
			workspaceTranslationDescription: "Streaming translation, language management, and history are being connected to DSH model providers.",
			workspacePaintingDescription: "Image-generation jobs, model controls, the gallery, and file attachments are being connected.",
			workspaceKnowledgeDescription: "Ingestion, chunking, embeddings, retrieval, and agent tools are being connected."
		};
		const zh$1 = {
			trigger: "设置",
			title: "设置",
			close: "关闭设置",
			generalNav: "通用",
			coreGroup: "核心",
			nativeGroup: "DSH 原生",
			otherGroup: "DSH 原生／其他",
			openDocument: "打开配置文件",
			openDocumentError: "暂时无法打开配置文件。",
			workspaceTranslation: "翻译",
			workspacePainting: "绘画",
			workspaceKnowledge: "知识库",
			workspaceBack: "返回对话",
			workspaceTranslationDescription: "流式翻译、语言管理与历史能力正在接入 DSH 模型提供方。",
			workspacePaintingDescription: "图像生成任务、模型控件、画廊和文件附件能力正在接入。",
			workspaceKnowledgeDescription: "摄取、切分、Embedding、检索和 Agent 工具能力正在接入。"
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
		const css$5 = ".tKsOKa_section{width:100%;height:100%;color:var(--dsw-alias-label-primary);grid-template-rows:auto auto 1fr;grid-template-columns:260px minmax(0,1fr);gap:12px 20px;display:grid}.tKsOKa_title,.tKsOKa_intro,.tKsOKa_notice,.tKsOKa_savedNotice{grid-column:1/-1}.tKsOKa_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.tKsOKa_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}.tKsOKa_notice{color:var(--dsw-alias-state-warn-label);margin:0;font-size:12px;line-height:18px}.tKsOKa_savedNotice{color:var(--dsw-alias-state-success-primary);margin:0;font-size:12px;line-height:18px}.tKsOKa_rows{flex-direction:column;grid-area:3/1/span 2;gap:8px;min-height:0;margin:0;padding:0;list-style:none;display:flex;overflow-y:auto}.tKsOKa_rowCard{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:12px;padding:12px 14px;display:flex}.tKsOKa_rowHead{align-items:center;gap:10px;display:flex}.tKsOKa_rowIdentity{align-items:center;gap:6px;min-width:0;display:inline-flex}.tKsOKa_rowName{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.tKsOKa_rowTag{border:1px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary);border-radius:4px;flex:none;padding:1px 6px;font-size:11px;line-height:16px}.tKsOKa_credentialDot{box-sizing:border-box;border-radius:50%;flex:none;width:8px;height:8px;display:inline-block}.tKsOKa_credentialDotConfigured{background:var(--dsw-alias-state-success-primary)}.tKsOKa_credentialDotMissing{background:var(--dsw-alias-state-error-primary)}.tKsOKa_rowActions{align-items:center;gap:4px;margin-left:auto;display:inline-flex}.tKsOKa_primaryButton,.tKsOKa_secondaryButton,.tKsOKa_addButton{box-sizing:border-box;height:36px;font:inherit;cursor:pointer;border:none;border-radius:18px;justify-content:center;align-items:center;gap:4px;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.tKsOKa_primaryButton{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}.tKsOKa_primaryButton:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.tKsOKa_secondaryButton,.tKsOKa_addButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);background:0 0}.tKsOKa_secondaryButton:hover:not(:disabled),.tKsOKa_addButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.tKsOKa_secondaryButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-solid)}.tKsOKa_dangerButton{box-sizing:border-box;height:36px;color:var(--dsw-alias-state-error-primary);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:18px;justify-content:center;align-items:center;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.tKsOKa_dangerButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}.tKsOKa_rowActions .tKsOKa_secondaryButton,.tKsOKa_rowActions .tKsOKa_dangerButton{border-radius:14px;height:28px;padding:0 10px;font-size:12px;line-height:18px}.tKsOKa_primaryButton:disabled,.tKsOKa_secondaryButton:disabled,.tKsOKa_dangerButton:disabled,.tKsOKa_addButton:disabled,.tKsOKa_linkButton:disabled,.tKsOKa_addModelButton:disabled{opacity:.4;cursor:default}.tKsOKa_primaryButton:focus-visible,.tKsOKa_secondaryButton:focus-visible,.tKsOKa_dangerButton:focus-visible,.tKsOKa_addButton:focus-visible,.tKsOKa_linkButton:focus-visible,.tKsOKa_addModelButton:focus-visible,.tKsOKa_iconButton:focus-visible,.tKsOKa_customizedSummary:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3);outline:none}.tKsOKa_editor{background:var(--dsw-alias-bg-module-platform);border-radius:12px;flex-direction:column;gap:14px;padding:14px 16px;display:flex}.tKsOKa_editorHeader{align-items:baseline;gap:8px;display:flex}.tKsOKa_editorTitle{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.tKsOKa_editorRoute{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.tKsOKa_field{flex-direction:column;gap:6px;display:flex}.tKsOKa_fieldLabel{color:var(--dsw-alias-label-secondary);align-items:center;gap:10px;font-size:12px;font-weight:500;line-height:18px;display:inline-flex}.tKsOKa_linkButton{box-sizing:border-box;height:28px;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:14px;align-items:center;padding:0 10px;font-size:12px;line-height:18px;display:inline-flex}.tKsOKa_linkButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}.tKsOKa_advancedHint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.tKsOKa_editorActions{justify-content:flex-end;gap:8px;display:flex}.tKsOKa_addBlock{flex-direction:column;grid-area:4/1;gap:12px;display:flex}.tKsOKa_addActions{flex-wrap:wrap;gap:10px;display:flex}.tKsOKa_addButton{border:1px dashed var(--dsw-alias-border-l3);border-radius:12px;flex:1 1 0;gap:6px;min-width:180px;height:44px}.tKsOKa_addCard,.tKsOKa_setupCard{background:var(--dsw-alias-bg-module-platform);border-radius:12px;flex-direction:column;gap:14px;padding:14px 16px;list-style:none;display:flex}.tKsOKa_addCard .tKsOKa_editor,.tKsOKa_setupCard .tKsOKa_editor{background:0 0;padding:0}.tKsOKa_customized{border-top:1px solid var(--dsw-alias-border-l2);padding-top:10px}.tKsOKa_customizedSummary{cursor:pointer;width:fit-content;color:var(--dsw-alias-label-secondary);border-radius:6px;align-items:center;gap:6px;margin-left:-4px;padding:2px 4px;font-size:12px;font-weight:500;line-height:18px;list-style:none;display:flex}.tKsOKa_customizedSummary::-webkit-details-marker{display:none}.tKsOKa_customizedSummary:before{content:\"\";border-bottom:1.5px solid;border-right:1.5px solid;width:5px;height:5px;transition:transform .12s;transform:rotate(-45deg)translate(-1px,-1px)}.tKsOKa_customized[open]>.tKsOKa_customizedSummary:before{transform:rotate(45deg)translate(-1px,-1px)}.tKsOKa_customizedSummary:hover{color:var(--dsw-alias-label-primary)}.tKsOKa_customizedBody{flex-direction:column;gap:12px;padding-top:12px;display:flex}.tKsOKa_modelCatalog{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:10px;padding-top:12px;display:flex}.tKsOKa_modelCatalogHeading{flex-direction:column;gap:2px;display:flex}.tKsOKa_modelCatalogTitle{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px}.tKsOKa_modelCatalogMeta,.tKsOKa_modelEmpty{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.tKsOKa_modelList{flex-direction:column;gap:8px;display:flex}.tKsOKa_modelListHead{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.tKsOKa_modelEntry{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px}.tKsOKa_modelRow{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto auto;align-items:center;gap:6px;display:grid}.tKsOKa_iconButton{box-sizing:border-box;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;display:inline-flex}.tKsOKa_iconButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.tKsOKa_iconButton:disabled{cursor:default;opacity:.4}.tKsOKa_iconButtonDanger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}.tKsOKa_modelAdvanced{grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;padding:8px 4px 2px;display:grid}.tKsOKa_modelField{flex-direction:column;gap:4px;display:flex}.tKsOKa_modelFieldLabel{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.tKsOKa_modelEmpty{border:1px dashed var(--dsw-alias-border-l3);text-align:center;border-radius:8px;padding:12px}.tKsOKa_addModelButton{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);height:28px;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:0 0;border-radius:14px;align-self:flex-start;align-items:center;gap:4px;padding:0 10px;font-size:12px;line-height:18px;display:inline-flex}.tKsOKa_addModelButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.tKsOKa_input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:32px;font:inherit;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 10px;font-size:14px;line-height:22px}select.tKsOKa_input{cursor:pointer;max-width:240px}.tKsOKa_input:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.tKsOKa_input::placeholder{color:var(--dsw-alias-label-dimmed)}.tKsOKa_input:disabled{opacity:.6;cursor:default}.tKsOKa_selectInput{appearance:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-position:right 12px center;background-repeat:no-repeat;background-size:12px 12px;padding-right:32px}.tKsOKa_modelSelectionPanel{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:12px;flex-direction:column;grid-area:3/2;align-self:start;gap:14px;min-width:0;padding:18px;display:flex}.tKsOKa_modelSelectionTitle{margin:0;font-size:14px;font-weight:500;line-height:22px}@media (width<=900px){.tKsOKa_section{flex-direction:column;display:flex;overflow-y:auto}.tKsOKa_rows{overflow:visible}}.tKsOKa_error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px;line-height:18px}.tKsOKa_deleteDialog{width:min(480px,100%)}.tKsOKa_deleteConfirm:not(:disabled){border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}.tKsOKa_deleteConfirm:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}.tKsOKa_hiddenLabel{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}@media (prefers-reduced-motion:reduce){.tKsOKa_customizedSummary:before{transition:none}}.tKsOKa_fetchDialog{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);max-width:520px}.tKsOKa_candidateList{flex-direction:column;gap:2px;max-height:320px;margin:0;padding:0;list-style:none;display:flex;overflow-y:auto}.tKsOKa_candidate{border-radius:6px}.tKsOKa_candidateLabel{cursor:pointer;align-items:center;gap:8px;padding:6px 8px;display:flex}.tKsOKa_candidateId{font-family:var(--ds-font-family-code);overflow-wrap:anywhere;flex:auto;font-size:13px}";
		const tagId$5 = "@dsh-control-center/control-center/ModelsSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var ModelsSection_module_css_default = {
			"candidate": "tKsOKa_candidate",
			"fieldLabel": "tKsOKa_fieldLabel",
			"savedNotice": "tKsOKa_savedNotice",
			"rowActions": "tKsOKa_rowActions",
			"primaryButton": "tKsOKa_primaryButton",
			"selectInput": "tKsOKa_selectInput",
			"editor": "tKsOKa_editor",
			"linkButton": "tKsOKa_linkButton",
			"modelSelectionTitle": "tKsOKa_modelSelectionTitle",
			"customizedSummary": "tKsOKa_customizedSummary",
			"error": "tKsOKa_error",
			"secondaryButton": "tKsOKa_secondaryButton",
			"modelCatalog": "tKsOKa_modelCatalog",
			"rowIdentity": "tKsOKa_rowIdentity",
			"addBlock": "tKsOKa_addBlock",
			"deleteDialog": "tKsOKa_deleteDialog",
			"notice": "tKsOKa_notice",
			"modelCatalogHeading": "tKsOKa_modelCatalogHeading",
			"iconButton": "tKsOKa_iconButton",
			"addCard": "tKsOKa_addCard",
			"addActions": "tKsOKa_addActions",
			"advancedHint": "tKsOKa_advancedHint",
			"modelField": "tKsOKa_modelField",
			"input": "tKsOKa_input",
			"rowHead": "tKsOKa_rowHead",
			"fetchDialog": "tKsOKa_fetchDialog",
			"editorTitle": "tKsOKa_editorTitle",
			"modelList": "tKsOKa_modelList",
			"field": "tKsOKa_field",
			"editorHeader": "tKsOKa_editorHeader",
			"modelRow": "tKsOKa_modelRow",
			"addButton": "tKsOKa_addButton",
			"section": "tKsOKa_section",
			"credentialDotMissing": "tKsOKa_credentialDotMissing",
			"customized": "tKsOKa_customized",
			"candidateList": "tKsOKa_candidateList",
			"intro": "tKsOKa_intro",
			"candidateLabel": "tKsOKa_candidateLabel",
			"dangerButton": "tKsOKa_dangerButton",
			"deleteConfirm": "tKsOKa_deleteConfirm",
			"editorActions": "tKsOKa_editorActions",
			"addModelButton": "tKsOKa_addModelButton",
			"setupCard": "tKsOKa_setupCard",
			"modelEmpty": "tKsOKa_modelEmpty",
			"credentialDot": "tKsOKa_credentialDot",
			"modelCatalogTitle": "tKsOKa_modelCatalogTitle",
			"title": "tKsOKa_title",
			"modelFieldLabel": "tKsOKa_modelFieldLabel",
			"modelListHead": "tKsOKa_modelListHead",
			"credentialDotConfigured": "tKsOKa_credentialDotConfigured",
			"candidateId": "tKsOKa_candidateId",
			"rowName": "tKsOKa_rowName",
			"modelEntry": "tKsOKa_modelEntry",
			"editorRoute": "tKsOKa_editorRoute",
			"modelAdvanced": "tKsOKa_modelAdvanced",
			"rows": "tKsOKa_rows",
			"modelSelectionPanel": "tKsOKa_modelSelectionPanel",
			"hiddenLabel": "tKsOKa_hiddenLabel",
			"rowCard": "tKsOKa_rowCard",
			"rowTag": "tKsOKa_rowTag",
			"modelCatalogMeta": "tKsOKa_modelCatalogMeta",
			"customizedBody": "tKsOKa_customizedBody",
			"iconButtonDanger": "tKsOKa_iconButtonDanger"
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
		const css$4 = ".C_CJ_a_dialog{width:min(600px,100%);padding:0}.C_CJ_a_content{box-sizing:border-box;flex-direction:column;max-height:calc(100vh - 48px);padding:28px;display:flex;overflow-y:auto}.C_CJ_a_title{color:var(--dsw-alias-label-primary);outline:none;margin:0;font-size:20px;font-weight:500;line-height:28px}.C_CJ_a_body{margin-top:20px}@media (width<=560px){.C_CJ_a_content{padding:24px}}";
		const tagId$4 = "@dsh-control-center/control-center/OnboardingModal.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var OnboardingModal_module_css_default = {
			"title": "C_CJ_a_title",
			"dialog": "C_CJ_a_dialog",
			"body": "C_CJ_a_body",
			"content": "C_CJ_a_content"
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
				className: OnboardingModal_module_css_default.dialog,
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
		const css$3 = ".oxcHWa_description{color:var(--dsw-alias-label-secondary);margin:0;font-size:14px;line-height:24px}.oxcHWa_editor{margin-top:24px}@media (width<=560px){.oxcHWa_editor{margin-top:20px}}";
		const tagId$3 = "@dsh-control-center/control-center/DeepSeekOnboardingDialog.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var DeepSeekOnboardingDialog_module_css_default = {
			"editor": "oxcHWa_editor",
			"description": "oxcHWa_description"
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
		const css$2 = ".RFswhG_copy{color:var(--dsw-alias-label-secondary);font-size:14px;line-height:24px}.RFswhG_copy p{margin:0}.RFswhG_copy p+p{margin-top:12px}.RFswhG_error{color:var(--dsw-alias-state-error-primary);margin:16px 0 0;font-size:14px;line-height:22px}.RFswhG_actions{justify-content:flex-end;margin-top:24px;display:flex}.RFswhG_primary{min-width:120px}@media (width<=560px){.RFswhG_primary{width:100%}}";
		const tagId$2 = "@dsh-control-center/control-center/WelcomeNotice.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var WelcomeNotice_module_css_default = {
			"copy": "RFswhG_copy",
			"primary": "RFswhG_primary",
			"actions": "RFswhG_actions",
			"error": "RFswhG_error"
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
		const css$1 = ".UFuZ_q_item{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);min-width:36px;height:36px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;border-radius:10px;justify-content:center;align-items:center;gap:7px;padding:0;display:inline-flex;box-shadow:0 4px 18px #00000014}.UFuZ_q_item[data-wide]{justify-content:flex-start;min-width:124px;padding:0 12px}.UFuZ_q_item:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.UFuZ_q_item[data-active]{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}.UFuZ_q_item:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}";
		const tagId$1 = "@dsh-control-center/control-center/ProductWorkspaceNavItem.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
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
		const css = ".mzcFbW_root{min-width:0;min-height:0;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);flex-direction:column;flex:1;padding:28px;display:flex}.mzcFbW_header{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:flex-start;gap:18px;padding-bottom:20px;display:flex}.mzcFbW_identity{align-items:center;gap:12px;display:flex}.mzcFbW_icon{background:var(--dsw-alias-interactive-bg-active);border-radius:12px;justify-content:center;align-items:center;width:42px;height:42px;display:inline-flex}.mzcFbW_header h1{margin:4px 0 0;font-size:28px;line-height:1.2}.mzcFbW_eyebrow{color:var(--dsw-alias-label-tertiary);text-transform:uppercase;letter-spacing:.08em;margin:0;font-size:12px}.mzcFbW_close{border:1px solid var(--dsw-alias-border-l2);min-height:34px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border-radius:10px;padding:0 14px}.mzcFbW_body{border:1px dashed var(--dsw-alias-border-l2);max-width:720px;color:var(--dsw-alias-label-secondary);border-radius:14px;margin-top:32px;padding:24px;line-height:1.7}@media (width<=760px){.mzcFbW_root{padding:18px}.mzcFbW_header{align-items:center}.mzcFbW_header h1{font-size:23px}}";
		const tagId = "@dsh-control-center/control-center/ProductWorkspaceSurface.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-control-center/control-center";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ProductWorkspaceSurface_module_css_default = {
			"body": "mzcFbW_body",
			"icon": "mzcFbW_icon",
			"identity": "mzcFbW_identity",
			"root": "mzcFbW_root",
			"eyebrow": "mzcFbW_eyebrow",
			"header": "mzcFbW_header",
			"close": "mzcFbW_close"
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
		//#region lib/types/client/index.js
		const SHELL_NS = "control-center";
		const MODELS_NS = "control-center.models";
		const KNOWN_NATIVE = /* @__PURE__ */ new Set([
			"general",
			"agent-presets",
			"plugins"
		]);
		function groupOf(id) {
			if (id === "models") return "core";
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
				ctx.slots.inject("application.surface", () => ctx.slots.register({
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