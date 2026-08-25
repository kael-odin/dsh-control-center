# 🎯 Parity Ledger: Cherry Studio v2.0.8 → DSH Control Center v0.1.0

> 权威差异台账。Cherry 每一项设置能力的迁移状态。
> 基线：Cherry `0bb1725c638bf12d505e9baadaa69f8da47dd05e` (2.0.8) —— 本地仓库 HEAD 与基线一致，无漂移；DSH `0.1.1-rc.2`
>
> **复核方式（2026-08-24 更新）**：本版基于两份 graphify 代码知识图谱逐项核实，
> 并对每条结论做了源码二次验证：
> - 本项目：`graphify-out/graph.json`（5,886 节点 / 11,711 边）
> - Cherry：`D:\Github_Open\cherry-studio\graphify-out\graph.json`（46,039 节点 / 118,538 边）
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
| 核心 | API Gateway | ✅ | ApiGatewaySection：状态卡/端口/凭据/文档/启停 |
| 能力 | MCP | ⚠️ | **真实子导航（Cherry McpSettingsPage parity，2026-08-24）**：服务器（分栏列表+详情 tab）/ 内置服务器（预设页 + **内置运行时区，2026-08-24**）/ 市场（npx scope 搜索 + 外部市场站点）/ **提供商配置（Bailian 百炼 + ModelScope 托管 MCP 发现）** / **协议安装向导（批量安装确认）**。**内置服务器 9 个 inMemory 已落地 2 个**（sequential-thinking + memory 进程内 MCP 服务器，InMemoryTransport 无外部进程，2026-08-24）；fetch/filesystem/brave-search/python 映射 DSH 原生能力；dify-knowledge/browser/didi 待实现 |
| 能力 | Skills | ✅ | SkillsSection 资源目录视图 |
| 能力 | Web Search | ✅ | WebSearchSection：提供者配置/高级设置/黑名单 |
| 能力 | File Processing | ⚠️ | 处理器目录+API Key+本地模型。缺：PaddleOCR 模型选择/语言包/Tesseract 运行时检测 |
| 能力 | OCR | ✅ | 同 File Processing |
| 个人 | General | ⚠️ | GeneralCherrySettings.tsx：启动组 3 行开关（launchOnBoot/trayEnabled/trayOnClose）真实可写；代理组/上下文管理为诚实 Note 占位。缺：代理模式选择器、上下文压缩映射、省电、硬件加速、开发者模式行 |
| 个人 | Appearance | ⚠️ | 主题/颜色/语言/字体/缩放/CSS、**消息字体大小（12–18px stepper）**、**消息显示设置组（宽屏模式/衬线字体/消息样式平铺·气泡/消息轮廓，2026-08-24，经 `[data-chat-flow-kind]` 注入并持久化）**、**窗口组（窗口样式不透明·透明 + 系统标题栏，桌面偏好持久化，2026-08-24）** 已实现。**仍缺**：菜单呈现模式、代码执行（Pyodide，DSH 无此运行时）、输入区快捷键（DSH composer 原生拥有） |
| 个人 | Notification | ✅ | 4 个开关完全对等 |
| 个人 | Data | ⚠️ | IA 已重构为 Cherry 子菜单（13 项/5 组）。本地备份+轮转+恢复、WebDAV 云备份、**坚果云（WebDAV 厂商预设）**、**S3 兼容存储（AWS SigV4 手写签名，无 SDK，2026-08-24）**、Markdown 导出、备份/恢复、数据重置、应用数据路径 均可用。**仍缺**：ChatGPT/Claude 导入、导出菜单可见性、Notion/语雀/Joplin/Obsidian/思源笔记导出、日志路径、清除缓存、隐私模式 |
| 个人 | Usage | ✅ | UsageSection：热力图/分布图/指标条/详情表 |
| 自动化 | Channels | ⚠️ | 六平台全部真实连通（TG/Discord/Slack/QQ/飞书/微信），共享回复管线 + 状态点 + 日志环。**Agent 绑定已上线（2026-08-24）**：每频道可配 `agentProvider`/`agentModel`/`agentSystemPrompt`，绑定后优先于共享默认模型并带自定义系统提示词（对应 Cherry ChannelData.agentId；DSH 无逐会话 agent 编排，故实现为模型+提示词覆盖而非完整 agent 组合）。**仍缺**：permissionMode 逐频道生效接入 |
| 自动化 | Scheduled Tasks | ✅ | TasksSection 任务列表/调度/历史 |
| 自动化 | Shortcuts | ✅ | ShortcutSection 快捷键列表 |
| 自动化 | Quick Assistant | ⚠️ | 启用/托盘点击/剪贴板/模型档位（默认模型 vs 使用助手）已实现 + **「使用助手」模式下的 Agent 预设 ID 输入框（2026-08-24，可升级为真实选择器）**。缺：真实助手选择器（下拉列表） |
| 自动化 | Selection Assistant | ✅ | 选择工具/快捷键/动作列表 |
| 自动化 | Screenshot | ✅ | 启用/快捷键/OCR 开关 |
| 系统 | Dependencies | ⚠️ | 契约包版本列表 + **环境工具检测（ffmpeg/tesseract/git 存在性+版本，host which/where 探测，2026-08-24）**。缺：Node 版本行（getInfo 已有 nodeVersion，可并入） |
| 系统 | About | ⚠️ | 版本/兼容/环境/诊断复制 + **诊断包导出（JSON bundle含系统信息+浏览器环境+频道状态/日志，2026-08-24）** + 检查更新（GitHub releases轮询+releaseUrl外链）+ **链接组（发布说明/仓库/反馈，2026-08-24）**。缺：自动更新下载安装、发布说明页（内嵌）、诊断日志包（Cherry DiagnosticBundleDialog logs/system/traces 三源）、企业/联系外链 |

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
| code（CodeCliPage） | ❌ | 未迁移。product-workspace-contract.ts 已预留 `'repo'` workspace id 但从未注册 —— 天然的挂载点 |
| miniApps（小程序） | ❌ | 未迁移 |
| launchpad | ❌ | 未迁移 |
| releaseNotes | ❌ | 未迁移（About 页缺发布说明子项） |
| notes（笔记） | ❌ | 未迁移 |

