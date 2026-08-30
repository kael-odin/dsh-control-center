# 🗺️ Migration Plan: Cherry Studio → DSH Control Center

> 行动计划（区别于 `PARITY_LEDGER.md` 的状态台账）。这里回答"接下来做什么、为什么这个顺序"。
> **本文件是活文档**：每完成一项就把 `- [ ]` 改 `- [x]` 并在文末变更日志追加一行；
> 计划本身允许随时修订——改计划不丢历史，直接编辑对应小节 + 日志注明理由。
> 状态符号沿用 PARITY_LEDGER：`✅ ⚠️ ❌ 🔄 ⛔`。
>
> 创建：2026-08-30。基线：Cherry `56cf04c3`（v2.0.10+，main）、DSH `cd5ef814`（v0.1.2-alpha.1）。
> 本仓基线：`7870cd3`（notes v2）+ 一批未提交的 provider 编辑器重构。

---

## 〇、第一性原理与铁律

Cherry 的本质价值 = **体验层**（消息流、composer、预设、设置 UX）+ **能力目录**（64 provider、
MCP 市场、知识库管线、备份矩阵）。DSH 的本质价值 = **运行时**（agent loop、工具管道、会话持久化、
权限模型、插件容器）。重叠目录只留一份：**DSH 服务面做后端，Cherry UI/UX 做前端**。

由此推出四条铁律，决定一切排序：

1. **契约先行**：凡绑死运行时契约的代码（remote client、peer 版本、兼容性校验），必须第一时间跟上
   DSH 上游节奏。契约漂移未消前，其他一切功能工作都建立在无法验证的地基上。
2. **重心在聊天**：设置面已 ~90%，而 Cherry 用户 80% 时间在聊天界面。home/chat 未迁移是最大缺口，
   是下一个主战役，而不是继续打磨设置页。
3. **只留一份**：能力目录（MCP/搜索/知识库/provider 路由）一律以 DSH 服务面为后端自持 UI，
   不在插件里复制第二套运行时。
4. **诚实降级**：DSH 无对应物的能力返回 needs-runtime / 诚实标注，永不伪装成功。这是本项目的品质基线。

---

## Phase 0 — 地基与止血 🔄

不做这步，后面所有工作都建立在流沙上。

### 0.1 工作区整理 🔄
- [ ] 分批提交 96 条未提交变更（provider 编辑器重构去 shim / 新增护栏测试 / 桌面壳与测试脚本改动），不得 squash 丢失历史
- [ ] 确认 `apps/desktop/pnpm-lock.yaml` 删除是否合理（workspace 根统一 lock），不合理则恢复

### 0.2 构建产物出库 🔄
- [ ] `.gitignore` 掉 `packages/*/lib/`，`git rm -r --cached` 清理跟踪
- [ ] pack:check 的产物审计诉求改由打包流程自证（`tests/packs.ts` 已有收敛），CI artifact 留档

### 0.3 DSH 契约升级至 0.1.2-alpha.1 ❌（最高优先级，阻塞一切验证）
> 0.1.2 带破坏记号变更簇：**ApiProxy 包整体删除**（`4f00a0b`），迁移到 typert Remote。
> 本仓 `channel-bridge.ts`（1899 行）重度使用 `ctx.apiProxy.sessions`，当前代码在 DSH 最新版直接失效。
- [ ] peerDependencies / `compatibility.ts` / 全部 `@deepseek-ai/dsh-*` 引用 bump 至 0.1.2-alpha.1
- [ ] `apiProxy.sessions` → `ctx.remote.session` / `ctx.sessionController`（channel-bridge、assistant、update 等）
- [ ] settings/credentials 旧 RPC → `ctx.remote.settings` / `ctx.remote.credentials` controllers
- [ ] directory-picker 旧 RPC → 新 Remote 面
- [ ] vendored declaration mirrors（`application-slots.ts`、`use-sync-external-store.d.ts` 等）按 0.1.2 重新对表
- [ ] 全量 build + pack:check + 三套测试（vitest / Playwright E2E / 桌面 smoke）通过

