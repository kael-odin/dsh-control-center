# 🎯 Parity Ledger: Cherry Studio v2.0.8 → DSH Control Center v0.1.0

> 权威差异台账。Cherry 每一项设置能力的迁移状态。  
> 基线：Cherry `0bb1725c638bf12d505e9baadaa69f8da47dd05e` (2.0.8), DSH `0.1.1-rc.2`

## 颜色说明

| 状态 | 含义 |
|------|------|
| ✅ | 完全对等，功能可用 |
| ⚠️ | 部分对等（UI 有但功能受限或缺失子项） |
| ❌ | 缺失（UI 未实现，或只有占位说明） |
| 🔄 | 正在实现中 |
| ⛔ | 不适用（DSH 原生拥有，不必重复） |

---

## 导航 (SettingsPage.tsx)

Cherry 侧边栏 5 组 22 项。Control Center 导航已对齐，组顺序和成员一致。

| 组 | Cherry 项 | 状态 | 备注 |
|---|-----------|------|------|
| 核心 | Provider | ✅ | 右键菜单/模型类型标签/多API Key/文档链接均已实现 |
| 核心 | Model | ✅ | 默认模型/快捷模型/重试设置已实现 |
| 核心 | Local Models | ✅ | 本地模型下载页面 |
| 核心 | API Gateway | ✅ | 状态卡/端口/凭据/文档/启停 |
| 能力 | MCP | ⚠️ | 服务器列表+详情+添加+Npx市场。缺少：内置服务器/市场页面/协议安装向导/提供商配置子页 |
| 能力 | Skills | ✅ | 资源目录视图 |
| 能力 | Web Search | ✅ | 提供者配置/高级设置/黑名单 |
| 能力 | File Processing | ⚠️ | 处理器目录+API Key+本地模型。缺少：PaddleOCR模型选择/语言包/Tesseract |
| 能力 | OCR | ✅ | 同 File Processing |
| 个人 | General | ⚠️ | 启动/托盘已实现。代理/上下文管理/省电/硬件加速/开发者模式为占位说明 |
| 个人 | Appearance | ⚠️ | 主题/颜色/语言/字体/缩放/CSS已实现。缺少：字体大小、窗口样式、菜单呈现模式、系统标题栏、代码执行、消息显示设置 |
| 个人 | Notification | ✅ | 4 个开关完全对等 |
| 个人 | Data | 🔄 | 已重构为 Cherry 子菜单 IA（13 项/5 组），本地目录备份+轮转+Markdown 导出+WebDAV 云备份已可用。S3/坚果云/笔记导出待实现 |
| 个人 | Usage | ✅ | 热力图/分布图/指标条/详情表 |
| 自动化 | Channels | ✅ | 6 种频道全部真实桥接连通（TG/Discord/Slack/QQ/飞书/微信），共享默认模型回复管线 |
| 自动化 | Scheduled Tasks | ✅ | 任务列表/调度/历史 |
| 自动化 | Shortcuts | ✅ | 快捷键列表 |
| 自动化 | Quick Assistant | ⚠️ | 启用/托盘/剪贴板/模型选择已实现。缺少：真实助手选择器、窗口预览（Web 限制） |
| 自动化 | Selection Assistant | ✅ | 选择工具/快捷键/动作列表 |
| 自动化 | Screenshot | ✅ | 启用/快捷键/OCR 开关 |
| 系统 | Dependencies | ⚠️ | 契约包版本列表。缺少：环境依赖检查（FFmpeg/Tesseract 等） |
| 系统 | About | ⚠️ | 版本/诊断。缺少：自动更新、测试计划、检查更新、发布说明、文档/网站/反馈/企业/联系/DevTools |

---

## 缺失页面详情

### 1. General — 通用设置

Cherry 的 `GeneralSettings.tsx` 有以下分组：

**启动组** (5 行)：
| 行 | Cherry 存储键 | 状态 | 控制类型 |
|---|-------------|------|---------|
| 开机启动 | `app.launch_on_boot` | ✅ | Switch |
| 启动到托盘 | `app.tray.on_launch` | ✅ | Switch |
| 显示托盘 | `app.tray.enabled` | ✅ | Switch |
| 关闭到托盘 | `app.tray.on_close` | ✅ | Switch |
| 省电模式 | `app.power.prevent_sleep_when_busy` | ❌ | Switch |

**代理组** (5 行)：
| 行 | Cherry 存储键 | 状态 | 控制类型 |
|---|-------------|------|---------|
| 代理模式 | `app.proxy.mode` | ❌ | Selector (system/custom/none) |
| 代理地址 | `app.proxy.url` | ❌ | Input (url, custom 模式) |
| 代理绕过 | `app.proxy.bypass_rules` | ❌ | Input (custom 模式) |
| 允许私有网络 | `app.fetch.allow_private_network` | ❌ | Switch + InfoTooltip |
| 禁用硬件加速 | `BootConfig.app.disable_hardware_acceleration` | ❌ | Switch + 确认 → 重启 |