---

## 三、缺失项明细（按页）

### 1. General — 通用设置

已实现（GeneralCherrySettings.tsx + general-store.ts）：开机启动 / 显示托盘 / 关闭到托盘（3 行 Switch，经 generalController 真实写路径）；代理与上下文管理为诚实 Note。

仍缺（Cherry 存储键 → 目标形态）：

| 行 | Cherry 键 | 说明 |
|---|---|---|
| 启动到托盘 | `app.tray.on_launch` | 与 trayEnabled/trayOnClose 同组，补一行即可 |
| 省电模式 | `app.power.prevent_sleep_when_busy` | Switch，需 host 电源策略 |
| 代理模式/地址/绕过 | `app.proxy.*` | Selector+Input；UI 先行，host 后接 |
| 允许私有网络 | `app.fetch.allow_private_network` | Switch + InfoTooltip |
| 禁用硬件加速 | `BootConfig.app.disable_hardware_acceleration` | Switch + 重启确认 |
| 最大消息数/上下文压缩 | `chat.context_settings.*` | 映射到 DSH compaction 配置 |
| 开发者模式/客户端 ID | `app.developer_mode.enabled` / `app.user.id` | 最简单的两行 |

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

仍缺：inMemory 内置 server 3 个（dify-knowledge/browser/didi）；QuickCreate 独立对话框（快速导入已覆盖单服务器场景）。

### 5. Channels — 频道

六平台协议层全部连通。唯一结构性缺口：**每频道 Agent 绑定**（Cherry `ChannelData{agentId, workspace, permissionMode}`）。落法：channel-bridge 配置加 agentId/workspace 可选字段，generateAndDeliver 在有绑定时改走指定 agent 的会话而非 agent-default-model 直连；UI 在 ChannelDetail 加选择器。

### 6. 其他小缺口

| 页面 | 缺失项 | 备注 |
|---|---|---|
| Dependencies | Node 版本并入环境工具卡 | ffmpeg/tesseract/git 检测已上线 |
| About | 自动更新安装、发布说明页（内嵌）、诊断日志包（logs/system/traces 三源） | 检查更新/诊断包/外链已通 |
| Screenshot | OCR 模型状态指示 | 低 |
| File Processing | PaddleOCR 模型选择、语言包、Tesseract 状态 | 低 |

