# Agent Note: Cherry Studio Control Center Web Edition for DSH

Status: proposed

English | [中文](control-center-web-edition.zh.md)

## Problem

DeepSeek Harness has a capable coding-agent runtime, but its current Web settings experience exposes only a small portion of the configuration and management users need. Provider and model setup, MCP lifecycle, skill discovery, search providers, data management, usage analytics, automation, and system services are split across incomplete or technical surfaces.

Cherry Studio already ships the desired settings information architecture, visual design, components, and backend behavior. Rebuilding those assets from behavioral descriptions would spend time reproducing code that is available for lawful reuse, while running Cherry as the control plane would make the complete experience dependent on a separate application instead of an extension installed into an existing DSH deployment.

The product requirement is a standalone DSH extension that gives an existing DSH user the complete Cherry-style control center without requiring Cherry Studio to run. The extension may be larger than DSH itself; installation simplicity, UI parity, and real capability integration take priority over package size or minimizing copied source.

## Proposal

### Product decision

- Build **Control Center Web Edition** as an installable DSH composition bundle, not as a Cherry-hosted DSH experience.
- Present one installation unit and one settings entry to the user, while keeping internal Host, Client, shared-domain, storage, and provider packages independently testable.
- Reproduce the complete Cherry Studio settings navigation, page structure, visual behavior, and management workflows inside DSH Web.
- Copy and integrate Cherry Studio's Translation, Painting/Image Generation, and Knowledge Base workspaces even though they have no dedicated top-level settings pages. Their complete UI workflows and backend capabilities are mandatory product scope, not optional settings extras.
- Connect every copied settings control and product workflow to a real DSH Host capability; a page that only looks functional, an empty placeholder, or a silent no-op does not count as parity.
- Preserve the existing DSH coding, session, agent-preset, tool, permission, subagent, workflow, and plugin capabilities. Control Center extends DSH rather than replacing the agent product.
- Treat complete parity as the final scope while delivering it in verified vertical stages. An early stage may be incomplete, but the roadmap may not silently remove a confirmed settings domain.

### Source reuse and license posture

- Cherry Studio component, style, route, hook, schema, service, and supporting source may be copied and adapted when that reduces construction time or preserves parity.
- The initial parity baseline is the local `D:\Github_Open\cherry-studio` checkout at commit `0bb1725c63`, whose application version is `2.0.8`. Later upstream synchronization is deliberate work, not an implicit moving target.
- The distributed Control Center project uses an AGPL-3.0-compatible licensing posture. Copied and modified Cherry source retains applicable copyright, license, attribution, and modification notices.
- Corresponding source and required notices are published for distributed or network-accessible versions under the applicable AGPL terms. Package boundaries are not used to conceal or evade obligations created by source reuse.
- A source-origin inventory records copied files, their Cherry baseline, local destination, material modifications, and license notice coverage so upstream refreshes and compliance reviews remain auditable.

### User-facing contract

- An existing supported DSH installation can add Control Center through one documented install or composition action; users do not clone or launch Cherry Studio.
- Opening Settings shows the Cherry-style grouped navigation and page chrome rather than a second unrelated configuration application.
- Configuration changes affect the same DSH runtime the user is already using. Control Center does not maintain a competing provider, model, permission, or agent-preset authority.
- All supported secrets use the DSH credentials domain or another dedicated secret store and never appear in ordinary settings responses, logs, exports, analytics rows, or browser persistence.
- Control Center Web Edition has no separately distributed Electron or Tauri companion. The browser owns presentation; DSH Host plugins may use Node.js APIs, native modules, and controlled subprocesses to provide local-system behavior.
- Desktop-shaped outcomes are adapted to the Web/Host product boundary instead of being omitted. Platform restrictions are shown explicitly, and no UI claims support for an operation that the active Host cannot perform.
- Chinese and English are first-class product languages, and copied Cherry user-facing strings remain under the product's i18n system.

### Architecture and packaging

