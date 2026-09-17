# Changelog

## v0.4.0 (2026-09-17)

The contract catches up with the deployed harness: DSH 0.1.2 (vendored
tarballs + a local verdaccio registry) becomes DSH 0.1.6-alpha.1 straight off
the public npm registry.

### Contract migration (breaking)
- **Baseline `0.1.6-alpha.1` (`0d1f50007f`)**: every `@deepseek-ai/*` pin now
  resolves from the published npm line; the 2026-08-30 vendored-tarball +
  local-verdaccio channel is retired (`.npmrc` points back at
  registry.npmjs.org; `vendor/dsh-0.1.2/` stays for provenance). The support
  window tightens to `0.1.6+` — hosts on 0.1.5 or older are rejected honestly
  at the compatibility gate.
- **API drift absorbed**: upstream removed the runtime `settingsNamespace()`
  helper (local `settings-ns.ts` keeps the same validate-and-brand behavior),
  `TypertRemoteFailure` became `RemoteError`/`remoteErrorOf` (discriminate by
  code, never instanceof), `settings`/`credentials` remotes moved into
  `dsh-api-settings-controller`, session `follow()` now yields
  snapshot/event/assistant-stream frames, `Session.events` became
  `snapshotEvents()`, the settings-conflict wire code gained its slash, and
  the platform seed table + inline-safe folds match upstream 0.1.6 (dockkit).
- **Packaging fixes upstream publishes forgot**: `dsh-client-store` imports
  zustand at runtime while declaring it a devDependency — zustand + immer are
  pinned at the workspace root; the `ClientRemote` type contributions need
  `dsh-api-settings-controller` + `dsh-llm` resolvable.

### Tooling
- **Contract watch** (`.github/workflows/contract-watch.yml`): daily npm check
  with prerelease-aware semver comparison; a newer 0.1.x release opens a
  tracking issue automatically (MIGRATION_PLAN §0.4).
- **E2E vs 0.1.6**: the web surface now authenticates through a launch token
  on the printed URL; the e2e scripts capture the full URL, exchange the
  token for the signed cookie Node-side, and boot the harness's compiled CLI
  (strict typert definitions require matching build trees). `DSH_REPO`
  overrides the harness path everywhere; the desktop shell's dev fallback
  accepts sibling/known checkouts instead of one dead absolute path.
- **Boot probes** (`tests/debug-page-probe.ts`, `tests/debug-baseline-probe.ts`):
  dump what a boot actually rendered — console errors, failing requests, body
  text, screenshots.
- **Client inject contract**: typert 0.1.6 mounts each remote namespace as
  its own `remote.<ns>` service; the plugin's client entry declares
  settings/llm/credentials/session/agentPresets explicitly.

### Desktop
- **Tray preferences are real** (Phase 3): `trayEnabled=false` now removes the
  tray, `trayOnLaunch` keeps the first window in the tray until summoned, and
  general preferences re-apply live by stat-polling the settings document
  (restart still converges if a run never polls; `DSH_DESKTOP_WATCH_DEBUG=1`
  traces polls).
- **Dev harness resolution fixed**: the sibling-checkout fallback probes two
  levels up from `apps/desktop` (the one-level path could never match), and a
  failed resolution under `--e2e`/`DSH_DESKTOP_HEADLESS=1` exits loudly
  instead of hanging forever in a modal dialog nobody can dismiss — the
  long-standing desktop smoke timeout.
- **Plugin auto-sync works in dev**: `scripts/prepare-bundle.js` is rewritten
  (it had never run — duplicate declaration, `__dirname` in ESM, a
  mid-body import) and the dev `vendor/` lookup points at
  `apps/desktop/vendor` instead of `apps/desktop/bin/vendor`.

### Composer
- **Quick-phrase variable templates** (Cherry PromptSettings parity):
  phrase texts expand `{{date}}`/`{{time}}`/`{{datetime}}`/`{{week}}`/
  `{{clipboard}}` at insert time. Unknown or unavailable variables stay
  verbatim in the draft, so nothing silently disappears.

### Message actions
- **Export Word** (§1.1): the assistant more-menu gains a real .docx export —
  a minimal WordprocessingML package built with the already-carried fflate
  (headings, lists, quotes, code fences, inline bold/italic/code; anything
  else degrades to plain paragraphs, never dropped).

### Desktop
- **Proxy settings are consumed for real** (Phase 3 代理接线): the General
  page's proxy group now drives both the Electron surface session
  (`session.setProxy`, loopback always bypassed) and the self-hosted harness
  child's environment (`HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` +
  `NODE_USE_ENV_PROXY=1` for Node ≥24 global fetch; `off` explicitly blanks
  inherited proxy env). Derivation lives in the pure, unit-tested
  `apps/desktop/bin/proxy-env.mjs`.

### Data
- **清除缓存** (Cherry DataSettings parity): a Data-page panel that clears
  the surface's CacheStorage entries and sessionStorage via the pure
  `web-cache-clear.ts` (settings keys like `cc.settings.*` are never
  touched; a denied CacheStorage reports zero instead of faking success).
- General page gains the Cherry **客户端 ID**: a stable random install id
  minted once by the host, shown read-only.