**上下文管理组** (5 行)：
| 行 | Cherry 存储键 | 控制类型 |
|---|-------------|---------|
| 最大消息数 | `chat.context_settings.max_messages` | EditableNumber |
| 启用上下文压缩 | `chat.context_settings.enabled` | Switch |
| 截断阈值 | `chat.context_settings.truncate_threshold` | EditableNumber |
| 启用压缩 | `chat.context_settings.compress.enabled` | Switch |
| 压缩模型 | `chat.context_settings.compress.model_id` | DefaultModelSelector |

**开发者组** (2 行)：
| 行 | Cherry 存储键 |
|---|-------------|
| 启用开发者模式 | `app.developer_mode.enabled` |
| 客户端 ID | `app.user.id` |

**迁移建议**：代理/上下文管理/省电/硬件加速/开发者模式可直接映射到 DSH 的 settings namespace。优先级：开发者模式（最简单）+ 省电 + 代理模式选择器（UI 先就位，DSH 侧后期接入）。

---

### 2. Appearance — 外观设置

Cherry 的 `AppearanceSettings.tsx` 有以下 Control Center 缺失的行：

| 行 | Cherry 存储键 | 控制类型 |
|---|-------------|---------|
| 字体大小（消息） | `chat.message.font_size` | EditableNumber (12-18, 步长 1) |
| 窗口样式 | `ui.window_style` | Switch (透明/不透明, Mac 仅) |
| 菜单呈现模式 | `menu.presentation_mode` | Selector + 重启确认 |
| 使用系统标题栏 | `app.use_system_title_bar` | Switch |
| 代码执行启用 | `chat.code.execution.enabled` | Switch (Python/Pyodide) |
| 代码执行超时 | `chat.code.execution.timeout_minutes` | EditableNumber (1-60) |
| 代码图像工具 | `chat.code.image_tools` | Switch |
| 消息显示设置 | (ChatPreferenceSections) | 多行（消息样式/时间戳等） |

**迁移建议**：字体大小 → CSS 覆盖，优先实现。代码执行 → DSH 无 Pyodide，标注不可用。消息显示设置 → 嵌入 DSH 自有设置。

---

### 3. Model — 模型设置

Cherry 的 `ModelSettings.tsx` 有 TopicNamingSettings 子组件：

| 行 | Cherry 存储键 | 控制类型 |
|---|-------------|---------|
| 自动话题命名 | `topic.naming.enabled` | Switch |
| 话题命名提示词 | `topic.naming_prompt` | Textarea + 重置按钮 + 变量提示 Popover |

**迁移建议**：话题命名功能需要 DSH 会话标题生成支持。当前标注为不可用，等 DSH 暴露会话标题 API。

---

### 4. Data — 数据管理 (最大缺口)

Cherry 的 `DataSettings.tsx` 有 13 个子菜单项，分为 5 组：

**数据组 (BasicDataSettings)**：
| 子项 | 状态 | 实现说明 |
|------|------|---------|
| 备份/恢复 | ✅ | 桌面桥 save/open dialog → 快照 JSON；host 侧 `exportControlCenter` 已修复 Typert 边界问题 |
| 跳过文件数据 | ⚠️ | 开关已实现，但 skip 逻辑在 host 侧 |
| 应用数据路径 | ❌ | 显示当前 appDataPath + 选择新路径 + 打开 |
| 应用日志路径 | ❌ | 显示 logsPath + 打开按钮 |
| 清除缓存 | ❌ | 缓存在 DSH 中由 host 管理 |
| V1 重迁移 | ⛔ | 不适用（Cherry v1→v2 迁移，DSH 无此概念） |
| 数据重置 | ✅ | 调用 clearControlCenter |
| 隐私模式 | ❌ | 数据收集开关 |

**云存储组**：
| 子项 | 状态 | 实现说明 |
|------|------|---------|
| 本地备份 | ✅ | 目录选择 + 时间戳备份 + max_backups 轮转（host 侧 `backupToDirectory`/`listBackupFiles`）+ 备份列表恢复 |
| WebDAV | ✅ | HTTP PUT 备份（host 侧 `fetch`）+ 连接测试 + 恢复 + 列表（schema 注册 + `role('secret')` 密码保护） |
| 坚果云 | ❌ | 基于 WebDAV 的 OAuth |
| S3 | ❌ | AWS SDK，需要 host 侧 AWS 客户端 |

**导入设置组**：
| 子项 | 状态 | 实现说明 |
|------|------|---------|
| ChatGPT 导入 | ❌ | 对话 JSON 导入，需 session API |
| Claude 导入 | ❌ | 同上 |

