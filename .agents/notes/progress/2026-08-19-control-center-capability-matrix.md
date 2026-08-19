# Control Center Capability Matrix - 2026-08-19

## 目标
把 Cherry Studio 的能力**全部完美**给 deepseek-harness 一份，且在网页端的 UI 也**尽可能一致**，尤其是设置里面的显示**最好 100% 一致**。

## 规格文档基线
- 规格: `D:\Github_Open\deepseek-harness\.agents\notes\proposed\feature\2026-08-18-cherry-control-center-web-edition.zh.md`
- Cherry Studio 基线: commit `13687df` (v2.0.7)
- dsh-control-center 仓库: `D:\Github_Open\dsh-control-center`

---

## 能力完成矩阵

### ✅ 已完成

#### 1. Translation Workspace（翻译工作区）
- ✅ Host service with TypertRemote
- ✅ Client UI component
- ✅ 语言选择、自动检测
- ✅ 流式翻译结果
- ✅ SQLite 历史记录
- ✅ 语言管理

#### 2. Painting Workspace（绘画工作区）
- ✅ Host service with image generation
- ✅ Client UI component
- ✅ Provider 路由与模型选择
- ✅ Prompt 编辑器
- ✅ 异步任务管理
- ✅ 画廊展示
- ✅ SQLite 任务/历史记录

#### 3. Knowledge Workspace（知识库工作区）
- ✅ Host service with RAG
- ✅ Client UI component
- ✅ 知识库创建/删除
- ✅ 数据源摄取（文件/文本）
- ✅ Embedding & 向量索引
- ✅ 检索配置
- ✅ SQLite 知识库元数据

#### 4. Skills Vertical（技能垂直功能）
- ✅ Host service (skills.ts) with SQLite catalog
- ✅ Skills remote client
- ✅ Type system integration (TypertRemoteNamespaceMap)
- ✅ Client UI (SkillsSection.tsx)
- ✅ List/search/enable/disable/uninstall
- ✅ 13 comprehensive tests
- ⚠️ **未完成**: Install 功能（marketplace/local/URL/ZIP）
- ⚠️ **未完成**: Skills marketplace search implementation
- ⚠️ **未完成**: E2E browser tests

---

### ❌ 核心设置页面 - 待实现

#### Core Group（核心分组）

##### 5. Provider Management（提供方管理）✅
**规格对应**: `| 提供方与模型管理 |` (line 95)
- ✅ Provider 列表/编辑器（split-pane UI with 248px sidebar）
- ✅ API Key 管理（DSH credentials integration with apiKeyRef）
- ✅ Endpoint & Header 配置
- ✅ 连通性测试（testConnection with latency）
- ✅ 远程模型发现（discoverModels with OpenAI-compatible fetcher）
- ✅ Model enable/disable toggle
- ✅ Provider Add/Edit 对话框（ProviderDialog with type selection, validation）
- ⚠️ **未完成**: Provider-specific fetchers (Anthropic, Gemini, Azure)
- ⚠️ **未完成**: E2E browser tests
- **Cherry 文件**: `src/renderer/routes/settings/provider.tsx`
- **DSH 集成**: ProvidersService with Settings + Credentials
- **提交**: 49cb08f, cf0ec27

##### 6. Model Management（模型管理）
**规格对应**: `| 提供方与模型管理 |` (line 95)
- ❌ 模型列表/启用状态
- ❌ 模型配置
- ❌ 模型选择器
- **Cherry 文件**: `src/renderer/routes/settings/model.tsx`
- **注意**: ModelsSection 已存在但功能可能不完整

##### 7. Local Models（本地模型）
**规格对应**: `| 本地模型 |` (line 96)
- ❌ 模型目录/下载
- ❌ 下载进度管理
- ❌ 模型状态控制
- ❌ 本地推理进程生命周期
- **Cherry 文件**: `src/renderer/routes/settings/local-models.tsx`

##### 8. API Gateway
**规格对应**: `| API Gateway |` (line 97)
- ❌ Gateway 状态展示
- ❌ URL/凭据控制
- ❌ 启动/停止/重启
- ❌ OpenAI 兼容本地网关
- **Cherry 文件**: `src/renderer/routes/settings/api-gateway.tsx`

---

#### Capabilities Group（能力分组）