### 0.4 上游跟随机制 ❌
- [ ] CI/脚本：DSH 出新版本 → 对比契约包 diff → 自动产出 issue 清单（跟随上游是"白拿生态"的前提）
- [ ] PARITY_LEDGER 升级为机器可读 checklist（每项：cherry 源路径 ↔ 本仓实现路径 ↔ 状态 ↔ 验收脚本），
      cherry-studio pull 后脚本自动 diff 出新增设置项/新消息动作

### 0.5 轮询 hack 清理 ❌
- [ ] `src/client/index.ts` 大量 `setInterval(25ms)` 探测 remote 就绪 → 换成 DSH HostObservable/boot graph 事件订阅

---

## Phase 1 — 迁移聊天主界面 ❌（主战役）

home/chat 完全未迁移，是 Cherry 的灵魂。照搬 Cherry 成熟架构，消息流 UI 挂进 DSH `conversation.*` slot 体系。

### 1.1 消息动作注册表 ❌
- [ ] 移植 `chat/actions/actionRegistry.ts` 模式（可扩展、availability/分组/子菜单/快捷键标签）
- [ ] 消息菜单全动作：复制/编辑/重新生成/@模型回答/翻译/点赞收藏/存笔记/存知识库/删除/新分支/多选/导出
- [ ] 挂 `conversation.chat.assistant-actions` / 对应 DSH slot

### 1.2 消息块渲染器 ❌
- [ ] ThinkingBlock（思考链动画+预览+最小展示时长）
- [ ] ToolBlockGroup（工具调用折叠）→ 对接 `conversation.details.tool`；webSearch/knowledge/mcp/painting 子渲染器
- [ ] CitationsList / ImageBlock / ErrorBlock / RetryStatusBlock / MessageTranslate
- [ ] CompactionAnchorBlock → 映射 DSH compaction（GeneralSection 已有 spill 策略联动）

### 1.3 消息列表体验层 ❌
- [ ] 虚拟列表 + 吸底跟随 + 滚动位置记忆 + 平滑滚动
- [ ] 消息内搜索 + 锚点导航 + 分支 SiblingNavigator
- [ ] 数据源走 `ctx.remote.session` 历史流与 live 控制状态

### 1.4 Composer token 化输入 ❌
- [ ] 移植 `composer/` 架构：ComposerCore/Surface + token 化输入（附件/引用/链接/文件夹/提示词变量）
- [ ] 工具面板注册表：附件、@知识库、@MCP 资源/提示词、笔记引用、生成图片、网页搜索、快捷短语、斜杠命令、permissionMode
- [ ] 输入历史 + 草稿 + 粘贴处理 + 后续消息队列（QueuedFollowupsDock）
- [ ] 挂 `conversation.composer` / `conversation.composer.bar/dock` slot

### 1.5 话题/会话管理 ❌
- [ ] AI 自动命名、pin、清空、跨助手移动（DSH 无逐会话 agent 编排时按 channel-bridge 先例做模型+提示词覆盖）
- [ ] 分支树可视化（TopicBranchPanel / TopicMessageFlowCanvas）
- [ ] 话题上下文菜单全动作集（导出 image/markdown/word/notion/yuque/obsidian/joplin/siyuan）
- [ ] 策略：导航与话题侧栏用 Cherry 的，turn 执行用 DSH agent loop，不重叠造轮子

**验收标准**：DSH 桌面壳内完成带附件、@知识库、思考链展示、分支切换、重新生成的完整对话，体验不输 Cherry 本体。

---

## Phase 2 — 能力目录对齐 ❌（可大量并行）

按 PARITY_LEDGER 缺口 ∩ Cherry v2.0.10 盘点差集，优先级从高到低：

