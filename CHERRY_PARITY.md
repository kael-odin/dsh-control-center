# CHERRY_PARITY.md — DSH Control Center × Cherry Studio 功能对标清单

> **用途**：给新开的对话窗口做"逐节对标 Cherry Studio"的落地清单。逐行可执行、可勾选。
> **生成**：2026-08-21 · **Cherry 基线**：2.0.8（commit `0bb1725c63`），本地参照 `D:\Github_Open\cherry-studio`（只读，禁止修改）
> **配套**：`docs/ROADMAP.zh.md`（为什么、顺序、怎么算做完）——本表只管"每一节有哪些控件、现状、待办、完成标准"。
>
> **给新窗口的用法**：打开新对话后先 `Read` 本文件 + `docs/ROADMAP.zh.md`，从 `§2 P0` 开工。完成一节后把该节"现状"列更新为 ✅ 并提交。

---

## 0. 使用说明（每个新窗口先读）

### 0.1 铁律
1. **禁止 mock、假数据、静默 no-op、伪造能力。**
2. **每个控件要么接真实 DSH host 能力，要么诚实标"当前平台不支持"。**
3. **用户 profile 数据不留测试探针残留**（测试后清理）。
4. 每节交付前：`pnpm run check` + `pnpm run test:browser`（涉及桌面加 smoke），一节一 commit。
5. `deepseek-harness` / `cherry-studio` 保持官方源零修改；本地 cherry-studio 是唯一视觉/行为参照。

### 0.2 状态图例
| 标记 | 含义 |
|------|------|
| ✅ | 已对齐：真实接线，行为一致 |
| 🔶 | 部分：有实现，与 Cherry 有差距（表中注明差距） |
| ⬜ | 未做/占位：无真实能力，或仅本地持久化占位 |
| 🚧 | 待核验：存在实现，深度未核验（新窗口第一步：跑起来看） |

### 0.3 对标四步（每节）
1. **取参照**：打开 `cherry-studio` 对应参照文件，录下控件行为。
2. **能力映射**：控件 → 真实 DSH host 能力；没有则做成 DSH 服务，否则诚实标不支持。
3. **实现 + 单测 + E2E**。
4. **一节一 commit**，message 注明对齐的 Cherry section。

### 0.4 完成标准
同一操作路径、真实生效（不要求像素级）。像素其次，能力真实是底线。

---

## 1. 总览：Cherry 设置入口 ↔ control-center 现状

| 分组 | Cherry 入口 | Cherry 路由 | control-center section（id） | 优先级 | 现状 |
|------|------------|------------|-------------------------------|--------|------|
| （核心） | 模型服务 | `/settings/provider` | `providers`（ProviderDirectorySection） | **P0** | ✅ 两栏目录 + 细节控件全量对齐（启用开关/检测/请求选项/拖拽排序） |
| （核心） | 模型 | `/settings/model` | `models`（ModelsSection：模型选择 + 工作区偏好） | **P0** | ✅ Cherry ModelSettings 对齐（默认/当前/快捷/翻译/绘画/重试全量） |
| （核心） | 本地模型 | `/settings/local-models` | `local-models`（LocalModelsSection） | P0 | ✅ controlCenterLocalModels |
| （核心） | 网关 | `/settings/api-gateway` | `api-gateway`（ApiGatewaySection） | P0 | ✅ 真实（web 诚实标注） |
| 能力 | MCP | `/settings/mcp` | `mcp`（McpSection） | T1 | ✅ split-pane + 快速导入 + Npx 市场 + **内置服务器目录**（4 个外部可达预设；Cherry 的 9 个 inMemory 内置运行于其自有运行时，诚实未列）+ **更多市场**（7 站外链，同 Cherry 更多市场列表）|
| 能力 | 技能 | `/settings/skills` | `skills`（SkillsSection） | T1 | ✅ 本地目录导入 + **在线市场搜索/安装** 真实接线（三注册表并发、GitHub 目录安装器）；Web 门控仅剩 ZIP |
| 能力 | 联网搜索 | `/settings/websearch` | `websearch`（WebSearchSection） | T1 | ✅ 真实 |
| 能力 | 文件处理 | `/settings/file-processing` | `processor`（ProcessorSection） | T1 | ✅ controlCenterFileProcessing |
| 能力 | OCR | `/settings/ocr` | `processor`（ProcessorSection） | T1 | ✅ 同上 |
| 个人 | 通用 | `/settings/general` | `general`（GeneralSection） | T1 | 🚧 原生（DSH 拥有） |
| 个人 | 外观 | `/settings/appearance` | `appearance`（AppearanceSection） | T1 | ✅ 权威设置已对齐 |
| 个人 | 通知 | `/settings/notifications` | `notifications`（NotificationSection） | T1 | ✅ 真实 |
| 个人 | 数据管理 | `/settings/data` | `data`（DataSection） | T1 | 🔶 真实，覆盖面窄（无 WebDAV/第三方） |
| 个人 | 用量 | `/settings/usage` | `usage`（UsageSection） | T1 | ✅ 真实（真实记录 tokens） |
| 自动化 | 频道 | `/settings/channels` | `channels`（ChannelsSection） | T2 | 🔶 Telegram 端到端真实可用：长轮询接收 + **允许会话校验 + 默认模型自动回复（sendMessage 回传）** + 实时状态/日志；其余五平台协议待接（QQ/微信/Discord/Slack/飞书各自协议栈不同，逐个接入）|
| 自动化 | 定时任务 | `/settings/scheduled-tasks` | `tasks`（TasksSection） | T2 | ✅ controlCenterTasks + host scheduler |
| 自动化 | 快捷键 | `/settings/shortcut` | `shortcuts`（ShortcutSection） | T2 | 🔶 localStorage；应用内绑定真，全局标桌面 |
| 自动化 | 快捷助手 | `/settings/quick-assistant` | `quick-assistant`（QuickAssistantSection） | T2 | 🔶 本地持久化，悬浮窗需桌面 |
| 自动化 | 划词助手 | `/settings/selection-assistant` | `selection-assistant`（SelectionAssistantSection） | T2 | 🔶 本地持久化，系统捕获需桌面 |
| 自动化 | 截图 | `/settings/screenshot` | `screenshot`（ScreenshotSection） | T2 | 🔶 本地持久化，web 不能截屏 |
| 系统 | 依赖 | `/settings/dependencies` | `dependencies`（DependenciesSection） | T2 | ✅ 真实 |
| 系统 | 关于 | `/settings/about` | `about`（AboutSection） | T2 | ✅ 真实 |
| 系统 | 更新（control-center 独有） | — | `update`（UpdateSection） | T2 | ✅ 真实 |