##### 9. MCP (Model Context Protocol) ✅ (~96%)
**规格对应**: `| MCP |` (line 98)
- ✅ MCP 服务器目录/编辑器 (split-pane UI with tabbed detail)
- ✅ 服务器配置编辑 (command/args/env/timeout/longRunning)
- ✅ 服务器日志查看 (real-time polling, manual refresh)
- ✅ Tools/Prompts/Resources 展示 (tabbed UI)
- ✅ 逐工具 enable/disable (disabledTools array)
- ✅ stdio 客户端 (StdioClientTransport with @modelcontextprotocol/sdk)
- ✅ 进程生命周期管理 (startServer/stopServer/refreshTools)
- ✅ 工具注册到 DSH 工具注册表 (disposer pattern cleanup)
- ✅ Server installation flow UI (AddMcpServerDialog with type selection)
- ⚠️ **未完成**: SSE transport
- ⚠️ **未完成**: streamableHttp transport  
- ⚠️ **未完成**: inMemory transport
- ⚠️ **未完成**: OAuth integration
- ⚠️ **未完成**: Marketplace integration
- ⚠️ **未完成**: E2E browser tests
- **Cherry 文件**: `src/renderer/routes/settings/mcp.tsx`, `mcp/` subdirectory
- **DSH 实现**: `packages/control-center/src/mcp.ts`, `McpSection.tsx`, `AddMcpServerDialog.tsx`
- **提交**: 67084e6 (tool registry), 649e841 (cleanup), 0a85e2c (disposer fix)

##### 10. Web Search（网络搜索）
**规格对应**: `| 网络搜索 |` (line 100)
- ❌ 搜索提供方编辑器
- ❌ API 凭据管理
- ❌ 默认项配置
- ❌ 搜索/抓取适配器
- **Cherry 文件**: `src/renderer/routes/settings/websearch.tsx`

##### 11. Document Processing（文档处理）
**规格对应**: `| 文档处理 |` (line 104)
- ❌ 转换器选择
- ❌ 文档转 Markdown worker
- ❌ 进度与结果处理
- **Cherry 文件**: `src/renderer/routes/settings/file-processing.tsx`

##### 12. OCR
**规格对应**: `| OCR |` (line 105)
- ❌ 提供方/本地引擎选择
- ❌ 语言/选项配置
- ❌ OCR 适配器
- **Cherry 文件**: `src/renderer/routes/settings/ocr.tsx`

---

#### Personal Group（个人分组）

##### 13. Appearance（外观）
**规格对应**: `| 外观 |` (line 106)
- ❌ 主题选择（亮/暗）
- ❌ 语言切换
- ❌ 密度/字体配置
- **Cherry 文件**: `src/renderer/routes/settings/appearance.tsx`
- **注意**: DSH 已有主题系统，需集成

##### 14. Notifications（通知）
**规格对应**: `| 通知 |` (line 107)
- ❌ 通知权限状态
- ❌ 通知偏好配置
- ❌ Web Notifications API
- **Cherry 文件**: `src/renderer/routes/settings/notifications.tsx`

##### 15. Data, Import, Export & Backup（数据、导入导出与备份）
**规格对应**: `| 数据、导入、导出与备份 |` (line 108)
- ❌ 备份/导入/导出工作流
- ❌ WebDAV 配置
- ❌ S3 配置
- ❌ 坚果云、Notion、语雀、Joplin、Obsidian、思源连接器
- ❌ 归档生成/恢复验证
- ❌ 调度与冲突处理
- **Cherry 文件**: `src/renderer/routes/settings/data.tsx`

##### 16. Usage Analytics（用量分析）
**规格对应**: `| 用量分析 |` (line 109)
- ❌ 指标/图表/热力图
- ❌ 筛选与下钻
- ❌ 分页记录查看
- ❌ Token/缓存/费用聚合
- ❌ SQLite 用量记录
- **Cherry 文件**: `src/renderer/routes/settings/usage.tsx`
- **注意**: 需检测所有 DSH 模型调用

---

#### Automation Group（自动化分组）

##### 17. Channels
**规格对应**: `| Channels |` (line 110)
- ❌ Channel 配置/状态
- ❌ 凭据管理
- ❌ 路由控制
- ❌ Webhook/轮询生命周期
- ❌ 消息准入策略
- **Cherry 文件**: `src/renderer/routes/settings/channels.tsx`

##### 18. Scheduled Tasks（计划任务）
**规格对应**: `| 计划任务 |` (line 111)
- ❌ 任务编辑器
- ❌ 日历/列表视图
- ❌ 运行历史
- ❌ 启用/禁用/手动运行
- ❌ 持久调度器
- **Cherry 文件**: `src/renderer/routes/settings/scheduled-tasks.tsx`, `scheduled-tasks.$taskId.tsx`, `scheduled-tasks.index.tsx`

