# DSH Control Center Web Edition

An installable, AGPL-3.0-licensed control center for the DSH Web profile. The first delivery replaces DSH's stock settings shell and model settings page with an adapted Cherry Studio information architecture while keeping DSH settings, credentials, LLM routes, sessions, permissions, presets, and plugin surfaces authoritative.

## Supported baseline

- DeepSeek Harness `0.1.6-alpha.1` (`0d1f50007f`), resolved from the npm-published `@deepseek-ai/*` contract line (the 2026-08-30 vendored-tarball + local-verdaccio channel is retired; see `scripts/migrate-dsh-0.1.6.mjs` and `scripts/watch-dsh-contract.mjs`)
- Cherry Studio source/visual baseline `0bb1725c638bf12d505e9baadaa69f8da47dd05e` (application `2.0.8`)

The package fails startup before its browser half activates when the resolved DSH contract packages leave the supported window (`0.1.6+`; see `packages/control-center/src/compatibility.ts`).

## Install

```bash
dsh plugin --profile web add @dsh-control-center/bundle
```

## Remove

```bash
dsh plugin --profile web remove @dsh-control-center/bundle
```

Removal restores DSH's native settings packages. It does not delete DSH settings, credentials, providers, or sessions.

## Status

v0.4.0 — the contract baseline is DeepSeek Harness `0.1.6-alpha.1`, resolved
from the npm-published `@deepseek-ai/*` line.

Delivered (all browser-verified against the real DeepSeek API unless noted):

- **Settings shell**: Cherry design-token system (light/dark following the host theme), grouped navigation (核心/能力/个人/自动化/系统), 250px Cherry settings geometry
- **Core**: provider management with real connection test and model discovery, DSH-native model page, MCP server management (9 built-in in-memory servers), Skills catalog, Web Search provider config
- **Chat integration**: message actions (notes/knowledge/translate/copy/export), regenerate + branch, quick phrases with `{{date}}/{{time}}/{{clipboard}}` variables, input history recall, in-conversation search, knowledge chip, knowledge RAG auto-injection
- **Exports**: message-level Markdown/Word/Notion/Yuque/Joplin/Obsidian/Siyuan driven by the ExportMenusPanel visibility config; offline PDF; ChatGPT/Claude archive imports
- **Product workspaces**: Translation (real streaming via DSH LLM), Painting (image generation), Knowledge Base (ingestion/embedding/retrieval), Repositories
- **Document processing & OCR**: processor catalog + config, local text extraction, OpenAI-compatible vision OCR, capability-gated cloud processors
- **Desktop shell**: tray preferences (enable/close-to-tray/launch-to-tray, live-applied), real proxy wiring (Electron session + harness child env), global hotkeys, screenshot, plugin auto-sync
- **Automation**: scheduled tasks with a real host cron scheduler, channels with per-channel agent model/prompt binding, usage analytics
- **System**: about/versions, dependency resolution, compatibility gate (`0.1.6+`), contract-watch + canary CI

Capabilities DSH already owns (themes, sessions, permissions, presets, credentials, plugin inventory) stay authoritative; the Control Center surfaces them without duplicating their storage.

See the authoritative [parity ledger](docs/PARITY_LEDGER.md) for the Cherry→DSH migration target and current status per settings surface.

## Development

```bash
pnpm install
```

```bash
pnpm check
```

```bash
pnpm test:browser
```

The browser test uses a loopback-only synthetic OpenAI-compatible fixture. Never put a real credential in source or in an issue; see [SECURITY.md](SECURITY.md).

## Source and license

This project is licensed under GNU AGPL version 3 only. See [NOTICE](NOTICE) and [the source inventory](provenance/cherry-source-inventory.json) for Cherry Studio-derived source and modifications. DSH dependencies remain under their own MIT license.