```text
@dsh-control-center/bundle                 one user-facing install unit
├─ client/control-center-shell             Cherry settings shell, navigation, routes, page UI
├─ host/control-center-api                 typed Host/Client operations and events
├─ shared/control-center-domain            wire-safe schemas, IDs, capability contracts
├─ host/control-center-storage             SQLite catalogs, history, jobs, migrations
├─ capabilities/*                          provider, MCP, skills, search, translation, image, knowledge, data, automation, system
├─ client/capabilities/*                   feature-owned settings pages, product workspaces, and state controllers
└─ vendor/cherry-studio/*                  attributed copied/adapted Cherry source
```

The bundle composes a family of Cordis plugins but installs as one product. Each long-lived registration, process, listener, watcher, timer, and route belongs to the owning plugin lifecycle and disposes when the bundle or capability unloads.

The Client half owns routing, rendering, local drafts, accessibility, and responsive behavior. The Host half owns secrets, files, processes, network calls that require privileged credentials, databases, schedules, local models, native integration, and policy enforcement. Typed JSON-safe contracts cross the Host/Client boundary; renderer code does not import Host services or Cherry Electron IPC facades.

| Internal package group | Responsibility |
|---|---|
| `bundle` | Mount the complete product, replace the stock settings shell for this composition, and select capability implementations. |
| `client/control-center-shell` | Render Cherry-compatible settings navigation, route layout, search, page chrome, responsive states, locale, and theme integration. |
| `shared/control-center-domain` | Own cross-process schemas, stable IDs, errors, capability status, and transport-safe records. |
| `host/control-center-api` | Expose privileged operations and events to the Client through DSH-supported transport seams. |
| `host/control-center-storage` | Own SQLite migrations and business records that do not belong in `settings.yaml` or the session log. |
| `capabilities/*` | Implement independent Service Definition, Service Provider, and Consumer roles for each managed domain. |
| `vendor/cherry-studio/*` | Hold copied or materially adapted Cherry source with origin and license metadata. |

### Settings UI parity contract

Control Center copies and adapts the Cherry settings shell and its feature pages, rather than approximating them with the existing generic plugin-card layout. The initial navigation baseline is:

| Group | Pages |
|---|---|
| Core | Model services/providers, model management, local models, API Gateway. |
| Capabilities | MCP, Skills, Web search, document-to-Markdown processing, OCR. |
| Personal | Appearance, notifications, data, usage. |
| Automation | Channels, scheduled tasks, shortcuts, Quick Assistant, Selection Assistant, screenshot. |
| System | System settings, environment dependencies, About and update information. |
| DSH-native | General settings, permissions, default model, agent presets, plugin inventory/configuration, and other DSH-only contributions. |

Translation, Painting/Image Generation, and Knowledge Base are product workspaces rather than artificial settings pages. Control Center adds them to DSH's primary product navigation using Cherry-compatible workspace shells, while their provider and retrieval options remain reachable from the relevant settings and in-context controls. Parity includes translation history and language management; painting composition, templates, model-specific controls, asynchronous jobs, gallery, reuse and downloads; and knowledge-base creation, data-source ingestion, processing, chunking, embedding, indexing, retrieval configuration, recall testing, citations, updates, deletion, and agent/tool integration.

Parity covers navigation hierarchy, labels, icons where licensing permits, page layout, forms, lists, filters, dialogs, loading and error states, empty states, validation, keyboard behavior, responsive behavior, and light/dark themes. Web adaptation may replace an Electron transport or OS primitive, but it preserves the user-visible outcome and failure semantics.

The bundle replaces the stock `ui-settings-general` presentation in its own composition and continues to consume feature registrations. It builds on the [plugin-owned settings surface](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8/.agents/notes/implemented/architecture/2026-08-12-plugin-owned-settings-surface.md) instead of reverting namespace self-registration, and it preserves feature ownership from the [client settings layering proposal](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8/.agents/notes/proposed/architecture/2026-07-25-client-settings-locale-theme.md). A copied page becomes a DSH Client contribution backed by DSH services; it does not retain a hidden dependency on Cherry's Electron `ipcApi`, Preference, DataApi, WindowManager, or application lifecycle container.