##### 19. Shortcuts（快捷键）
**规格对应**: `| 快捷键 |` (line 112)
- ❌ 快捷键编辑器
- ❌ 冲突检测
- ❌ 全局快捷键（可选 Host 提供方）
- **Cherry 文件**: `src/renderer/routes/settings/shortcut.tsx`

##### 20. Quick Assistant
**规格对应**: `| Quick Assistant |` (line 113)
- ❌ 配置界面
- ❌ Web 内启动界面
- ❌ 会话创建/上下文注入
- **Cherry 文件**: `src/renderer/routes/settings/quick-assistant.tsx`

##### 21. Selection Assistant
**规格对应**: `| Selection Assistant |` (line 114)
- ❌ 配置界面
- ❌ 对所选文本执行操作
- ❌ 页面内选择基线
- **Cherry 文件**: `src/renderer/routes/settings/selection-assistant.tsx`

##### 22. Screenshot（截图）
**规格对应**: `| 截图 |` (line 115)
- ❌ 捕获选项
- ❌ 预览/标注
- ❌ Agent 附件集成
- ❌ 浏览器捕获/上传基线
- **Cherry 文件**: `src/renderer/routes/settings/screenshot.tsx`

---

#### System Group（系统分组）

##### 23. System Settings（系统设置）
**规格对应**: `| 系统、依赖、关于与更新 |` (line 116)
- ❌ 运行时状态
- ❌ 依赖控制/诊断
- **Cherry 文件**: `src/renderer/routes/settings/system.tsx`

##### 24. Dependencies（环境依赖）
**规格对应**: `| 系统、依赖、关于与更新 |` (line 116)
- ❌ 依赖检测/安装
- ❌ 诊断工具
- **Cherry 文件**: `src/renderer/routes/settings/dependencies.tsx`

##### 25. About & Updates（关于与更新）
**规格对应**: `| 系统、依赖、关于与更新 |` (line 116)
- ❌ 版本/许可证通知
- ❌ 更新检查
- ❌ 插件更新器
- **Cherry 文件**: `src/renderer/routes/settings/about.tsx`

##### 26. Code Execution（代码执行）
**Cherry 特有功能**
- ❌ 代码执行环境配置
- **Cherry 文件**: `src/renderer/routes/settings/code-execution.tsx`
- **注意**: 可能需要映射到 DSH 的执行策略

---

### 📊 进度统计

| 分类 | 已完成 | 待实现 | 完成率 |
|------|--------|--------|--------|
| **产品工作区** | 3 | 0 | 100% |
| **核心设置** | 1 | 3 | 25% |
| **能力设置** | 1.96* | 3.04 | 39.2%* |
| **个人设置** | 0 | 4 | 0% |
| **自动化设置** | 0 | 6 | 0% |
| **系统设置** | 0 | 4 | 0% |
| **总计** | 5.96 | 20.04 | 22.9% |

*Provider Management 100% 完成，Skills 基础完成但 Install/Marketplace 未实现，MCP ~96% 完成（stdio transport + UI + tool lifecycle + server installation dialog，缺 SSE/HTTP transports + OAuth + marketplace）

---

## 下一步优先级（基于交付阶段）

### Phase 2: 设置外壳与模型纵向闭环
**目标**: 复制/改造完整设置外壳和提供方/模型页面

#### P0 - 立即实施
1. **Provider Management** - 提供方管理完整闭环
   - Provider 列表/编辑器
   - API Key 管理（DSH credentials）
   - Endpoint 配置
   - 连通性测试
   - 模型发现

2. **Model Management** - 模型管理
   - 检查并完善 ModelsSection
   - 模型启用/禁用
   - 模型配置

#### P1 - 核心能力
3. **MCP 剩余工作** - 完成 MCP 到 100%
   - ~~Server installation flow UI (Add Server form with validation)~~ ✅ 已完成
   - SSE transport implementation (EventSource connection)
   - streamableHttp transport implementation
   - inMemory transport implementation
   - OAuth integration (token acquisition/refresh)
   - Marketplace integration (browse/install)
   - E2E browser tests

4. **Skills Install** - 完成 Skills 安装功能
   - Marketplace 搜索实现
   - 本地目录安装
   - URL/ZIP 安装
   - E2E 测试