### Known environment blocker (documented, not a plugin defect)
The local harness snapshot (`0.1.6-alpha.1`+master, clean-rebuilt) fails its
own no-plugin baseline: the web boot leaves three UI packages pending on a
missing `sidebarRight` service and its own `session/control` stream reports
"strict definition was withdrawn". The plugin surface itself activates and
its settings dialog renders in tsx mode; the full browser E2E turn-green is
blocked on the upstream boot wiring. `tests/debug-baseline-probe.ts`
re-verifies the baseline in seconds.

## v0.3.0 (2026-08-26)

Notes, the real API gateway, and the desktop self-healing plugin sync.

### New capabilities
- **API gateway runtime**: a local loopback HTTP service (127.0.0.1 only) exposing OpenAI `/v1/chat/completions` (stream SSE + non-stream), Anthropic `/v1/messages`, and `GET /v1/models`, routed onto the host's configured models with Bearer auth. Settings page drives real start/stop with a live status card and copyable URL/key/auth header.
- **Notes workspace** (Cherry NotesPage parity v1): Markdown files under `<dsh home>/notes/` are the source of truth — file tree with star/rename/delete, plain-text editor with debounced autosave. Rich editing, full-text search, and the knowledge-base snapshot source are v2 on the same storage.

### Desktop
- **Plugin auto-sync**: the shell carries the current bundle; at boot it compares the profile's installed version and silently installs through the harness CLI when stale — no more stale-plugin features behind a fresh shell.
- Fix: the bundle tarball declared a runtime dependency on the control-center package, which made `file:` installs (one-click update) fail; the bundle is self-contained and the dependency moved out of `dependencies`.
- Windows: `--no-open` (no more surprise browser tab), a branded loading page while the host boots, opaque icon backing, honest version reporting (`URL.pathname` broke manifest reads on Windows).

### Fixes
- Backup filenames are collision-proof (same-millisecond writes no longer overwrite each other).
- oxlint clean under `--deny-warnings`; secret scan covers the e2e fixture files and skips nested worktrees.

## v0.2.0 (2026-08-26)

Deep-integration release: channel replies through the real DSH agent loop,
the one-click update loop, and the pluginization charter landed.

### Deep integration (capability → agent runtime)
- Channels: bound-channel replies run a full durable agent-loop session via
  `ctx.apiProxy.sessions` — MCP tools, knowledge, web_search work in replies;
  per-channel serialization, 180s turn ceiling, fallback to direct LLM with
  Cherry retry policy; session ids persist across restarts
- File processing: full processor dispatch with persistent remote tasks
  (storage-domain, restart recovery), per-feature config, tesseract detection

### Pluginization charter (docs/PLUGINIZATION.md)
- §1.1 `controlCenterCompat.probe()` capability table, exported in the diagnostic bundle
- §1.2 DSH support window widened to 0.1.x (peer deps `>=0.1.1-rc.2 <0.2.0-0`)
- §2.A/§2.B one-click update loop: download the release tarball into
  storage-domain → install through the host's `dsh plugin add file:` pipeline
  → restart hint; inline release-notes page on About

### Workspaces & built-ins
- Repo workspace mounted (Cherry CodeCliPage parity): PATH detection for 9 AI coding CLIs with versions
- MCP builtin browser server (3/9): fetch_page → readable text, SSRF-guarded
- Data: ChatGPT / Claude conversation import as Markdown archives
- Assistant service: quick/selection/screenshot prefs in DSH settings + desktop hotkey bridge; real agent-preset pickers (Quick Assistant + channel binding)

### Settings parity
- General: proxy mode/address/bypass, allow-private-network, disable hardware acceleration (consumed by the desktop shell before app ready)
- Diagnostics: five-source bundle (system, browser env, channel status/logs,
  capability probes, plugin log ring)
- Appearance polish, context-management mapped to DSH compaction/spill policy

## v0.1.0 (2026-08-20)

First release: installable DSH Control Center Web Edition with full settings
shell and product workspaces.

### Settings shell
- Cherry design-token system ported (light/dark via `body[data-ds-dark-theme]`), shared component kit
- Cherry settings geometry: 250px grouped navigation (核心/能力/个人/自动化/系统), compact fields
- Compatibility gate: rejects DSH installs whose contract packages drift from rc.7

### Core capabilities
- API Providers: create/edit/remove, write-only credentials (DSH credentials store), real connection test, model discovery, enable/disable
- MCP: server CRUD, runtime state, logs, tools/prompts/resources
- Skills: catalog with enable/disable and uninstall (SQLite)
- Web Search: provider catalog, defaults, API keys, compression config
- Models (DSH-native): provider rows, credential dots, add/remove

### Product workspaces
- Translation: real streaming translation, language management, persisted history
- Painting: image generation with model controls and gallery
- Knowledge Base: bases, text/URL/file ingestion, chunking, embeddings, retrieval with citations, agent tool
- Repositories: register any local repo, lazy file tree, text preview, git branch

### Document processing & OCR
- Processor catalog (system/tesseract/paddleocr/mistral/mineru/doc2x/...)
- Local text extraction, OpenAI-compatible vision OCR, capability-gated cloud processors

### Personal, automation, system
- Usage analytics (live service counts), data export/import/clear
- Scheduled tasks: real host cron scheduler with run history
- About/dependencies: versions, source baseline, 8 contract packages

### Verified end-to-end
- Real DeepSeek API: provider create → connection test → model discovery → translation
- 38 boot rows, all 12 settings sections and 4 workspaces render with zero console errors
