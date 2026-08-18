# DSH Control Center Web Edition

An installable, AGPL-3.0-licensed control center for the DSH Web profile. The first delivery replaces DSH's stock settings shell and model settings page with an adapted Cherry Studio information architecture while keeping DSH settings, credentials, LLM routes, sessions, permissions, presets, and plugin surfaces authoritative.

## Supported baseline

- DeepSeek Harness `0.1.0-rc.7` (`99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`)
- Cherry Studio source/visual baseline `13687df354e9845c7e2b6d155eac6a9171f6a533` (application `2.0.7`)

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

## Status and roadmap

The verified first delivery includes the settings shell, General contributions, local settings-document action, onboarding, provider creation/edit/removal, write-only credentials, draft model discovery and adoption, and default/current model selection.

The committed full-parity roadmap also includes product workspaces for translation, image generation, and knowledge bases plus MCP, Skills, search, document processing, OCR, local models, API Gateway, data and backup, usage analytics, Channels, scheduled tasks, shortcuts, assistant surfaces, capture, diagnostics, and updates. Those capabilities are not represented by inactive controls: each appears only after it has real Host behavior, persistence, cancellation, recovery, and integration with DSH authorities.

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
