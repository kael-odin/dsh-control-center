# 🎯 Parity Ledger: Cherry Studio → DSH Control Center

> 权威差异台账。Cherry 每一项设置能力的迁移状态。
> 台账基线：Cherry `0bb1725c638bf12d505e9baadaa69f8da47dd05e` (2.0.8)。
> **⚠️ 漂移警示（2026-08-27 核查）**：本地 cherry-studio 已更新至最新 **2.0.9 @ `17390753e3`**（基线后 +134 commits，
> 多为 bugfix/perf，含 code-mate Hermes dashboard、pi-runtime 等）。下述核对结论以 2.0.8 基线为准，逐页复核前先确认目标版本。
> Cherry 图谱已按新 HEAD 重建：`D:\Github_Open\cherry-studio\graphify-out\graph.json`（46,582 节点）。
> DSH 侧：`0.1.1-rc.2`
>
> **复核方式（2026-08-24 更新）**：本版基于两份 graphify 代码知识图谱逐项核实，
> 并对每条结论做了源码二次验证：
> - 本项目：`graphify-out/graph.json`
> - Cherry：`D:\Github_Open\cherry-studio\graphify-out\graph.json`
> - 重建命令：`graphify extract <repo> --code-only --no-viz`（增量改用 `--update`）

## 颜色说明

| 状态 | 含义 |
|------|------|
| ✅ | 完全对等，功能可用 |
| ⚠️ | 部分对等（UI 有但功能受限或缺失子项） |
| ❌ | 缺失（UI 未实现，或只有占位说明） |
| 🔄 | 正在实现中 |
| ⛔ | 不适用（DSH 原生拥有，不必重复） |

---

## 一、设置导航对照 (SettingsPage.tsx ↔ SettingsRoot)

Cherry 侧边栏 5 组 22 项，Control Center 导航已对齐，组顺序和成员一致。

