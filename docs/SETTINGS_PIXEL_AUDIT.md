# Settings 像素级对位清单 — Cherry 22项 × 本仓 DSH Control Center

> 基线：Cherry `56cf04c3`（v2.0.10+）、DSH `cd5ef814`（0.1.2-alpha.1）。本清单按 `SettingsPage.tsx` 导航顺序逐项对位，证据为代码路径而非描述。`✅` 完全对等、`⚠️` 部分对等（诚实标注的缺口）、`⛔` DSH 原生拥有不重复。

| 序号 | 组 | Cherry 页面 | DSH 路由 | 状态 | 证据路径（本仓） | 未做 / 差异 |
|---:|---|---|---|---|---|---|
| 1 | 核心 | Provider | `provider` | ✅ | `ProviderDirectorySection.tsx` + `ProviderEditor.tsx` + `ApiKeyListDrawer.tsx` + `ModelListEditor.tsx` | — |
| 2 | 核心 | Model | `model` | ✅ | `ModelsSection.tsx`（默认/快捷/重试/话题命名诚实卡） | — |
| 3 | 核心 | Local Models | `local-models` | ✅ | `LocalModelsSection.tsx` + `LocalModelDownloads.tsx`（Qwen3 Embedding / PaddleOCR） | — |
| 4 | 核心 | API Gateway | `api-gateway` | ✅ | `gateway.ts`（127.0.0.1 + OpenAI/Anthropic 兼容 + `GET /docs`）+ `ApiGatewaySection.tsx` | — |
| 5 | 能力 | MCP | `mcp` | ✅ | `mcp.ts` + `mcp-builtin.ts` + `mcp-builtin-runtime.ts`（9/9 inMemory，`InMemoryTransport`）+ `McpSection.tsx`/`McpDiscoverViews.tsx` | — |
| 6 | 能力 | Skills | `skill` | ✅ | `skills.ts` + `SkillsSection.tsx`（`~/.dsh/skills`） | — |
| 7 | 能力 | Web Search | `websearch` | ✅ | `websearch/*`（tavily/exa/zhipu/bocha/searxng + `compression`）+ `WebSearchSection.tsx` | `jina/firecrawl/querit/exa-mcp` 诚实报错 |
| 8 | 能力 | File Processing | `file-processing` | ✅ | `file-processing.ts`（`read_document`/`read_document_task` + 6 处理器 + 30min deadline）+ `ProcessorSection.tsx` | `system/local-paddleocr` 需桌面桥 |
| 9 | 能力 | OCR | `ocr` | ✅ | 与 FileProcessing 同分发（5 选择，subprocess 探测） | 同上 |
| 10 | 能力 | 提示词（未单列导航，归 Model/Messages） | — | ⚠️ | 快捷短语在 `QuickPhrasesButton.tsx`（composer `input.right`），Assistant 预设走 DSH `agent-presets` | PromptSettings 完整页未独立 |
| 11 | 个人 | General | `general` | ⚠️ | `GeneralCherrySettings.tsx` + `GeneralSection.tsx`（启动/托盘/省电/代理四行/上下文管理→DSH compaction） | 客户端 ID（`app.user.id`）DSH 无面 |
| 12 | 个人 | Appearance | `appearance` | ⚠️ | `AppearanceSection.tsx`（主题/主色 `THEME_COLOR_PRESETS`/`getForegroundColor`、字体/缩放/CSS、`[data-chat-flow-kind]` 消息显示组、窗口组） | 菜单呈现模式、输入区快捷键、部分桌面行；代码执行区（Pyodide）⛔ |
| 13 | 个人 | Notification | `notification` | ✅ | `NotificationSection.tsx`（4 开关） | — |
| 14 | 个人 | Data | `data` | ⚠️ | `data.ts`（本地/WebDAV/坚果云/S3/CCF 导入/Markdown 导出/快照/重置）+ `export-matrix.ts`（Notion/语雀/Obsidian/Joplin/思源 5 目标 Host）+ `DataSection.tsx`（13项/5组 IA） | 导出菜单可见性开关/日志路径/清除缓存/隐私模式为前端细项 |
| 15 | 个人 | Usage | `usage` | ✅ | `UsageSection.tsx`（热力/分布/指标/详情）+ `usage.ts` | — |
| 16 | 自动化 | Channels | `channels` | ⚠️ | `channel-bridge.ts`（6平台 + Agent 绑定/持久会话/180s 超时/重试）+ `ChannelsSection.tsx` | `permissionMode` 已随上游迁至 `agent.permissionMode`，不单独可配 |
| 17 | 自动化 | Scheduled Tasks | `tasks` | ✅ | `tasks.ts` + `TasksSection.tsx` | — |
| 18 | 自动化 | Shortcuts | `shortcut` | ✅ | `ShortcutSection.tsx` | — |
| 19 | 自动化 | Quick Assistant | `quick-assistant` | ⚠️ | `QuickAssistantSection.tsx`（agent-presets 选择器） | 全局唤起球/小窗为 Phase 3 桌面壳 |
| 20 | 自动化 | Selection Assistant | `selection-assistant` | ✅ | `SelectionAssistantSection.tsx` | 桌面 overlay 为 Phase 3 |
| 21 | 自动化 | Screenshot | `screenshot` | ✅ | `ScreenshotSection.tsx` | overlay/原生捕获为 Phase 3 |
| 22 | 系统 | Dependencies | `dependencies` | ⚠️ | `system.ts` `getInfo`/`listDependencies` + 工具探测 `which/where`（ffmpeg/tesseract/git） | 企业/联系外链 |
| 23 | 系统 | About | `about` | ⚠️ | `SystemSection.tsx`（诊断包 5源/更新闭环/发布说明内嵌） | 企业/联系外链 |

## 顶层工作台对位（设置之外）

| Cherry 页面 | 状态 | 本仓落位 |
|---|---|---|
| `home`（聊天） | ⛔ | DSH 原生会话即本体 |
| `agents` | ⚠️ | DSH `agent-presets` 原生拥有，助手市场/编排界面未迁移（快捷助手已接选择器） |
| `paintings` | ✅* | `PaintingWorkspace.tsx` 四组件 + `painting.ts`（参数/错误态逐项待对账） |
| `translate` | ✅* | `TranslationWorkspace.tsx` + `translation.ts`（PDF pdfjs 直填待对账） |
| `knowledge` | ✅* | `KnowledgeWorkspace.tsx` + `knowledge/*` |
| `files` | ⛔ | File Processing 已覆盖，浏览 UI 不重复 |
| `code` | ✅* | `application.surface` repo 工作台 + `system.listCodeClis()` 9 CLI 探测 |
| `miniApps` / `launchpad` | ❌ | 未迁移（P2，`miniApp/` 权限模型+webview） |
| `notes` | ⚠️ | Tiptap3 + FlexSearch CJK + 知识库源 + AI 续写（剩余导出五件套已在 Host 落地） |
| `releaseNotes` | ✅ | 挂在 About 下（`controlCenterUpdate.listReleases()`） |

## 下一刀（按第一性原理）

聊天主界面是灵魂：Phase 1.2 消息块渲染器（`ThinkingBlock`/`ToolBlockGroup`→`conversation.details.tool`/`CitationsList`/`ImageBlock` 等）+ 1.3 列表体验（虚拟列表/吸底/分支导航）为最高权重的体验债，设置面已 ~90% 应让位。按此推进。