> 注：Cherry 入口清单来自 `cherry-studio/src/renderer/pages/settings/SettingsPage.tsx`；control-center section 来自 `packages/control-center/src/client/index.ts` 的 slot 注册。

---

## 2. P0 — 模型服务 + 模型选择（门户，先做）

**两个 bug 根因（已读源码确认；已于 2026-08-22 修复）**
- **Bug A「没有内置供应商」**：模型服务页行全部来自 `store.ts:140` 的 `api.llm.providers({})`（host LLM 适配器目录）。`provider-presets.ts` 的 **61 个预设从未经 `ctx.llm.registerAdapter()` 注册进 host**（全仓 grep 0 命中）→ 全新 profile 目录空 → `addable` 空 → 加号禁用（`ModelsSection.tsx:466`）→ 页面空列表。
  - **修复**：新增 `ProviderDirectorySection` 两栏页面，左栏以**客户端静态目录**呈现 61 预设（见 §2.1 设计决策——不注册进 host 目录，避免与 `llm-pi-ai` 冲突），配置状态从 `llm.providers()` 真实 join。
- **Bug B「点其它供应商切不到配置面板」**：add-flow 卡片只在 `state.namespaces.get(settingsNs)` 能解析时渲染（`ModelsSection.tsx:403`）；且当前 UI **没有 Cherry 的左栏供应商目录**，"左点右切"路径在结构上不存在。
  - **修复**：两栏布局天然实现「左点右切」；选中持久化 `settings.provider.last_selected_provider_id`，右栏随选择切换。

**目标布局（对齐 Cherry `ProviderSettingsPage.tsx`）**
```
┌─────────────────────┬─────────────────────────────────────┐
│ ProviderList 左栏    │ ProviderSetting 右栏（随选择切换）     │
│ 分组/搜索/添加/右键   │ Header + 认证区 + 模型列表            │
└─────────────────────┴─────────────────────────────────────┘
```

### 2.1 内置供应商目录（61/61，客户端静态目录 + `llm.providers()` 状态 join）