| 组 | Cherry 项 | 状态 | 备注（含证据路径） |
|---|-----------|------|------|
| 核心 | Provider | ✅ | 多 API Key 抽屉（ApiKeyListDrawer.tsx）、模型类型标签、文档链接均已实现 |
| 核心 | Model | ✅ | 默认模型/快捷模型/重试设置已实现；话题命名为 DSH 原生诚实卡（ModelsSection.tsx topicNamingCard）——DSH 会话标题是 loader-only 配置，自定义提示词无法运行时生效（见 harness rc.2 事实） |
| 核心 | Local Models | ✅ | LocalModelsSection + LocalModelDownloads（Qwen3 Embedding / PaddleOCR 卡片） |
| 核心 | API Gateway | ✅ | **网关运行时已实装（2026-08-26）**：`controlCenterGateway` 本地回环 HTTP 服务（仅 127.0.0.1）——`POST /v1/chat/completions`（OpenAI，流式 SSE+非流式）、`POST /v1/messages`（Anthropic，同）、`GET /v1/models`（provider 目录）；`Authorization: Bearer` 鉴权（密钥存 control-center-gateway namespace）；`model` 路由 `provider/model`，缺省落 agent-default-model；客户端断连即中止模型调用。设置页接真实启停/状态卡/URL+密钥+授权头复制。5 条集成测试（路由/401/SSE/[DONE]/Anthropic）。*API 文档页已实装（2026-08-27）：GET /docs（及 /v1/docs）返回自包含 HTML 文档页（连接信息/鉴权/模型路由约定/三端点/curl 示例），loopback 免鉴权，设置页「API 文档」链接直接可用 |
| 能力 | MCP | ⚠️ | **真实子导航（Cherry McpSettingsPage parity，2026-08-24）**：服务器（分栏列表+详情 tab）/ 内置服务器（预设页 + **内置运行时区，2026-08-24**）/ 市场（npx scope 搜索 + 外部市场站点）/ **提供商配置（Bailian 百炼 + ModelScope 托管 MCP 发现）** / **协议安装向导（批量安装确认）**。**内置服务器 9 个 inMemory 已落地 3 个**（sequential-thinking + memory + browser 进程内 MCP 服务器，InMemoryTransport 无外部进程；browser 为 fetch_page 网页抓取→可读文本，SSRF 防护+2MB 上限，2026-08-26）；fetch/filesystem/brave-search/python 映射 DSH 原生能力；dify-knowledge/didi 待实现 |
| 能力 | Skills | ✅ | SkillsSection 资源目录视图 |
| 能力 | Web Search | ✅ | WebSearchSection：提供者配置/高级设置/黑名单 |
| 能力 | File Processing | ✅ | 6 种文档处理器真实分发（2026-08-26）：本地文本/PDF 提取、Mistral OCR（上传→签名 URL→OCR→清理）、Open MinerU 自托管、MinerU/Doc2X/PaddleOCR 文档走持久化远程任务（storage-domain 存储、30 分钟 deadline、重启恢复、取消）。API Key 只存 DSH credentials，settings/导出仅保留引用；每 feature 端点/模型/语言配置；provider 返回的 URL/头/响应体均经白名单与大小校验。缺：system/local-paddleocr 需桌面原生桥 |
| 能力 | OCR | ✅ | 5 种选择同 File Processing：system/tesseract/paddleocr/local-paddleocr/mistral；tesseract 经 DSH subprocess 探测并执行，不可用时返回 needs-runtime 而非伪装成功 |
| 个人 | General | ⚠️ | GeneralCherrySettings.tsx：启动/托盘/省电/开发者模式与 Context Management 均真实可写。**代理组已上线（2026-08-26）**：模式（关闭/系统/自定义）+ 自定义地址 + 绕过列表 + 允许私有网络 + **禁用硬件加速（桌面壳 boot 前消费，重启生效）**，写入 `control-center-general`（Cherry app.proxy.* / app.fetch.allow_private_network / BootConfig.app.disable_hardware_acceleration 键位映射）。Context Management 映射到 DSH：普通工具和 Code Mode 子调用按字符阈值 spill，最近消息窗口以可回放 checkpoint 收缩，自动压缩通过 agent-scoped compaction，压缩模型仅路由 `purpose: compaction` 请求；已由 packed Web profile 多轮会话验证。仍缺：客户端 ID。注意关闭该开关只关闭 Control Center 自定义策略，DSH 原生 overflow recovery 仍可能执行。 |
| 个人 | Appearance | ⚠️ | 主题/颜色/语言/字体/缩放/CSS、**消息字体大小（12–18px stepper）**、**消息显示设置组（宽屏模式/衬线字体/消息样式平铺·气泡/消息轮廓，2026-08-24，经 `[data-chat-flow-kind]` 注入并持久化）**、**窗口组（窗口样式不透明·透明 + 系统标题栏，桌面偏好持久化，2026-08-24）** 已实现。**仍缺**：菜单呈现模式、代码执行（Pyodide，DSH 无此运行时）、输入区快捷键（DSH composer 原生拥有） |
| 个人 | Notification | ✅ | 4 个开关完全对等 |
| 个人 | Data | ⚠️ | IA 已重构为 Cherry 子菜单（13 项/5 组）。本地备份+轮转+恢复、WebDAV 云备份、**坚果云（WebDAV 厂商预设）**、**S3 兼容存储（AWS SigV4 手写签名，无 SDK，2026-08-24）**、Markdown 导出、备份/恢复、数据重置、应用数据路径 均可用。**ChatGPT/Claude 导入已上线（2026-08-26，归档式）**：解析两家导出 JSON → Markdown 归档下载；DSH 无会话导入 RPC 且内部日志为 zstd 事件流，不伪装成原生会话（诚实标签）。**仍缺**：导出菜单可见性、Notion/语雀/Joplin/Obsidian/思源笔记导出、日志路径、清除缓存、隐私模式 |
| 个人 | Usage | ✅ | UsageSection：热力图/分布图/指标条/详情表 |
| 自动化 | Channels | ⚠️ | 六平台全部真实连通（TG/Discord/Slack/QQ/飞书/微信），共享回复管线 + 状态点 + 日志环。**Agent 绑定已上线（2026-08-24）**：每频道可配 `agentProvider`/`agentModel`/`agentSystemPrompt`，绑定后优先于共享默认模型并带自定义系统提示词（对应 Cherry ChannelData.agentId；DSH 无逐会话 agent 编排，故实现为模型+提示词覆盖而非完整 agent 组合）。**仍缺**：permissionMode 逐频道生效接入 |
| 自动化 | Scheduled Tasks | ✅ | TasksSection 任务列表/调度/历史 |
| 自动化 | Shortcuts | ✅ | ShortcutSection 快捷键列表 |
| 自动化 | Quick Assistant | ⚠️ | 启用/托盘点击/剪贴板/模型档位（默认模型 vs 使用助手）已实现 + **「使用助手」模式真实 Agent 预设选择器（2026-08-26）**：`controlCenterAssistant.listAgentPresets()` host 代理 apiProxy.agentPresets，下拉含默认/本地信任标注，列表不可读时回退手输 ID |
| 自动化 | Selection Assistant | ✅ | 选择工具/快捷键/动作列表 |
| 自动化 | Screenshot | ✅ | 启用/快捷键/OCR 开关 |
| 系统 | Dependencies | ⚠️ | 契约包版本列表 + **环境工具检测（ffmpeg/tesseract/git 存在性+版本，host which/where 探测，2026-08-24）**。缺：Node 版本行（getInfo 已有 nodeVersion，可并入） |
| 系统 | About | ⚠️ | 版本/兼容/环境/诊断复制 + **诊断包导出（2026-08-26 起五源：系统信息+浏览器环境+频道状态/日志+能力探测表+插件日志环）** + 检查更新 + **一键更新闭环（2026-08-26：下载 tgz→落盘→dsh plugin add file: 安装，重启生效）** + **发布说明内嵌页** + **链接组**。缺：企业/联系外链。注：Cherry 的 traces 源对应为能力探测表；宿主 stdout 日志 DSH 不落盘，以插件日志环替代 |