- [ ] **Provider 注册表**（P0）：移植 Cherry `packages/provider-registry` 64 provider 声明式定义（纯数据零运行时耦合）→ 独立包 + DSH `llm-pi-ai` 路由字段映射层；provider 专属设置（Bedrock/Vertex/Copilot OAuth）与热更新快照
- [ ] **知识库 RAG 自动注入**（P0）：现在只有 agent 主动调 `knowledge_retrieve`；在 DSH prompt 组装点/工具调用前钩子实现检索自动注入（Cherry 语义）
- [ ] **MCP 补齐**（P1）：内置服务器 3/9 → 9/9（dify-knowledge/didi）；市场 + Npx 搜索 + 服务器信任机制 + 日志页；逐工具自动批准在 DSH guarded pipeline（allow/deny/ask）上找映射，映射不了诚实标注
- [ ] **备份导出矩阵**（P1）：Notion/语雀/Obsidian/Joplin/思源导出——纯 HTTP/文件逻辑，抄 Cherry 主进程对应 service，经 `ctx.fs`/remote client 暴露；补 Markdown 导出设置、隐私模式、清除缓存
- [ ] **代码执行**（P1）：0.1.2 有 subprocess/code-runtime，重新评估"DSH 无 Pyodide 对应物"旧判定，优先用 DSH code-runtime 实现
- [ ] **Assistant 预设系统**（P2）：提示词变量模板 + 快捷短语管理（PromptSettings parity），数据走 settings namespace
- [ ] **Mini Apps / Files / Launchpad**（P2）：mini-app 权限模型抄 Cherry `miniApp/`（grants/activityLog/capabilities），webview 挂桌面壳；Files 用 DSH `ctx.fs` + S3 存储
- [ ] **i18n**（P2）：移植 Cherry 12-locale 结构 + extract/check 脚本；DSH slot 注册原生支持 locale namespace
- [ ] **Channels permissionMode**（P2）：逐频道生效接入 DSH 权限模型
- [ ] **General/Appearance 收尾**（P3）：客户端 ID、菜单呈现模式、企业外链、Node 版本行并入 Dependencies

---

## Phase 3 — 桌面壳系统集成 ❌

全部在 Electron 主进程，与 DSH 契约无关，风险最低，可与 Phase 1/2 并行。

- [ ] 托盘偏好实装（启动进托盘/关闭行为/点击托盘唤起快捷助手）——General 已有 UI，main.mjs 接线
- [ ] 全局快捷助手小窗（QuickAssistantService parity：全局唤起球/小窗）
- [ ] 划词助手（SelectionService parity：selection/ overlay）
- [ ] 截图（screenshot overlay + nativeCaptureBackend parity）
- [ ] 开机自启 + 硬件加速开关确认重启生效
- [ ] 自动更新闭环：electron-updater（当前只有插件自更新，桌面壳无）
- [ ] 代理设置真正生效（确认 ProxyService 级接线而非仅设置页 UI）
- [ ] 硬编码清理：`DEFAULT_HARNESS_DIR = 'D:\\Github_Open\\deepseek-harness'` 开发机 fallback、翻译 PDF workerSrc CDN 依赖

---

## 长期机制（比任何单个功能都重要）

- **三仓 CI 护栏**：cherry-studio / deepseek-harness / 本仓 check 联动；DSH 新版本 → 契约 diff 自动 issue，24h 内察觉漂移。
- **PARITY_LEDGER 机器可读**：从散文台账升级为 checklist + 验收脚本，迁移不烂尾。
- **诚实降级入宪**：needs-runtime 原则写入 PLUGINIZATION.md 成为硬规矩。
- **多版本适配层**：peerDeps 目前钉死单版本（rc.2），0.3 契约升级后评估"契约探测 + 优雅降级"的多版本窗口策略。

---

## 变更日志（回填区）

| 日期 | 变更 | 理由 |
|------|------|------|
| 2026-08-30 | 创建计划；两上游仓库已更新（Cherry `56cf04c3`、DSH `cd5ef814` = 0.1.2-alpha.1） | 初版规划，用户授权按此推进 |
| 2026-08-30 | Phase 0.3 上升为最高优先级 | 审查发现 DSH 0.1.2 删除 ApiProxy 包，当前代码在新版宿主上失效 |
