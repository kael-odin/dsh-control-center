# DSH Control Center Web Edition

An installable, AGPL-3.0-licensed control center for the DSH Web profile. The first delivery replaces DSH's stock settings shell and model settings page with an adapted Cherry Studio information architecture while keeping DSH settings, credentials, LLM routes, sessions, permissions, presets, and plugin surfaces authoritative.

## Supported baseline

- DeepSeek Harness `0.1.1-rc.2` (`b150a551b8`)
- Cherry Studio source/visual baseline `0bb1725c638bf12d505e9baadaa69f8da47dd05e` (application `2.0.8`)

The package fails startup before its browser half activates when the resolved DSH contract packages do not match the supported baseline.

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

Delivered (v0.1.0, all browser-verified against the real DeepSeek API):

- **Settings shell**: Cherry design-token system (light/dark following the host theme), grouped navigation (核心/能力/个人/自动化/系统), 250px Cherry settings geometry
- **Core**: provider management with real connection test and model discovery, DSH-native model page, MCP server management, Skills catalog, Web Search provider config
- **Product workspaces**: Translation (real streaming via DSH LLM), Painting (image generation), Knowledge Base (ingestion/embedding/retrieval), Repositories (browse any local repo: file tree, previews, git branch)
- **Document processing & OCR**: processor catalog + config, local text extraction, OpenAI-compatible vision OCR, capability-gated cloud processors
- **Personal**: usage analytics (live service counts), data export/import/clear (credentials stay in the DSH credentials store)
- **Automation**: scheduled tasks with a real host cron scheduler (notification and command actions, run history)
- **System**: about/versions, dependency resolution (8 contract packages), compatibility gate

Capabilities DSH already owns (themes, sessions, permissions, presets, credentials, plugin inventory) stay authoritative; the Control Center surfaces them without duplicating their storage.

See the bilingual [product specification](docs/control-center-web-edition.md) and [implementation ledger](docs/implementation-status.md) for the authoritative target and current status.

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