---

## 二、顶层应用面对照（设置之外的 Cherry 页面）

> 台账此前只覆盖设置页。以下按 Cherry 顶层路由逐一对照，避免"只迁设置不迁能力"。

| Cherry 页面 | 状态 | 对照说明 |
|---|---|---|
| home（聊天主页） | ⛔ | DSH 原生会话/聊天即本体，不重复实现 |
| agents（Agent 编排/助手） | ⚠️ | DSH 原生拥有 agent-presets 系统；但 Cherry 的助手市场、AgentChat 编排界面未迁移。快捷助手的"使用助手"档依赖此项补齐选择器 |
| paintings（绘画） | ✅* | PaintingWorkspace 已挂载（Artboard/Composer/Showcase/Strip 四组件 + host painting.ts）。*组件级细节对账（参数表单/错误态）尚未逐项做过 |
| translate（翻译） | ✅* | TranslationWorkspace 文本翻译可用（重试策略/fallback/历史面板）+ **PDF 文本提取（客户端 pdfjs，上传 PDF 自动填入输入框，2026-08-24）**。*细节对账未逐项做 |
| knowledge（知识库） | ✅* | KnowledgeWorkspace + knowledge host 模块/codec。*细节对账未逐项做 |
| files（文件管理器） | ⛔/❌ | 文件存储浏览 UI 未迁移；文件处理设置已在 File Processing 覆盖。优先级低（DSH 原生文件能力可评估后标注） |
| code（CodeCliPage） | ✅* | **repo 工作台已挂载（2026-08-26）**：`application.navigation` + `application.surface` 双槽，`system.listCodeClis()` 探测 PATH 上 9 种 AI 编程 CLI（claude/codex/gemini/qwen/kimi/opencode/copilot/dsh/pi）含版本；已检测/未检测分组展示。*Cherry 还有安装/启动管理（mise/npm），我们保持检测优先——安装归操作者的包管理器 |
| miniApps（小程序） | ❌ | 未迁移 |
| launchpad | ❌ | 未迁移 |
| releaseNotes | ✅ | **发布说明内嵌页已迁移（2026-08-26）**：About 页「发布说明」卡片，`controlCenterUpdate.listReleases()` 拉取 GitHub releases（最近 10 条，展示前 5），轻量 markdown 渲染（标题/列表/代码/粗体/链接）+ 预发布标注 + 外链 | Cherry 是独立顶层路由；我们挂在 About 下，信息架构等价 |
| notes（笔记） | ⚠️ | **v2 已迁移（2026-08-27）**：Tiptap 3 富文本编辑器（Markdown 往返序列化）+ **全文搜索**（FlexSearch 内存索引，自定义 CJK 中英编码器，增量维护，搜索栏+命中摘要）。**v3 已迁移（2026-08-27）**：**知识库笔记源**（`addNotesSource` 把 `~/.dsh/notes/` 快照成 'notes' 源 + `syncNotesSource` 重扫+重分块 + 客户端「笔记目录」添加入口 + 「重新同步」按钮）+ **编辑器 AI 续写**（`continueText` 走 `control-center-model-prefs` notesProvider/notesModel，空则回退 `agent-default-model` 路由；客户端「AI 续写」按钮插入光标处）。文件仍存 `<dsh home>/notes/`（Cherry「文件为真相」哲学）。*剩余：笔记导出五件套（P2） |