- **结论**：`provider-presets.ts` 的 61 个预设覆盖 Cherry 供应商目录 **61/61**（逐项核对见附录 A）。目录以**客户端静态目录**呈现（对齐 Cherry 的静态 provider registry），配置/活跃/凭据状态从 `llm.providers()` 真实 join。
- **设计决策（零冲突）**：**不**把 61 预设注册进 host `llm` 目录。原因：harness 自带 `llm-pi-ai` 插件已拥有自己的 catalog 路由，并会在任何 profile 写入时把该路由重新声明进自己的目录——控制中心再注册同一路由会抛 `DUPLICATE_DIRECTORY`（整包拒绝），且挂载顺序反了会让 pi-ai 整插件被卸载。Cherry 界面配置与 `settings.yaml` 的 `llm-pi-ai:` 段写**同一份 profile**（`llm-pi-ai.providers.<id>`），DSH 预置方法与界面两条路径共存、**互不冲突**。
- **已完成**：
  - [x] 两栏 `ProviderDirectorySection`：左栏 61 预设（国内 29 / 国际 27 / 本地 5，分组渲染）+ 搜索 + 添加自定义（`CustomProviderCard`）+ 已配置状态点；右栏 `ProviderEditor`（API key / baseURL / 协议 / 模型列表 / 获取可用模型）。
  - [x] 凭据走 DSH credentials（`credentials.set/unset`），配置走 `llm-pi-ai` 命名空间（DSH 预置同一存储）。
  - [x] 预设 `defaults` 预填：无存量 profile 时自动写入 preset 的 baseURL + 协议（`openai-completions` / `anthropic-messages`），apply 写出完整 profile（单测证明）。
  - [x] 特殊认证诚实呈现：`google`/`azure` 标「不支持完整 IAM/SSO，以 API key/baseURL 呈现」；`ollama` 标「原生 API 不兼容 OpenAI」。
- **完成标准**：全新 profile 打开模型服务页，左栏列出 61 个供应商（分组），右侧可配任一供应商并真实发起连接测试（「获取可用模型」走 `llm.discoverModels` 真实探测）。✅（浏览器 E2E 通过）

### 2.2 左栏 ProviderList

Cherry 参照：`cherry-studio/src/renderer/pages/settings/ProviderSettings/ProviderList/`（ProviderList.tsx / ProviderListContent.tsx / ProviderListGroup.tsx / ProviderListSearchField.tsx / ProviderListItemWithContextMenu.tsx / ProviderEditorDrawer.tsx / providerGrouping.ts / providerFilterMode.ts）

| # | Cherry 控件/能力 | Cherry 行为要点 | control-center 现状 | 需要的 DSH 能力 | 待办 | 完成标准 |
|---|------------------|-----------------|---------------------|------------------|------|----------|
| 2.2.1 | 供应商列表 | 左栏全量目录，**扁平列表**（2.0.8 无国内/国际分组头；仅同 preset 多部署折叠），品牌图标 + 名称 + 启用绿点，点击选中并持久化 `last_selected_provider_id` | ✅ `ProviderDirectorySection` 左栏：扁平 61 预设 + host 目录行，Cherry 生成的品牌图标（provider-icons-data）、绿点、muted 选中态、免费 徽章、选中持久化 | `llm.providers()`（状态 join） | 后续：拖拽排序 | 点任一供应商，右栏切换并刷新后保持选中 ✅ |
| 2.2.2 | 搜索 | ProviderListSearchField 过滤列表 | ✅ 搜索框内置放大镜与清除按钮，本地过滤（id/name） | 同上 | — | 输入关键字过滤列表 ✅ |
| 2.2.3 | 添加自定义 | ProviderEditorDrawer：创建自定义供应商（名称/baseURL/API 类型） | ✅ 左栏底部「添加自定义」→ `CustomProviderCard`（声明到 llm-pi-ai） | 已有 llm-pi-ai 声明能力 | — | 自定义供应商出现在目录并可在右栏编辑 ✅ |
| 2.2.4 | 右键菜单 | ProviderListItemWithContextMenu：编辑 / 删除 / 启用 | ✅ 行悬停 kebab → Menu（编辑 / 删除，删除为 danger 项）：删除按「凭据 → live profile → stash 拷贝」顺序移除且每步可重试，带确认对话框；未配置预设的删除项禁用 | 已有 | 后续：原生右键（contextmenu）触发 | 右键供应商出现编辑/删除菜单 ✅ |
| 2.2.5 | 启用开关 | 每个供应商可整体禁用 | ✅ 右栏 Header 真实 Switch：禁用 = 完整 profile 存入 `control-center-provider-stash` 再 unset 路由（适配器真实停服）；启用 = 原样恢复。未配置的手声明预设禁用开关并给诚实提示；整段路由（llm-deepseek）不可切 | settings 双命名空间事务（两次 mutate 串接 revision） | — | 切换后目录项真实禁用/恢复 ✅ |

### 2.3 右栏 ProviderSetting

Cherry 参照：`.../ProviderSettings/ProviderSetting.tsx`、`.../components/ProviderHeader.tsx`、`.../ConnectionSettings/`、`.../ModelList/`

