# Implementation Status

English | [中文](implementation-status.zh.md)

This ledger distinguishes verified capability from committed scope. A capability moves to **Verified** only after its published controls invoke real DSH Host behavior, expose progress and failure, honor cancellation where applicable, recover from refresh/reconnect/restart according to its persistence contract, and pass packed-profile browser verification.

## Baselines

- DSH: `0.1.0-rc.7` / `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`
- Cherry Studio source and visual reference: application `2.0.7` / `13687df354e9845c7e2b6d155eac6a9171f6a533`
- Runtime dependency on Cherry Studio: none

## Capability ledger

| Domain | Status | Current evidence / next acceptance boundary |
|---|---|---|
| Installable bundle and reversible profile patch | Verified | Packed install/remove; removal preserves settings and sessions. |
| Cherry-style settings shell | Verified | Grouped navigation, responsive geometry, locale/theme behavior, unknown DSH section preservation. |
| Provider and model management | Verified | Settings/credentials/LLM authorities; connection testing; OpenAI-compatible model discovery; model enable/disable; Cherry-parity split-pane UI; precise writes and removal. |
| Default and current model selection | Verified | Revision-fenced default writes and real session selection with post-write confirmation. |
| Compatibility and secret-schema preflight | Verified | Exact DSH baseline gate and fail-closed unsupported wrapper audit. |
| Product workspace composition seam | Verified | Additive navigation + keyed main-surface ownership, coexistence with conversation, transient selection, packed browser selection/return, and unload fallback tests. |
| Translation workspace | Planned | Streaming DSH LLM jobs, cancellation, language management, copy/replace, and durable paginated history. |
| Image generation workspace | Planned | Provider/model controls, asynchronous jobs, polling/cancellation, managed files, gallery, reuse/download/delete, and DSH attachments. |
| Knowledge Base / RAG workspace | Planned | CRUD, ingestion, parsing/chunking, embeddings/vector index, retrieval/reranking, recall tests, citations, and DSH tool/context registration. |
| MCP | Planned | Server lifecycle, transports, logs, prompts/resources/tools, trust, and DSH tool registration. |
| Skills | Planned | Source catalog, install/update/remove, integrity, lifecycle, and ordinary DSH skill registration. |
| Web search | Planned | Provider settings and credentials with DSH search/fetch adapters and policy. |
| Document-to-Markdown and OCR | Planned | Typed upload/selection, bounded Host workers, progress, cancellation, and result handling. |
| Local models and API Gateway | Planned | Download/runtime lifecycle and authenticated safe-binding gateway controls. |
| Appearance and notifications | Planned | DSH theme/locale authority plus browser/Host capability detection. |
| Data, import/export, backup, and connectors | Planned | Canonical DSH archive, validation/restore, scheduling, conflict handling, and secret-filtered connectors. |
| Usage analytics | Planned | Direct DSH call instrumentation, token/cache/cost attribution, retention, queries, and dashboards. |
| Channels and scheduled tasks | Planned | Persistent Host lifecycles, admission/permission routing, locks, recovery, execution history, and manual run. |
| Shortcuts and assistant surfaces | Planned | Browser baseline, capability-detected Host integrations, DSH session/context authority. |
| Screenshot | Planned | Browser capture/upload baseline, optional Host capture, annotation/import, and attachment lifecycle. |
| System, dependencies, diagnostics, about, and updates | Planned | Control Center/DSH facts, license/source inventory, bounded operations, update verification, and migration. |
| Full parity/security/recovery matrix | Planned | Desktop/narrow, light/dark, zh/en, restart/reconnect/uninstall, migration, supply-chain, and compatibility coverage. |

## Security invariant

> Secret 不得进入普通设置响应、浏览器持久化、日志、导出、analytics 或 diagnostics

Real credentials are never fixtures. Tests use synthetic credentials in disposable profiles, and `pnpm verify:secrets` rejects common embedded secret forms before publication.