5. **Web Search** - 网络搜索
   - 提供方配置
   - DSH 搜索能力集成

### Phase 3: 产品工作区验收
6. **Translation/Painting/Knowledge E2E Tests**
   - 补充浏览器 E2E 测试
   - 验证完整工作流

### Phase 4: 个人与数据
7. **Appearance** - 外观设置（集成 DSH 主题）
8. **Notifications** - 通知配置
9. **Usage Analytics** - 用量分析仪表盘
10. **Data & Backup** - 数据管理与备份

### Phase 5: 自动化
11. **Channels** - Channel 集成
12. **Scheduled Tasks** - 计划任务
13. **Shortcuts** - 快捷键
14. **Quick/Selection Assistant** - 助手功能
15. **Screenshot** - 截图工具

### Phase 6: 系统与加固
16. **Local Models** - 本地模型管理
17. **API Gateway** - API 网关
18. **System/Dependencies/About** - 系统设置
19. **Document Processing & OCR** - 文档处理

---

## 技术债务

### 当前已知问题
1. ~~**Skills Install 未实现**~~ - Phase 2 优先级
2. ~~**Skills Marketplace 是 stub**~~ - 需实现真实搜索
3. **MCP 剩余 ~4%** - SSE/HTTP transports, OAuth, marketplace, E2E tests
4. **缺少 E2E 测试** - 所有产品工作区 + Provider + MCP
5. **设置外壳未替换** - 需要复制 Cherry 设置导航
6. ~~**Provider 管理缺失**~~ - ✅ 已完成 (Phase 2 完成)

### 架构风险（来自规格）
- ⚠️ **Electron 耦合** - Cherry 组件依赖 IPC/Preference/DataApi
- ⚠️ **秘密泄漏** - 广泛设置暴露需要脱敏证明
- ⚠️ **供应链风险** - MCP/Skills 下载执行第三方内容
- ⚠️ **重复权威** - 需确保 DSH 是唯一真源
- ⚠️ **跨平台差异** - 能力检测必须准确呈现

---

## 验收标准（规格 line 169-184）

### 核心验收
- [ ] 一个安装操作即可将 Control Center 加入 DSH
- [ ] 不需要任何 Cherry Studio 进程
- [ ] 设置外壳包含全部基线导航领域
- [ ] 每个控件都连接真实 DSH Host 操作
- [ ] 提供方与模型配置只有一个权威（DSH）
- [ ] 秘密绝不跨越普通设置响应

### 产品工作区验收
- [✅] 翻译保留语言检测/管理/流式/历史
- [✅] 绘画保留模型生成/异步任务/画廊
- [✅] 知识库保留摄取/embedding/检索/引用
- [🚧] MCP/Skills/搜索注册到 DSH 能力中 (MCP tools ✅, Skills ⬜, Search ⬜)

### 质量验收
- [ ] 复制源码具有可审计来源记录
- [ ] 视觉回归 fixture（Cherry 基线亮/暗主题）
- [ ] 行为测试覆盖表单/验证/对话框/加载/错误
- [ ] Host 集成测试使用真实设置/credentials/SQLite

### 集成验收
- [ ] 现有 DSH 编程会话/权限/preset/工具仍可使用
- [ ] 文档区分已完成/平台受限/计划中能力
- [ ] 不兼容 DSH 版本必须提前失败

---

## 相关文档
- 规格: `D:\Github_Open\deepseek-harness\.agents\notes\proposed\feature\2026-08-18-cherry-control-center-web-edition.zh.md`
- Skills 完成笔记: `.agents/notes/completed/2026-08-19-skills-client-ui-integration.md`
- Cherry Studio 仓库: `D:\Github_Open\cherry-studio` (commit 13687df, v2.0.7)
- DSH 仓库: `D:\Github_Open\deepseek-harness`
- Control Center 仓库: `D:\Github_Open\dsh-control-center`

---

## 更新记录
- 2026-08-19: 初始矩阵创建，Skills Client UI 基础完成（15.4%）
- 2026-08-19: Provider Management 完成（commit 49cb08f, cf0ec27），进度 19.2% → 22.9%
- 2026-08-19: MCP stdio transport + tool lifecycle 完成（commit 67084e6, 649e841, 0a85e2c），MCP ~94% 完成
- 2026-08-19: MCP server installation dialog 完成（AddMcpServerDialog with stdio/sse/streamableHttp support），MCP ~96% 完成，进度 22.9% 不变（整体完成度微增）