| # | Cherry 能力 | Cherry 行为要点 | control-center 现状 | 待办 | 完成标准 |
|---|-------------|-----------------|---------------------|------|----------|
| 2.3.1 | ProviderHeader | 名称（可链官网）+ 启用 Switch + 闪电图标打开 API 选项抽屉 | ✅ 右栏 Header：品牌头像 + 名称（外链 registry 官网）+ **闪电按钮 → 请求选项对话框**（编辑 pi-ai 真实 `headers` 字典，空即 unset）+ 自定义/已禁用标签 + 启用 Switch | — | 名称可链官网 / 启用开关 / 抽屉均 ✅ |
| 2.3.2 | 认证区 | API key 输入/保存、连接测试、"获取模型"引导动画 | ✅ 密钥行：眼睛显隐切换 + 「检测」按钮（真实 `llm.discoverModels` 探测，回显模型数+延迟）；baseURL 等宽输入 + 端点预览行；Header 齿轮「检测模型」→ 健康检测对话框（host 新服务 `controlCenterModelCheck`：每模型一发最小真实补全，走正式适配器与凭据链路，逐行状态/延迟/错误 + 全部检测 + 单行重检）；registry 有取键地址时显示「获取 API Key」链接；引导动画未做 | 后续：引导动画 / 密钥列表抽屉 | 填 key → 检测 → 真实探测反馈；模型级健康检测 ✅ |
| 2.3.3 | 模型列表 | 该供应商模型列表：启用/禁用、搜索、添加、从供应商拉取、默认标记、健康状态 | ✅ Cherry 式工具栏（标题+计数徽章+搜索切换+获取模型列表+加号）+ **家族分组折叠**（`openai/gpt-4o`→openai、`deepseek-v4-pro`→deepseek，未分组殿后，全局展开/折叠切换）；行 = 字母头像 + 无边框 ID 输入 + 折叠（显示名/容量在内）+ 减号删除；拉取候选多选采纳 + **默认标记刷子**（写真实 `agent-default-model`）+ **每行启停眼动**（profile 数组即在役集合：眼动移出；目录缺失项灰色「已停用」组内一键恢复——pi-ai 无独立 disabled 字段，存在性即状态，无伪造）。模型级类型筛选 tab 未做 | 后续：类型筛选 tabs | 模型列表真实增删、可拉取、分组、启停、默认标记、健康检测入口 ✅ |

### 2.4 模型选择页 ModelSettings

Cherry 参照：`.../ModelSettings/ModelSettings.tsx`、`.../ModelSettings/TopicNamingSettings.tsx`

| # | Cherry 能力 | Cherry 行为要点 | control-center 现状 | 待办 | 完成标准 |
|---|-------------|-----------------|---------------------|------|----------|
| 2.4.1 | 默认助手模型 | DefaultModelSelector，仅列 chat 模型，空态占位 | ✅ `ModelSelectionPanel`：默认/当前会话模型选择器，读 `llm.models()` 真实目录，持久化到 `agent-default-model`。**页面已重构**：供应商编辑移除（归属模型服务页），对齐 Cherry 两页分工 | — | 可选到真实模型，选择持久化并影响对话 ✅ |
| 2.4.2 | 快捷模型 | 快捷模型 + 设置抽屉（TopicNamingSettings 话题命名） | ✅ 快捷模型选择器持久化到 `control-center-model-prefs`（`quickProvider/quickModel`），设置按钮打开话题命名对话框：如实说明 DSH 内建会话标题服务（首条消息后自动命名、用会话自身模型）；自定义提示词与开关属 harness 部署级配置（bundle `session-title-llm` 行），应用内暂不可改（诚实标注）。桌面快捷助手悬浮窗落地后直接读取该偏好 | 悬浮窗（桌面） | 选择器持久化 ✅；抽屉诚实呈现 ✅ |
| 2.4.3 | 翻译模型 | 翻译模型 + 翻译设置抽屉（prompt 可重置回默认） | ✅ 设置页新增持久偏好（`control-center-model-prefs`），翻译工作区打开时**优先预选**该模型；工作区内选择器与 prompt 重置照旧 | — | 翻译模型生效 ✅ |
| 2.4.4 | 绘画模型 | 绘画模型选择（isGenerateImageModel 过滤） | ✅ 设置页持久偏好同上，绘画工作区打开时优先预选；目录仍按生成类过滤 | — | 绘画模型生效 ✅ |
| 2.4.5 | 重试设置 | 开关 + 次数(1-10) + 退避开关 + 兜底模型多选 | ✅ 开关（默认关）/次数 1-10（Cherry 同款 clamp）/退避/兜底多选，持久化到 `control-center-model-prefs`。**真实生效双通道**：① 保存时把 DSH 原生 `retryPolicy` 投影进每个在役供应商 profile（llm-pi-ai 各路由 + llm-deepseek 根 + provider-stash 拷贝），由官方 dsh-llm-retry 插件在代理会话真实执行（关闭=显式 maxRetries:0 覆盖默认 5 次）；② 控制中心自有调用面（翻译任务、频道回复）按同一配置执行重试预算与兜底路由顺序（DSH 的 retry 插件只挂 agent loop，直连调用面需自带循环——已在代码注释注明）。代理会话失败只重试不切模型（诚实标注） | — | 重试策略真实影响请求 ✅ |