**导出设置组**：
| 子项 | 状态 | 实现说明 |
|------|------|---------|
| 导出菜单可见性 | ❌ | 各导出目标开关（图片/Markdown/Notion/语雀等） |
| Markdown 导出 | ✅ | 快照 → Markdown 文档下载 |

**笔记导出组**：
| 子项 | 状态 | 实现说明 |
|------|------|---------|
| Notion | ❌ | Notion API (database_id, page_name_key, api_key, export_reasoning) |
| 语雀 | ❌ | Yuque API (url, token, repo_id) |
| Joplin | ❌ | Joplin Web Clipper API (url, token, export_reasoning) |
| Obsidian | ❌ | 本地 vault 选择 |
| 思源 | ❌ | Siyuan API (api_url, token, box_id, root_path) |

---

### 5. MCP — 服务器管理

Cherry 的 `McpSettingsPage.tsx` 有子导航结构：

| 子页 | 状态 | 说明 |
|------|------|------|
| 服务器列表 | ✅ | 分栏布局已实现 |
| 内置服务器 | ❌ | 社区/官方预设服务器列表 |
| 市场 | ❌ | 独立的市场页面（我们有 Npx 搜索但在 Add 对话框内） |
| 提供商配置 | ❌ | 每个提供商（Vercel/Cloudflare/Deno 等）的子配置页 |
| 协议安装向导 | ❌ | McpProtocolInstallDialog |
| QuickCreate | ❌ | 快速创建对话框 |

---

### 6. Channels — 频道

| 频道 | 状态 | 说明 |
|------|------|------|
| 飞书 | ✅ | Lark 长连接 WebSocket（手写 pbbp2 protobuf 编解码 + ping/pong + 事件 ACK + im/v1 发送） |
| Telegram | ✅ | 长轮询桥接在工作（allowlist + 默认模型回复 + 重试策略） |
| QQ | ✅ | 开放平台网关 WebSocket（getAppAccessToken + 被动回复 msg_id 窗口） |
| 微信 | ✅ | iLink Bot 协议（扫码登录 QR 渲染 + getupdates 长轮询 + context_token 回复；凭据存 DSH home） |
| Discord | ✅ | 网关 WebSocket（heartbeat/identify/MESSAGE_CREATE + REST 发送） |
| Slack | ✅ | Socket Mode（apps.connections.open + 信封 ACK + chat.postMessage） |

**六平台全部真实连通。** 共享回复管线：allowlist → agent-default-model → Cherry 重试策略 → LlmRuntime 流式生成。
| Agent 绑定 | ❌ | 每个频道可绑定一个 Agent + Workspace |
| 连接状态 | ✅ | 实时状态点（connected/error/starting/disconnected）+ 状态轮询 |
| 日志 | ✅ | 每频道日志环 + 实时日志对话框 |

---

### 7. 其他小缺口

| 页面 | 缺失项 | 优先级 |
|------|--------|--------|
| Dependencies | 环境依赖检查（FFmpeg/Tesseract/Node 版本） | 低 |
| About | 自动更新/测试计划/检查更新/发布说明/文档链接/反馈/DevTools | 中 |
| Screenshot | OCR 模型状态指示（下载中/就绪/不可用） | 低 |
| File Processing | PaddleOCR 模型选择、语言包、Tesseract 状态 | 低 |

---

## 优先级排序

### P0 (高可见度，可行性高)
1. **Data 页面重构** → Cherry 子菜单 IA + 本地目录备份 + Markdown 导出
2. **General 页面** → 开发者模式 + 省电设置 + 代理模式选择器 UI
3. **Appearance** → 字体大小设置

### P1 (中等可见度，需要 host 能力)
4. **Channels 增强** → 微信/飞书媒体消息（图片 CDN 加解密已有 helper）+ Agent 会话绑定（六平台文本桥已全部连通）
5. **Data 云存储** → S3 备份（WebDAV 已完成）
6. **General 上下文管理** → 映射到 DSH compaction 配置

### P2 (低可见度，或需要 DSH 新能力)
7. **MCP 子导航** → 内置服务器/市场/提供商配置
8. **Data 笔记导出** → Notion/语雀/Joplin/Obsidian/思源
9. **About 更新** → 自动更新 UI
10. **Dependencies 环境检查** → FFmpeg/Tesseract 检测

---

## 迁移原则

1. **DSH 原生优先**：DSH 已拥有的能力（主题、会话、权限、预设、凭据、插件）不重复实现，用 `KNOWN_NATIVE` 集合管理。
2. **诚实标签**：未实现的能力不展示假开关，用能力状态面板标明"当前平台不支持"。
3. **快照备份**：所有设置数据通过 `controlCenterData` 服务统一导出/导入，凭据由 DSH 凭据库管理。
4. **桌面桥**：文件对话框、本地文件读写通过 `controlCenterDesktop` 桥接，Web 版回退到浏览器下载/上传。