### Capability ownership and integration matrix

| Cherry settings domain | Web Client responsibility | DSH Host/backend responsibility | Authority and storage | Web Edition rule |
|---|---|---|---|---|
| Provider and model management | Provider list/editor, keys status, endpoints, headers, model discovery and enablement. | Provider adapters, connectivity tests, remote model discovery, configuration validation. | DSH settings plus credentials; discovery cache in SQLite. | Reuse and extend DSH LLM registries rather than creating a second model authority. |
| Local models | Catalog, downloads, progress, model state and runtime controls. | Download manager, checksums, storage quotas, local inference process lifecycle. | Managed files plus SQLite metadata. | Host services provide local operations; no desktop shell is required. |
| API Gateway | Status, URL, credential controls, start/stop/restart and documentation link. | Authenticated OpenAI-compatible local gateway and lifecycle. | Settings plus credentials; runtime state in memory. | Bind safely by default and expose non-loopback access only through explicit policy. |
| MCP | Server catalog/editor, install, enablement, logs, tools, prompts, resources and per-tool approval. | stdio/SSE/Streamable HTTP clients, process lifecycle, trust, discovery, restart and cancellation. | SQLite business records plus credentials and bounded logs. | Copy Cherry workflows while registering discovered capabilities into DSH's tool and prompt registries. |
| Skills | Catalog, search, install, update, uninstall, enablement and source details. | Source resolution, download, validation, versioning, filesystem install and indexing. | Managed skill files plus SQLite catalog metadata. | Installed skills become ordinary DSH skills and remain usable outside the settings page. |
| Web search | Provider editors, API credentials, defaults and capability-specific options. | Search/fetch adapters, retries, result normalization and policy. | Settings plus credentials. | Extend DSH search capabilities rather than proxying through a running Cherry process. |
| Translation | Source/target language selectors, auto-detection, streaming result, copy/replace actions, language management and paginated history. | Translation prompt/runtime execution, language detection, cancellation, history writes and model/provider selection. | Settings plus credentials; SQLite languages and translation history. | Copy Cherry's complete translation workspace and connect it to DSH model providers without turning each translation into a coding session. |
| Painting/Image Generation | Prompt composer, templates, model selector, provider-specific controls, progress, gallery, reuse, download and deletion. | Image-model capability discovery, request mapping, asynchronous jobs, polling/cancellation, result ingestion and file lifecycle. | Settings plus credentials; SQLite painting/job records and managed image files. | Preserve Cherry's dedicated workspace and adapters while exposing generated images as DSH files and agent attachments. |
| Knowledge Base | Base list/detail, creation, data-source management, processing status, RAG configuration, recall testing, results and citations. | File/URL/text ingestion, parsing, chunking, embedding, vector indexing, retrieval, reranking, updates, deletion and citation projection. | SQLite knowledge metadata/chunks/jobs plus managed source files and vector indexes; credentials for embedding/reranking providers. | Copy the complete Cherry knowledge workflow and register retrieval as DSH tools/context capabilities usable by coding agents. |
| Document processing | Converter choices, options, progress and result handling. | Document-to-Markdown workers, file staging, limits and cancellation. | Settings, temporary files and optional history records. | Browser upload/select flows call Host workers through typed operations. |
| OCR | Provider/local-engine selection, language/options and progress. | OCR adapters, local engine management, file staging and cancellation. | Settings plus credentials; optional managed models. | Host modules or subprocesses replace Electron-specific implementations. |
| Appearance | Theme, language, density, font and compatible visual preferences. | Persisted preference validation when needed. | Client preference/settings namespace. | Preserve DSH theme and locale contracts while rendering Cherry-compatible controls. |
| Notifications | Permission state and notification preferences. | Event routing and optional Host-native notification provider. | Settings and browser permission state. | Use Web Notifications when available; a Host-native provider may enhance them without a separate companion. |
| Data, import, export and backup | Backup/import/export workflows and WebDAV, S3, Nutstore, Notion, Yuque, Joplin, Obsidian and Siyuan configuration. | Archive generation, restore validation, connectors, scheduling, conflict handling and secret use. | SQLite business data, managed files, settings and credentials. | DSH data formats are canonical; Cherry formats are migration inputs, not a second live database. |
| Usage analytics | Metrics, charts, heatmaps, filters, drill-down and paginated entries. | Request attribution, token/cache/cost aggregation, retention and query APIs. | SQLite usage records. | Instrument DSH model calls directly so all agent activity is represented. |
| Channels | Channel setup, status, credentials and routing controls. | Channel adapters, webhook/polling lifecycle, message admission and policy. | SQLite records plus settings and credentials. | Channel turns enter existing DSH session and permission flows. |
| Scheduled tasks | Editor, calendar/list views, run history, enablement and manual run. | Durable scheduler, locking, recovery, execution and result recording. | SQLite schedules and run history. | Scheduling lives in the DSH Host and survives browser closure. |
| Shortcuts | Shortcut editor, conflicts and availability state. | Optional Host-level global shortcut provider and command dispatch. | Settings. | Browser shortcuts are universal; global shortcuts use Host native modules where supported and report unsupported platforms. |
| Quick Assistant | Configuration and in-Web launch surfaces. | Session creation, context injection, model selection and policy. | Settings plus DSH sessions. | The Web shell supplies the assistant surface without a separate desktop window. |
| Selection Assistant | Configuration and actions over selected text available to the application. | Context processing and agent dispatch; optional Host integration providers. | Settings plus DSH sessions. | In-page selection is baseline; system-wide selection requires an available Host provider and is never falsely advertised. |
| Screenshot | Capture options, preview, annotation/import and agent attachment. | File staging, optional Host capture providers and cleanup. | Temporary files plus attachment metadata. | Browser capture/upload is baseline; desktop capture uses an optional Host provider inside the same plugin distribution. |
| System, dependencies, About and updates | Runtime status, dependency controls, diagnostics, version/license notices and update state. | Dependency detection/install policy, diagnostics, plugin update checks and safe lifecycle operations. | Settings, managed tool metadata and update records. | Controls manage Control Center and DSH, not a nonexistent Cherry desktop application. |
| Existing DSH settings | Cherry-compatible presentation for permissions, default model, presets and plugin inventory. | Existing DSH services remain authoritative. | Existing DSH stores. | No regression or duplicated settings authority is permitted. |