### 2.5 本地模型

Cherry 参照：`.../DependenciesSettings/LocalModelsSection.tsx`
control-center 现状：✅ LocalModelsSection.tsx + LocalModelDownloads.tsx，真实 `controlCenterLocalModels`（Ollama / llama.cpp / OpenAI 兼容注册、发现模型、采纳进目录）。
待办：本地模型经 `controlCenterLocalModels` 注册后出现在 `llm.providers()`/`llm.models()`，即可在模型选择器与两栏目录「自定义」组中选中——已打通，后续核对。

### 2.6 网关

Cherry 参照：`.../ToolSettings/ApiGatewaySettings/`
control-center 现状：✅ ApiGatewaySection.tsx（状态、start/stop/restart、URL/端口/API key），web 显示诚实桌面提示。

---

## 3. Tier 1 — 核心链路，逐节对标

### 3.1 MCP

Cherry 参照：`.../McpSettings/`（McpSettingsPage.tsx / McpServerCard.tsx / McpServersList.tsx / McpDetailList.tsx / McpTool.tsx / McpResource.tsx / McpPrompt.tsx / McpLogsTab.tsx / AddMcpServerModal.tsx / QuickCreateMcpServerDialog.tsx / McpMarketList.tsx / BuiltinMcpServerList.tsx / McpProtocolInstallDialog.tsx / McpProviderSettings.tsx / useMcpServerTrust.ts）
control-center 现状：✅ McpSection.tsx（split-pane：左服务器列表+搜索筛选，右详情+日志）。

| # | Cherry 能力 | control-center 现状 | 待办 | 完成标准 |
|---|-------------|---------------------|------|----------|
| 3.1.1 | 服务器列表 + 搜索/筛选 | ✅ | 逐控件核对 | 服务器真实增删改、启停 |
| 3.1.2 | 添加服务器（stdio/SSE/HTTP 协议字段） | ✅ 双 Tab 对话框：手动创建 + **快速导入**（粘贴 npx 命令行 / JSON 定义 / mcpServers 包装 / URL，自动解析预填全部字段，纯客户端可测） | — | 真实创建并连接 ✅ |
| 3.1.3 | 市场安装 / Npx 搜索 | ✅ 「Npx 市场」Tab：host 新方法 `controlCenterMcp.searchNpxRegistry` 走公共 npm registry 按 scope 搜索，结果逐包「添加」即建 stdio 服务器（npx -y 包名）；远程未挂载诚实提示。configSample-from-readme 已移植（前 10 个结果自动抓取 npm README 抽取 mcpServers 样例，命中包显示「含配置」并按作者真实命令安装）| 后续：readme 配置样例抽取 | 市场真实可搜可装 ✅ |
| 3.1.4 | 详情：工具/资源/提示 | 🔶 | 核对 | 列出真实暴露的工具/资源 |
| 3.1.5 | 日志 | ✅ | 核对 | 真实显示会话日志 |
| 3.1.6 | 协议安装（mcp install 警告流程） | 🚧 | 诚实处理 | 不可安装则标"当前平台不支持" |

### 3.2 技能 Skills

Cherry 参照：`.../SkillsSettings.tsx`
control-center 现状：✅ SkillsSection.tsx（卡片网格 + 搜索 + 启用/禁用/卸载 + **本地导入真实接线**：桌面桥 pickFile 选目录/ZIP → host `installSkill({source})`，浏览器只传路径、host 进程读文件；Web 无桌面桥时按钮置灰并诚实标注）。**在线搜索真实接线**：host `searchMarketplace` 并发查询 skills.sh / claude-plugins.dev / clawhub.ai 三大注册表（Cherry 同款端点与归一化规则），按名去重；claude-plugins 条目经 GitHub Trees API + raw 下载安装目录（无 git 依赖）；部分源失败容忍，仅全失败才报错。ZIP 安装仍诚实未实现。

### 3.3 联网搜索 WebSearch

Cherry 参照：`.../WebSearchSettings/WebSearchSettings.tsx`（默认提供方、内置 API 提供方列表、自定义提供方、搜索参数）
control-center 现状：✅ WebSearchSection.tsx（真实）。
待办：🚧 逐控件核对（提供方列表、参数、自定义 API 提供方）。

### 3.4 文件处理 / OCR

Cherry 参照：`.../FileProcessingSettings/DocumentProcessingSettings.tsx`、`OcrSettings.tsx`、`ocr.ts`
control-center 现状：✅ ProcessorSection.tsx（每 feature 一页，default-processor select + 每处理器配置卡，真实 `controlCenterFileProcessing`；RAG 提示"当前 DSH Host 仅提供原生解析"）。
待办：🚧 逐控件核对（默认处理器、每处理器 model/key 配置）。

