# Changelog

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