### Data ownership and security

| Data class | Canonical owner |
|---|---|
| Provider enablement, endpoints, defaults, feature options and ordinary configuration | DSH `settings.yaml` namespaces. |
| API keys, tokens, passwords, private headers and remote-storage credentials | DSH credentials or a dedicated encrypted secret provider. |
| MCP catalogs, marketplace metadata, translation history/languages, painting jobs/gallery metadata, knowledge-base records/chunks/index metadata, usage history, schedules, connector records and job history | Control Center SQLite with append-only migrations. |
| Skills, local models, generated images, knowledge source files/vector indexes, downloads, backups and generated artifacts | Namespaced managed data directories with source and integrity metadata. |
| Agent sessions, messages, plans, tool results and model-visible durable facts | Existing DSH session persistence. |
| Browser drafts, filters, selected tabs and ephemeral display state | Bounded Client storage, never the authority for Host behavior. |

Settings writes retain revision fencing and recovery reads. DSH's settings redactor is proven to remove secret-role fields reached through object, dictionary, and array containers, including opaque secret-role containers. A copied or third-party schema whose secret descendants are reachable only through an unsupported wrapper such as a union, intersection, transform, lazy node, or tuple must be rejected by a fail-closed schema audit, or DSH's redactor must gain and prove support for that wrapper, before the namespace crosses the settings wire. Export, backup, diagnostics, logging, and usage ingestion each apply explicit secret filtering.