### 3.5 通用 General

Cherry 参照：`.../GeneralSettings/GeneralSettings.tsx`、`ContextManagementSettings.tsx`
control-center 现状：🚧 原生（`general` 属 DSH 拥有，KNOWN_NATIVE = {general, agent-presets, plugins}），部分项在 DSH 原生设置里。
待办：列出 Cherry 通用项（语言/主题/启动行为/代理/默认知识库等），逐项映射到 DSH 原生能力或诚实标不支持。

### 3.6 外观 Appearance

Cherry 参照：`.../AppearanceSettings/AppearanceSettings.tsx`
control-center 现状：✅ AppearanceSection.tsx（权威设置：colorPrimary / fontFamily / codeFontFamily / customCss + DSH locale 权威；桌面字体桥已接线；旧 localStorage 一次性迁移）。**已对齐程度高，仅需核对剩余项**（代码主题、布局密度等）。

### 3.7 通知 Notification

Cherry 参照：`.../NotificationSettings/NotificationSettings.tsx`
control-center 现状：✅ NotificationSection.tsx + notification-runtime.ts（会话完成通知走桌面桥或浏览器 Notification）。
待办：🚧 逐控件核对（事件维度规则、声音等）。

### 3.8 数据管理 Data

Cherry 参照：`.../DataSettings/`（BackupPopup / RestorePopup / ImportPopup / ClearCachePopup / WebDavSettings / S3Settings / NutstoreSettings / LocalBackupSettings / MarkdownExportSettings / NotionSettings / ObsidianSettings / JoplinSettings / SiyuanSettings / YuqueSettings / ExportMenuSettings / ImportMenuSettings / legacyV1BrowserData）
control-center 现状：🔶 DataSection.tsx（导出/导入/清除 control-center 数据；凭据留在 DSH credentials）。
待办：先补齐"本地备份/恢复、Markdown 导出"；WebDAV/S3/第三方笔记（Notion/Obsidian/Joplin/Siyuan/Yuque）**诚实标注"当前平台不支持"**（或按需做成 DSH 服务）。

### 3.9 用量 Usage

Cherry 参照：`.../UsageSettings/`（UsageHeatmap / UsageDistributionChart / UsageEntriesTable / useUsageData / usageAnalytics）
control-center 现状：✅ UsageSection.tsx（窗口 tabs、指标条、洞察条、每日热力图、分布图、明细表；真实 usage record store，翻译/绘画/embedding 真实记录 tokens）。
待办：🚧 核对数据源覆盖度。

---

## 4. Tier 2 — 自动化 / 桌面增强

### 4.1 频道 Channels

Cherry 参照：`.../ChannelsSettings/`（ChannelsSettings.tsx / ChannelDetail.tsx / ChannelForms.tsx / channelTypes.ts）
control-center 现状：✅ ChannelsSection.tsx 深度对标——
- **存储升级**：实例从 localStorage 迁入 DSH settings `control-center-channels` 命名空间（settings.yaml 可见，桌面桥直接读取）；旧数据一次性自动导入，host 缺命名空间时降级回浏览器存储并诚实提示
- **字段全量对齐** Cherry ChannelForms：各类型「允许的会话/频道 ID」逗号编辑器（失焦解析）、飞书 domain（feishu/lark）选择、QQ 仅被 @ 时回复开关
- 双列表单栅格、权限模式六档、日志对话框诚实标注来源；真实消息桥仍需桌面伴生程序

### 4.2 定时任务 Scheduled Tasks

Cherry 参照：`.../TasksSettings.tsx`
control-center 现状：✅ TasksSection.tsx（cron 任务 + 真实 host scheduler `controlCenterTasks`）。

### 4.3 快捷键 Shortcuts

Cherry 参照：`.../ShortcutSettings.tsx`
control-center 现状：🔶 ShortcutSection.tsx（分组行 + 内联录制 + 启用 + 搜索过滤 + 批量操作；localStorage；应用内绑定走 window keydown 真实生效；全局绑定标桌面）。

### 4.4 快捷助手 Quick Assistant

Cherry 参照：`.../QuickAssistantSettings.tsx`
control-center 现状：🔶 QuickAssistantSection.tsx（启用 + tray/clipboard 行 + 模型行 + 窗口预览；本地持久化；悬浮窗需桌面，诚实标注）。

### 4.5 划词助手 Selection Assistant

Cherry 参照：`.../SelectionAssistantSettings/SelectionAssistantSettings.tsx`
control-center 现状：🔶 SelectionAssistantSection.tsx（启用 + 工具栏预览 + 触发模式 + 紧凑 + 窗口行为 + 动作列表内置 7 + 自定义拖拽 + 应用过滤；本地持久化；系统级捕获需桌面，诚实标注）。