---

## 三、缺失项明细（按页）

### 1. General — 通用设置

已实现（GeneralCherrySettings.tsx + general-store.ts + context-policy.ts）：开机启动 / 显示托盘 / 关闭到托盘 / 启动到托盘 / 省电模式 / 开发者模式均经 `generalController` 真实写入；Context Management 的启用开关、最近消息数、工具输出字符阈值、自动压缩与压缩模型已映射至 DSH 运行时。顶层和 Code Mode 子工具结果会 spill 为完整结果+有界预览；最近消息窗口保留 tool pair 边界，自动压缩使用 preset-isolated compaction，关闭自动压缩时写入可回放 omission checkpoint。打包 Web profile 的多轮会话测试已验证 summary 与 omission 两条路径。

仍缺（Cherry 存储键 → 目标形态）：

| 行 | Cherry 键 | 说明 |
|---|---|---|
| 代理模式/地址/绕过 | `app.proxy.*` | Selector+Input；UI 先行，host 后接 |
| 允许私有网络 | `app.fetch.allow_private_network` | Switch + InfoTooltip |
| 禁用硬件加速 | `BootConfig.app.disable_hardware_acceleration` | Switch + 重启确认 |
| 客户端 ID | `app.user.id` | DSH 暂无同等的用户标识设置面 |

### 2. Appearance — 外观设置

仍缺：窗口样式、菜单呈现模式、系统标题栏、代码执行三行（⛔ DSH 无 Pyodide，保持诚实标注）、消息显示设置组（消息样式/时间戳等）。

### 3. Data — 数据管理

可用：本地备份+轮转+恢复、WebDAV（PUT/PROPFIND/连接测试/恢复/列表）、**坚果云（WebDAV 厂商预设端点 dav.jianguoyun.com + 应用密码提示 + 独立 `control-center-webdav-nutstore` 命名空间）**、Markdown 导出、快照备份/恢复、数据重置。

仍缺：
- ChatGPT / Claude 导入：需会话导入 API
- 导出菜单可见性：各导出目标开关
- 笔记导出五件套：Notion / 语雀 / Joplin / Obsidian / 思源（host 侧 API 集成）
- 日志路径 / 清除缓存 / 隐私模式

### 4. MCP — 服务器管理