Downloaded MCP servers, skills, models, binaries, and updates record source, version, integrity hash, permissions, and install state. Installation and process execution pass through DSH permission policy, path containment, cancellation, and lifecycle cleanup. Browser requests cannot directly select arbitrary Host methods; each capability exposes a narrow typed operation set.

### Integration with existing DSH

- The Control Center bundle replaces settings presentation through composition and public Client extension points; it does not require a permanent fork of unrelated DSH core packages.
- Existing DSH model, settings, credentials, permission, agent-preset, session, tools, skills, workflow, telemetry, and plugin services remain the canonical capabilities where they already satisfy the domain.
- Missing reusable behavior is added as a capability seam with explicit Service Definition, Service Provider, and Consumer ownership rather than hidden inside a React page or API route.
- Host and Client contributions register through reversible Cordis effects. Uninstalling or disabling Control Center removes its UI, processes, routes, watchers, and schedules without corrupting base DSH state.
- The product ships a compatibility declaration for supported DSH versions and rejects incompatible runtime combinations with an actionable diagnostic.
- Cherry upstream synchronization is a reviewed source update: compare the recorded origin inventory, port relevant changes, rerun parity and integration tests, and update notices. Blind subtree replacement is forbidden.

### Delivery stages

1. **Foundation and compliance:** create the external AGPL-compatible package layout, source-origin inventory, one-action bundle composition, Host/Client transport, SQLite migration base, secret policy, and Cherry `13687df` parity fixtures.
2. **Settings shell and model vertical slice:** copy/adapt the complete settings shell and Provider/Model pages, replace the stock shell in the bundle, and connect provider creation, credentials, model discovery, selection, and a real DSH session end to end.
3. **Core capabilities and product workspaces:** deliver MCP, Skills, Web search, Translation, Painting/Image Generation, and Knowledge Base, followed by document processing and OCR, with real lifecycle, installation, model execution, ingestion, retrieval, permission, and cancellation behavior.
4. **Personal and data:** deliver appearance, notifications, import/export, local and remote backup connectors, data migration, and complete usage analytics.
5. **Automation:** deliver Channels, scheduled tasks, shortcuts, Quick Assistant, Selection Assistant, and screenshot workflows through Web/Host implementations.
6. **System and distribution:** deliver local models, dependency management, diagnostics, About/license/update pages, package updater, migration assistant, and cross-platform installers or install scripts.
7. **Parity and hardening:** close every baseline capability row, run visual and behavioral parity suites, security review, migration/recovery tests, performance budgets, DSH-version compatibility tests, and upstream refresh rehearsal.

The first implementation batch ends only after one installed bundle opens the copied Cherry-style shell and completes the Provider/Model vertical slice against a real DSH process. It may scaffold later navigation entries for layout testing, but unreleased pages are visibly marked unavailable in development builds and are not presented as completed features.

## Alternatives considered

**Run Cherry Studio as the control plane and DSH as the execution engine.** This reuses the most backend code, and Cherry already has a DSH bridge, but it fails the chosen product contract: an existing DSH user must install the extension and use the complete experience without running a second application.

**Reimplement the UI clean-room from screenshots and behavior.** This reduces copied-code license coupling but discards working components and increases parity time. The project accepts AGPL-compatible source publication and notice obligations, so direct reuse is the preferred construction method.

**Build one physically monolithic Cordis plugin.** One file/package would make the user-visible word “plugin” literal, but settings UI, storage, subprocesses, providers, and automation have different lifecycles and test boundaries. One installable bundle over multiple internal plugins preserves the desired installation experience without creating an unmaintainable implementation.

**Fork DSH core and replace its settings implementation in place.** A fork could bypass current external Client packaging friction, but users would no longer be installing the product on top of ordinary DSH. The bundle may propose upstream extension-point improvements, while product code remains an installable composition.

**Ship a separate Electron or Tauri companion.** A companion makes global desktop integrations easier but adds another application, lifecycle, updater, and trust boundary. Control Center stays Web Edition and uses DSH Host modules or subprocesses for local behavior; unsupported platform-specific outcomes remain explicit.