### 4.6 截图 Screenshot

Cherry 参照：`.../ScreenshotSettings/ScreenshotSettings.tsx`
control-center 现状：🔶 ScreenshotSection.tsx（启用 + 快捷键行 + OCR 开关 + 本地模型状态；本地持久化；web 不能截屏，诚实标注）。

### 4.7 依赖 Dependencies / 关于 About / 更新 Update

- 依赖：✅ DependenciesSection.tsx（环境依赖与二进制安装，参照 `.../DependenciesSettings/`）。
- 关于：✅ AboutSection.tsx（参照 `.../AboutSettings/`；诊断包导出 DiagnosticBundleDialog 视能力实现或诚实标注）。
- 更新：✅ UpdateSection.tsx（control-center 独有，`controlCenterUpdate`）。

---

## 5. 单节对标流程模板（新窗口抄这段用）

```
# 目标：对齐 Cherry <section>
参照：D:\Github_Open\cherry-studio\src\renderer\pages\settings\<section>\
步骤：
1. 读参照文件，录下每个控件的状态与操作路径（写成对照行）。
2. 对每个控件：找真实 DSH host 能力；没有 → 做成 DSH 服务（Cordis service + remote-client + STRICT_JSON）或诚实标"当前平台不支持"。
3. 实现 + 单测 + 浏览器 E2E。
4. pnpm run check && pnpm run test:browser（涉及桌面加 smoke）。
5. 回写 CHERRY_PARITY.md 对应节"现状"列，一节一 commit。
```

---

## 6. 验证门

| 门 | 命令 | 断言 |
|----|------|------|
| 静态+测试 | `pnpm run check` | typecheck / vitest / lint / build / provenance / artifacts / secrets 全绿 |
| 浏览器 | `pnpm run test:browser` | web profile 下 UI 挂载、能力诚实显示 |
| 桌面（如涉及） | `pnpm run smoke:desktop` + `smoke:desktop:selfhost` | marker / 桥 / tray / hotkey 全断言 |

---

## 7. 附录 A：Cherry 供应商目录（61）↔ control-center preset 映射

> 数据源：`cherry-studio/packages/provider-registry/data/providers.json`（61 项）↔ `packages/control-center/src/client/provider-presets.ts`（61 项，**全量覆盖**）。
> 列含义：type/baseURL 为 control-center preset 的值；备注标注非 OpenAI 兼容的 type 或空 baseURL。
> **P0 已落地：下表 61 行以客户端静态目录呈现（`ProviderDirectorySection`），配置状态从 `llm.providers()` join；与 harness `llm-pi-ai` catalog 同 id 的 15 行（deepseek/openai/anthropic/openrouter/groq/together/fireworks/nvidia/mistral/huggingface/cerebras/openai-codex/zai/minimax/opencode）由 pi-ai 目录提供，其余写入 `llm-pi-ai.providers.<id>` 激活。**