---

## 四、优先级排序（2026-08-24 重排）

### P0 —— 高价值 × 低成本
1. ~~Channels Agent 绑定~~ ✅ 2026-08-24（模型/提示词覆盖 + 频道绑定 UI + 测试）
2. ~~坚果云备份~~ ✅ 2026-08-24（WebDAV 厂商预设 + 独立命名空间 + 测试）
3. ~~Appearance 消息字体大小~~ ✅ 2026-08-24（`[data-chat-flow]` 容器注入 + 12–18px stepper；DSH 消息 DOM 部分内嵌样式可能覆盖，标记 best-effort）
4. ~~General 开发者模式 + 省电 + 启动到托盘~~ ✅ 2026-08-24（三行开关 + store 持久化；桌面侧消费待补）

### P1 —— 中成本，需要 host 配合
5. General 代理模式选择器（UI 先行）+ 上下文管理映射 DSH compaction
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
| 网络搜索 | ❌ 仅存设置 | websearch.ts 无 tools.register | 需注册 web_search 工具把配置的提供方接到 agent |
| 文档处理 | ❌ 仅存设置 | file-processing.ts 无 tools.register | 需注册文档解析工具 |
| OCR | ❌ 仅存设置 | 同 file-processing | 同上 |
| 频道 | ⚠️ | 六平台桥连通；回复是裸 LLM + 模型/提示词覆盖 | 频道回复不走 agent loop，**不能调 MCP 工具/知识库**（Cherry 频道有完整能力） |

**结论**：设置面接近完成，**深度集成（能力→agent 运行时）是下一阶段主战场**。

## 七、模型编辑器精细化方案

Cherry 编辑模型含：用途（对话/图像生成/图像编辑）、对话协议、类型标签（文本/图片/嵌入/重排）、能力（推理/工具）、输入模态（视觉/音频/视频）、上下文窗口、最大输入/输出、增量输出、币种+分档价格（含缓存读写价）。我们仅有 ID/名称/分组+容量。

**落地方案**：① schema 扩展 capabilities 增加 reasoning/audio/video，新增 usage/pricing/incrementalOutput 可选字段；② ModelListEditor 加「更多设置」折叠区（能力开关组+用途+价格分档）。

## 八、完成度评估（2026-08-24 代码级核查）

- **设置面 UI/UX**：~90%（22 项设置全有对应区+导航 IA 对齐；缺精细模型编辑、provider 目录树展开、部分桌面行）
- **深度集成**：~60%（MCP/知识库/技能/模型四条通；搜索/文档/OCR 仅存设置；频道无工具调用）
- **顶层工作台**：~40%（翻译/绘画/知识库可用；code/notes/miniApps/launchpad 未迁移）
- **整体加权**：~75%。下一阶段主攻深度集成与顶层工作台，同时逐页打磨视觉与文案。

## 九、打磨方向（按 Cherry 实际视觉逐页对照）

1. Provider 目录树：Cherry 的智谱/MiniMax 可展开子选项 —— 我们平铺。需 registry children 结构 + 展开交互
2. 模型编辑器精细化（第七节）
3. 频道详情分组布局对照 Cherry ChannelDetail
4. 逐页文案清理（已清 3 处，继续扫全库）
5. 原生控件主题适配继续排查（checkbox/radio/progress）

## 十、图谱复核方法

- 回答架构/能力问题前先查图：`graphify query "<问题>" --graph <repo>/graphify-out/graph.json`
- 代码变更后增量刷新：`graphify extract <repo> --code-only --update`


- 回答架构/能力问题前先查图：`graphify query "<问题>" --graph <repo>/graphify-out/graph.json`
- 定位两个概念间调用链：`graphify path "A" "B"`
- 代码变更后增量刷新：`graphify extract <repo> --code-only --update`（无需 LLM）
- 本台账每次批量更新前，先用图谱枚举 Cherry 对应页面的组件清单，再逐条到源码验证状态，最后回写本文件并注明日期。
