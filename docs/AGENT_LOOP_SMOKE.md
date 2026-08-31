# Agent Loop 能力融合冒烟 — DSH Control Center 8 能力 E2E 剧本

> 目标：证明 Control Center 注入的每项能力在 DSH 的 agent loop 中**真实可用**，而非仅设置面可用。执行面：`pnpm test`（47 files / 265 tests 已覆盖）+ 下述手工冒烟（需配置对应 Key/凭据）。

## 8 能力 → toolService 注册点（代码证据）

| 能力 | 工具名（注册到 `ctx.tools`） | Host 模块 | 备注 |
|---|---|---|---|
| MCP | `mcp_<serverId>_<tool>` | `mcp.ts`（`toolService.register`，`disabledTools` 过滤，`mcp-builtin-runtime.ts` 9/9） | 逐工具自动批准无 DSH 对应物（会话级 ask/never） |
| 知识库 | `knowledge_retrieve` | `knowledge.ts` | 另有 RAG 自动注入（`system-prompt/assemble` waterfall） |
| Skills | —（文件落 `~/.dsh/skills/`） | `skills.ts` | DSH 原生技能运行时加载 |
| 模型路由 | —（路由写入 `llm-pi-ai`） | `providers.ts` | 频道/翻译等处 `selectModel` 生效 |
| 网络搜索 | `web_search` | `websearch/runtime.ts` + `websearch.ts` | tavily/exa/zhipu/bocha/searxng |
| 文档处理 | `read_document` / `read_document_task` | `file-processing.ts` | 6 处理器 + storage-domain 持久任务 |
| OCR | 同 `read_document` 统一分发 | `file-processing.ts` | 按 `feature` 走 OCR 处理器 |
| 频道 | —（`replyPipeline` → `generateViaAgentLoop`） | `channel-bridge.ts` | 每频道持久会话，工具在频道回复中可用 |

## 冒烟剧本（手工，按序执行）

1. **MCP**：在设置→MCP 启用 `browser`（无凭据），会话中让模型 `fetch_page https://example.com`，应返回标题+可读文本；再试 `filesystem read <workspace>/README.md`。
2. **知识库 RAG + 工具**：建库并入库一段文本，开关 `control-center-knowledge.autoInject`，发问命中内容，观察 `system-prompt` 注入与 `knowledge_retrieve` 调用。
3. **Skills**：在 `~/.dsh/skills/` 放入一个 skill，会话中让模型调用其工具，观察工具列表出现。
4. **模型路由**：在 Model Services 配置任一 provider，设为 `agent-default-model`，新会话无需指定即走该路由；再试 `model-prefs` 翻译/绘画路由。
5. **网络搜索**：配置任一 search provider（如 tavily），会话中触发联网问题，观察 `web_search` 调用与压缩截断。
6. **文档处理**：上传 PDF/图片，触发 `read_document` 同步提取；再试 MinerU/Doc2X 走 `read_document_task` 返回任务 id，重启后恢复轮询。
7. **OCR**：上传图片触发 OCR，观察按 feature 走 `tesseract/mistral` 等，缺凭据时诚实 `needs-runtime`。
8. **频道**：配 Telegram/Discord 任一频道并绑定 Agent，会话外发消息，观察频道回复走 agent loop（工具/知识库/搜索可用）且持久会话续上下文。

## 自动化覆盖

- `packages/control-center/tests/channel-reply.spec.ts`：Agent 会话端到端采集 + `selectModel` 断言 + 失败回退直连。
- `tests/data.spec.ts` / `mcp-builtin-*` / `knowledge` / `file-processing` 等：各 Host 服务单测 + `controlCenterCompat.probe()` 能力探测随诊断包导出。

## 判定

上述 8 项在 agent loop 中均有 `toolService.register` 或等价注册点，且手工冒烟可在配置 Key 后复现；未覆盖的 `jina/firecrawl/querit/exa-mcp` 保持诚实报错指引切换。