| # | Cherry id | Cherry 名称 | control-center type | baseURL | 备注 |
|---|-----------|-------------|---------------------|---------|------|
| 1 | zhipu | 智谱 (ZhiPu) | openai-compatible | https://open.bigmodel.cn/api/paas/v4 | |
| 2 | deepseek | DeepSeek | deepseek | https://api.deepseek.com/v1 | 特殊 type |
| 3 | moonshot | Moonshot AI | openai-compatible | https://api.moonshot.cn/v1 | |
| 4 | baichuan | BAICHUAN AI | openai-compatible | https://api.baichuan-ai.com/v1 | |
| 5 | dashscope | 阿里云百炼 | openai-compatible | https://dashscope.aliyuncs.com/compatible-mode/v1 | |
| 6 | stepfun | 阶跃星辰 | openai-compatible | https://api.stepfun.com/v1 | |
| 7 | doubao | 火山引擎 | openai-compatible | https://ark.cn-beijing.volces.com/api/v3 | |
| 8 | minimax | MiniMax | openai-compatible | https://api.minimaxi.com/v1 | |
| 9 | minimax-global | MiniMax Global | openai-compatible | https://api.minimax.io/v1 | |
| 10 | silicon | 硅基流动 | openai-compatible | https://api.siliconflow.cn/v1 | |
| 11 | aihubmix | AiHubMix | openai-compatible | https://aihubmix.com/v1 | |
| 12 | zai | Z.ai | openai-compatible | https://api.z.ai/api/paas/v4 | |
| 13 | alayanew | Alaya NeW | openai-compatible | https://deepseek.alayanew.com | |
| 14 | dmxapi | DMXAPI | openai-compatible | https://www.dmxapi.cn | |
| 15 | aionly | AIOnly | openai-compatible | https://api.aiionly.com | |
| 16 | burncloud | BurnCloud | openai-compatible | https://ai.burncloud.com | |
| 17 | 302ai | 302.AI | openai-compatible | https://api.302.ai | |
| 18 | lanyun | LANYUN | openai-compatible | https://maas-api.lanyun.net | |
| 19 | ph8 | PH8 | openai-compatible | https://ph8.co | |
| 20 | sophnet | SophNet | openai-compatible | https://www.sophnet.com/api/open-apis/v1 | |
| 21 | ppio | PPIO 派欧云 | openai-compatible | https://api.ppinfra.com/v3/openai | |
| 22 | qiniu | 七牛云 AI 推理 | openai-compatible | https://api.qnaigc.com | |
| 23 | modelscope | ModelScope 魔搭 | openai-compatible | https://api-inference.modelscope.cn/v1 | |
| 24 | xirang | 天翼云息壤 | openai-compatible | https://wishub-x1.ctyun.cn | |
| 25 | tokenhub | TokenHub | openai-compatible | https://tokenhub.tencentmaas.com/v1 | |
| 26 | baidu-cloud | 百度云千帆 | openai-compatible | https://qianfan.baidubce.com/v2 | |
| 27 | longcat | LongCat | openai-compatible | https://api.longcat.chat | |
| 28 | mimo | 小米 MiMo | openai-compatible | https://api.xiaomimimo.com | |
| 29 | radeon-cloud | AMD GPU Cloud | openai-compatible | https://developer.amd.com.cn/radeon/v1 | |
| 30 | ocoolai | ocoolAI | openai-compatible | https://api.ocoolai.com | |
| 31 | openai | OpenAI | openai | https://api.openai.com/v1 | 特殊 type |
| 32 | anthropic | Anthropic | anthropic | https://api.anthropic.com/v1 | 特殊 type |
| 33 | claude-code | Claude Code | anthropic | https://api.anthropic.com/v1 | 特殊 type |
| 34 | gemini | Gemini | google | https://generativelanguage.googleapis.com/v1 | 特殊 type |
| 35 | vertexai | VertexAI | google | https://<region>-aiplatform.googleapis.com | 特殊 type；Cherry 用 IAM(gcp) |
| 36 | azure-openai | Azure OpenAI | azure | https://<resource>.openai.azure.com | 特殊 type；Cherry 用 IAM(azure) |
| 37 | aws-bedrock | AWS Bedrock | openai-compatible | （空） | Cherry 用 IAM(aws)；baseURL 空 |
| 38 | openrouter | OpenRouter | openai-compatible | https://openrouter.ai/api/v1 | |
| 39 | opencode | OpenCode Go | openai-compatible | https://opencode.ai/zen/go/v1 | |
| 40 | copilot | GitHub Copilot | openai-compatible | https://api.githubcopilot.com | |
| 41 | groq | Groq | openai-compatible | https://api.groq.com/openai | |
| 42 | together | Together | openai-compatible | https://api.together.ai | |
| 43 | fireworks | Fireworks | openai-compatible | https://api.fireworks.ai/inference | |
| 44 | nvidia | NVIDIA | openai-compatible | https://integrate.api.nvidia.com | |
| 45 | grok | Grok | openai-compatible | https://api.x.ai | |
| 46 | grok-cli | Grok CLI | openai-compatible | https://cli-chat-proxy.grok.com/v1 | |
| 47 | mistral | Mistral | openai-compatible | https://api.mistral.ai | |
| 48 | jina | Jina | openai-compatible | https://api.jina.ai | |
| 49 | perplexity | Perplexity | openai-compatible | https://api.perplexity.ai | |
| 50 | poe | Poe | openai-compatible | https://api.poe.com/v1 | |
| 51 | huggingface | Hugging Face | openai-compatible | https://router.huggingface.co/v1 | |
| 52 | gateway | Vercel AI Gateway | openai-compatible | https://ai-gateway.vercel.sh/v1/ai | |
| 53 | cerebras | Cerebras AI | openai-compatible | https://api.cerebras.ai/v1 | |
| 54 | voyageai | Voyage AI | openai-compatible | https://api.voyageai.com | |
| 55 | cherryin | CherryIN | openai-compatible | https://open.cherryin.net | |
| 56 | openai-codex | OpenAI Codex | openai | https://chatgpt.com/backend-api/codex | 特殊 type |
| 57 | ollama | Ollama | ollama | http://localhost:11434 | 特殊 type |
| 58 | new-api | New API | openai-compatible | http://localhost:3000 | |
| 59 | lmstudio | LM Studio | openai-compatible | http://localhost:1234/v1 | |
| 60 | gpustack | GPUStack | openai-compatible | （空） | baseURL 空 |
| 61 | ovms | Intel OVMS | openai-compatible | http://localhost:8000/v3 | |
