# Changelog

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