**Stop at a reduced MVP.** Provider, MCP, and Skills alone would be useful, but the confirmed product promise is complete Cherry settings and backend parity. Vertical staging controls implementation risk without redefining the final scope.

## Acceptance criteria

- One documented install/composition action adds Control Center to a supported existing DSH deployment, and removal returns the deployment to its prior settings presentation without data corruption.
- No Cherry Studio process, profile, database, IPC server, or installation is required at runtime.
- The settings shell contains every baseline navigation domain and retains DSH-native settings that have no Cherry equivalent.
- Every released control reads real state, validates changes, performs its promised Host operation, reports progress and failure, and survives refresh or reconnection according to its persistence contract.
- Provider and model configuration has one authority, secrets never cross ordinary settings responses, and a configured model can start a real DSH coding session.
- MCP, Skills, search, Translation, Painting/Image Generation, Knowledge Base, processing, data, usage, automation, local-model, and system features register into existing DSH capabilities rather than remaining isolated management records.
- Translation preserves language detection, language management, streaming output and durable history; Painting preserves model-specific generation, asynchronous jobs, managed image results and gallery workflows; Knowledge Base preserves ingestion, chunking, embedding, indexing, configurable retrieval, recall testing, citations and coding-agent retrieval.
- Web/Host adaptations provide the intended outcome without a separate companion, and unavailable platform integrations are capability-detected and presented accurately.
- Copied Cherry source has an auditable origin record and complete applicable license, attribution, modification, and source-publication coverage.
- Visual regression fixtures cover the Cherry baseline at agreed desktop and narrow Web viewports in light and dark themes; behavior tests cover forms, validation, dialogs, loading, empty, error, and recovery states.
- Host integration tests use real settings, credentials redaction, SQLite migrations, lifecycle teardown, bounded subprocesses, and representative provider/MCP/backup/scheduler flows.
- Existing DSH coding sessions, permission modes, agent presets, subagents, workflows, tools, and plugin inventory remain usable with Control Center mounted.
- Supported DSH and Cherry-source baseline versions are recorded, tested, and surfaced in diagnostics; incompatible DSH versions fail before partial activation.
- Documentation distinguishes completed, platform-limited, and planned capabilities until the complete parity suite is green; no placeholder is labeled as functional parity.

## Risks

- **AGPL scope and attribution errors:** copied code can be distributed without complete notices or corresponding source unless the source-origin inventory and release checks are mandatory.
- **Cherry upstream drift:** copied renderer code and adapted services will diverge from Cherry; upstream refreshes require semantic ports rather than blind merges.
- **Electron coupling:** Cherry components often depend on IPC, Preference, DataApi, window, or OS contracts. Each copied page needs an explicit DSH Client/Host replacement, and leftover imports can create deceptively working mocks.
- **External Client packaging gaps:** DSH's out-of-tree Client bundle toolchain and settings-shell replacement points may require upstream improvements before one-action installation is robust.
- **Secret exposure:** broad settings namespace exposure, nested schemas, diagnostics, exports, connectors, and marketplace manifests increase the number of paths that must prove redaction.
- **Supply-chain and process execution:** MCP, Skills, models, dependencies, and updates download or execute third-party content. Integrity metadata, trust prompts, containment, permissions, and rollback are product requirements.
- **Cross-platform disparity:** global shortcuts, capture, notifications, OCR, local inference, and dependency installation differ by operating system and browser. Capability detection must prevent false parity claims.
- **Duplicate authorities:** copying Cherry hooks or stores without replacing their persistence assumptions can create two provider, model, or settings truths and inconsistent agent behavior.
- **Bundle size and startup cost:** copied UI assets, catalogs, connectors, and native modules may exceed DSH's size. Lazy loading and capability activation may optimize runtime, but package size is not grounds for removing scope.
- **Compatibility churn:** DSH remains pre-1.0 and its Client module, settings, and transport contracts may change. A tested compatibility matrix and fail-fast activation are required.