已有：服务器列表分栏布局、真实子导航（服务器/内置服务器[内置运行时+协议预设]/市场/提供商配置/协议安装向导）、Npx 搜索、外部市场站点、进程内内置服务器 2 个已落地。

仍缺：inMemory 内置 server 2 个（dify-knowledge/didi，均需外部服务实例）；QuickCreate 独立对话框（快速导入已覆盖单服务器场景）。

### 5. Channels — 频道

六平台协议层全部连通。唯一结构性缺口：**每频道 Agent 绑定**（Cherry `ChannelData{agentId, workspace, permissionMode}`）。落法：channel-bridge 配置加 agentId/workspace 可选字段，generateAndDeliver 在有绑定时改走指定 agent 的会话而非 agent-default-model 直连；UI 在 ChannelDetail 加选择器。

### 6. 其他小缺口

| 页面 | 缺失项 | 备注 |
|---|---|---|
| ~~Dependencies~~ | ~~Node 版本并入环境工具卡~~ | ✅ 已实现（node 行 + ffmpeg/tesseract/git 检测同卡展示；2026-08-26 核查补记） |
| About | 自动更新安装、诊断日志包（logs/system/traces 三源） | 检查更新/诊断包/外链/**发布说明内嵌页 ✅ 2026-08-26** 已通 |
| Screenshot | OCR 模型状态指示 | 低 |
| ~~File Processing~~ | ~~PaddleOCR 模型选择、语言包、Tesseract 状态~~ | ✅ 2026-08-26（每 feature 模型/端点、语言多选、tesseract resolveExecutable 探测） |

---

## 四、优先级排序（2026-08-24 重排）

### P0 —— 高价值 × 低成本
1. ~~Channels Agent 绑定~~ ✅ 2026-08-24（模型/提示词覆盖 + 频道绑定 UI + 测试）
2. ~~坚果云备份~~ ✅ 2026-08-24（WebDAV 厂商预设 + 独立命名空间 + 测试）
3. ~~Appearance 消息字体大小~~ ✅ 2026-08-24（`[data-chat-flow]` 容器注入 + 12–18px stepper；DSH 消息 DOM 部分内嵌样式可能覆盖，标记 best-effort）
4. ~~General 开发者模式 + 省电 + 启动到托盘~~ ✅ 2026-08-24（三行开关 + store 持久化；桌面侧消费待补）

### P1 —— 中成本，需要 host 配合
5. ~~General 代理模式选择器（UI 先行）+ 上下文管理映射 DSH compaction~~ ✅ 2026-08-26（代理组四行真实可写；上下文映射此前已通）
6. ~~Data S3 备份~~ ✅ 2026-08-24（host SigV4 签名 + 客户端面板 + 测试）
7. ~~Translation PDF 翻译~~ ✅ 2026-08-24（客户端 pdfjs-dist 提取，上传 PDF 直填输入框；CDN workerSrc，需在线）
8. MCP 独立市场页 + 提供商配置子页
9. About 发布说明 + 诊断包导出
10. Channels permissionMode 逐频道生效接入（存储已支持，桥接路由待接）

### P2 —— 低频或需新工作台
10. Data 笔记导出五件套（Notion/语雀/Joplin/Obsidian/思源）
11. ChatGPT/Claude 会话导入
12. ~~Dependencies 环境依赖检查~~ ✅ 2026-08-24（ffmpeg/tesseract/git 检测上线）
13. `'repo'` 工作台挂载（对应 Cherry code 页）；notes / miniApps / launchpad 评估是否值得进 Control Center（部分属 DSH 本体范畴）

---

## 五、迁移原则（不变）

1. **DSH 原生优先**：DSH 已拥有的能力（主题、会话、权限、预设、凭据、插件）不重复实现。
2. **诚实标签**：未实现的能力不展示假开关，用能力状态面板标明"当前平台不支持"。
3. **快照备份**：所有设置数据通过 `controlCenterData` 服务统一导出/导入，凭据由 DSH 凭据库管理。
4. **桌面桥**：文件对话框、本地文件读写通过 `controlCenterDesktop` 桥接，Web 版回退浏览器下载/上传。

## 六、深度集成矩阵（2026-08-24 逐条代码验证）

> 「UI 完成」≠「能力可用」。本节记录每项能力**接入 DSH agent 运行时**的真实状态 —— 编程（会话）中 AI 能否真正使用。

| 能力 | agent 接入 | 机制（代码证据） | 差距 |
|---|---|---|---|
| MCP | ✅ | 每工具注册 `mcp_<serverId>_<tool>` 进 DSH toolService | Cherry 逐工具自动批准无 DSH 对应物（权限是会话级旋钮 ask/never，无逐工具规则）—— 需上游能力 |
| 知识库 | ✅ | `knowledge_retrieve` 工具进 toolService | Cherry 聊天自动引用（RAG 注入）vs 我们仅 agent 主动调工具 —— 需 DSH context-provider |
| Skills | ✅ 间接 | 技能文件写 `~/.dsh/skills/`，DSH 原生技能运行时加载 | 无 |
| 模型路由 | ✅ | provider 页写 DSH 原生 llm-pi-ai 路由（Luna 实测可用） | Cherry 模型精细配置（用途/协议/类型/能力/模态/增量输出/分档价格）我们只有容量字段 |
| 网络搜索 | ✅ | `web_search` 工具注册进 toolService（websearch.ts，2026-08-24）：tavily/exa/zhipu/bocha/searxng 线上分发 + 压缩截断 + 诚实错误；会话实测 agent 真实调用 | jina/firecrawl/querit/exa-mcp 暂无线分发（诚实报错指引切换） |
| 文档处理 | ✅ | `read_document` + `read_document_task` 工具进 toolService（file-processing.ts，2026-08-26）：统一 resolve→validate→dispatch；文本/PDF 本地提取、Tesseract、Mistral、PaddleOCR 图片同步完成；MinerU/Doc2X/PaddleOCR 文档返回持久任务 id，重启后从 storage-domain 恢复轮询并重新解析凭据 | system/local-paddleocr 需桌面运行时；远程任务依赖 storage-domain 就绪 |
| OCR | ✅ | 同 read_document 统一分发：图片按 feature 走默认 OCR 处理器，不可用处理器返回准确 capability 状态 | 云端 OCR 需配置对应 Key |
| 频道 | ✅ | 六平台桥连通。**绑定 Agent 的频道回复已走完整 DSH agent loop（2026-08-26）**：`ctx.apiProxy.sessions` 进程内路径 —— 每频道一个持久会话，绑定路由经 selectModel 应用一次，prompt 后轮询 history 收集 `turn/end`+`assistant/message` 文本；MCP 工具/知识库/web_search 在频道回复中真实可用（Cherry 频道完整能力对齐）。逐频道串行化、180s 超时、任何失败回退裸 LLM + Cherry 重试设置。系统提示词以首条消息运营者指令块注入并随会话记忆持续生效。**会话 ID 已持久化到频道 config（agentSessionId），重启探测恢复延续上下文（2026-08-26）**。**绑定表单已暴露 Agent 预设选择器（2026-08-26）**，config.agentPresetId 直通 session create | 无结构性缺口 |

**结论**：设置面接近完成，深度集成八条能力线全部打通（2026-08-26 频道 agent loop 落地）。下一阶段主攻顶层工作台与逐页视觉打磨。插件化章程见 `docs/PLUGINIZATION.md`（§1.1 能力探测表已于 2026-08-26 落地：`controlCenterCompat.probe()`，探测结果随诊断包导出）。

## 六·补、Channels Agent 绑定实施记录（2026-08-26）

- **入口**：`ChannelBridgeService.replyPipeline`（channel-bridge.ts）—— 有 `agentProvider`/`agentModel` 绑定且宿主挂载了 apiProxy 时走 `generateViaAgentLoop`，否则原裸 LLM 管线。
- **会话生命周期**：每频道每进程一个 durable session（`sessions.create({ agentPreset? })`），断开频道时清理映射；重启后新建（上下文延续待做）。
- **模型路由**：绑定路由经 `selectModel` 每 session 应用一次，缓存在 `sessionRoutes`。
- **回复采集**：prompt 前记 history 尾 seq 为 baseline；每 1.5s 读 tail，见 `turn/end(seq>baseline)` 后收集该 turn 的 `assistant/message` 文本；completed 返回、error 抛出消息、aborted/blocked 视为失败。
- **健壮性**：逐频道 Promise 链串行化；180s 超时；channel abort 即刻退出；任何失败回退裸 LLM（绑定路由仍优先于共享默认路由）+ Cherry 重试设置。
- **测试**：channel-reply.spec.ts 新增两条 —— agent 会话端到端采集（selectModel/prompt/history 断言 + 直连 LLM 未被调用）、session create 失败回退直连。

## 七、模型编辑器精细化方案

Cherry 编辑模型含：用途（对话/图像生成/图像编辑）、对话协议、类型标签（文本/图片/嵌入/重排）、能力（推理/工具）、输入模态（视觉/音频/视频）、上下文窗口、最大输入/输出、增量输出、币种+分档价格（含缓存读写价）。我们仅有 ID/名称/分组+容量。

**落地方案**：① schema 扩展 capabilities 增加 reasoning/audio/video，新增 usage/pricing/incrementalOutput 可选字段；② ModelListEditor 加「更多设置」折叠区（能力开关组+用途+价格分档）。

**✅ Host 层已实装（2026-08-27）**：`ModelView`/`ModelRecord`/`UpdateModelDto` 扩展（capabilities.reasoning/audio/video、maxInputTokens、incrementalOutput、purpose、protocol、typeLabels、pricing{currency,input,output,cacheRead,cacheWrite}），`updateModel` 合并可选字段 + `modelToView` 统一投影 + 集成测试（discover→update→round-trip→partial）。**⏳ UI 层待做**：ModelListEditor「更多设置」折叠区（需把 provider record 的 ModelView 元数据穿线进 pi-ai 编辑器 + `updateModel` RPC 落点 + 视觉验证）。

## 八、完成度评估（2026-08-24 代码级核查）

- **设置面 UI/UX**：~90%（22 项设置全有对应区+导航 IA 对齐；缺精细模型编辑、provider 目录树展开、部分桌面行）
- **深度集成**：~95%（MCP/知识库/技能/模型/网络搜索/文档处理/OCR/频道 八条全通；频道回复 2026-08-26 起走完整 agent loop）
- **顶层工作台**：~60%（翻译/绘画/知识库可用 + code CLI 探测工作台 2026-08-26 挂载；notes/miniApps/launchpad 未迁移）
- **整体加权**：~85%。深度集成与插件化章程收口后，剩余为顶层工作台补齐与逐页视觉打磨。

## 九、打磨方向（按 Cherry 实际视觉逐页对照）

1. Provider 目录树：Cherry 的智谱/MiniMax 可展开子选项 —— 我们平铺。需 registry children 结构 + 展开交互
2. 模型编辑器精细化（第七节）
3. 频道详情分组布局对照 Cherry ChannelDetail
4. 逐页文案清理（已清 3 处，继续扫全库）
5. ~~原生控件主题适配（checkbox/radio/progress）~~ ✅ 2026-08-27（`accent-color: var(--primary)` 提到 `.cc-surface` 一处声明，继承覆盖全部 14 个原生控件；此前仅 5 处 module 各自重复声明，其余走 UA 蓝）

## 九·补、设计系统修正（2026-08-27）

一轮以「令牌是否真的生效」为口径的核查，三类静默失效都已修 + 加护栏：

1. **未定义令牌 13 处 / 7 个名字**（`--cc-text-primary`、`--cc-text-secondary`、`--foreground-secondary`、`--danger`、`--danger-border`、`--border-input`、`--link`）。无兜底的 5 处整条声明作废（本该淡化的说明文字以全对比度渲染）；有兜底的把错误态伪装成中性态（`UpdateSection` 安装失败通知与普通通知同色）。
2. **`NotesWorkspace` 缺 `cc-surface`**：作为独立 `application.surface` 却用 `SettingsPageShell`（只有布局，无令牌作用域），28 处 `var(--…)` 全部无法解析；自定义 CSS 对笔记页也随之失效。
3. **CSS module 引用悬空 25 处**：`css.x` 在类型上永远合法，缺失时 React 收到 `className={undefined}`，元素以 UA 默认样式渲染、无任何报错。其中 provider 编辑器一族 15 个类（`.primaryButton` / `.editor*` / `.customized*` / `.candidate` / `.fetchDialog`）从 DSH 上游 `packages/client/ui-settings-models` 补齐并把 `--dsw-alias-*` 映射到 Cherry 契约——**每张 provider 卡片的「保存」按钮此前都是无样式的原生按钮**（截图发现）。`ShortcutSection` 的 `rowBorder` 是真死引用（分隔线已由 `.row + .row` 画），改为删除而非补样式。

**主题色**：默认色 `#00b96b` → `#8B5CF6`（仍在 Cherry 自己的 preset 列表内）。并补上 Cherry 的 `getForegroundColor`（WCAG 2.0 相对亮度，阈值 0.179）派生 `--primary-foreground`——Cherry 的 5 个 preset **全部**落在阈值之上取黑字，而我们此前固定近白，白字压 `#00b96b` 仅 2.6:1，不达 WCAG AA。深色块 `body[data-ds-dark-theme] .cc-surface` 特异性更高且重声明 `--cs-primary-foreground`/`--cs-ring`，故覆写层同时按该特异性重述；深色 `--cs-ring` 原为硬编码绿，改为从 `--cs-primary` 派生。实测（`tests/probe-theme.ts`）明暗两版均 `#8B5CF6` + 派生黑字 + 对比度 4.96:1 过 AA。

**护栏**（`pnpm run test` 内）：
- `packages/control-center/tests/design-tokens.spec.ts` —— 令牌必须已定义；每个 `application.surface` 必须建立它消费的 `cc-surface`；`getForegroundColor` 与 Cherry 逐 preset 对齐；宿主侧 schema 默认色与客户端默认同步
- `packages/control-center/tests/css-module-refs.spec.ts` —— 组件读的每个 CSS 类都必须在对应样式表里声明
- `tests/probe-theme.ts` —— 明暗双版截取外观页 + on-primary 对比度断言（< 4.5:1 直接失败）

**打包链路**：`tests/prepare-bundle-pack.ts` 此前只覆写 `dependencies`，而 `workspace:*` 声明在 `devDependencies`，`pnpm pack` 无法解析 workspace 协议 → `pack:check` 尾段一直失败；且硬编码 `0.1.0` 而两包已是 `0.3.0`。四处探针/E2E 同样硬编码 `0.1.0`，统一收敛到 `tests/packs.ts`（按前缀取 mtime 最新，避免 0.9.0/0.10.0 字典序坑）。`pack:check` 现已通。

## 十、图谱复核方法

- 回答架构/能力问题前先查图：`graphify query "<问题>" --graph <repo>/graphify-out/graph.json`
- 代码变更后增量刷新：`graphify extract <repo> --code-only --update`


- 回答架构/能力问题前先查图：`graphify query "<问题>" --graph <repo>/graphify-out/graph.json`
- 定位两个概念间调用链：`graphify path "A" "B"`
- 代码变更后增量刷新：`graphify extract <repo> --code-only --update`（无需 LLM）
- 本台账每次批量更新前，先用图谱枚举 Cherry 对应页面的组件清单，再逐条到源码验证状态，最后回写本文件并注明日期。
