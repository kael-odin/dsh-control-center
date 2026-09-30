# 0.2.0 契约移植路线图（2026-09-30 侦察定稿）

> 基线：main = 0.1.6-alpha.1（可部署）；移植进行时分支：`contract-0.2.0-port`（版本钉/兼容门/
> agent-preset 改名 chase 已完成，tsc 134 错误，约 60% 是 settings 接缝的级联）。
> 上游跨度：0.1.6-alpha.1 → 0.2.0-rc.2 共 3298 commits；官方桌面版（Electron 壳包完整 Web
> 应用）就发布在 0.2.0-rc.2 上，npm `latest` = `0.2.0-rc.2`。

## 为什么这不是一次版本号升级

0.2.0 **删除了插件命名空间 settings API**。`ctx.settings.register(ns, schema)` /
`scope.get()/update()` 不复存在；`SettingsForms`（`@deepseek-ai/dsh-settings`）改为把插件
`static Config` 投影成 loader 条目键的表单（`describe()/update()/mutate()/replace()`，
改动 Config 会触发插件重启）。**任何沿用 Config 表单存用户态开关的方案都会带来"改一个开关
重启整个插件"的语义**，不可接受。

wire 层（`dsh-api-settings-controller`）**仍是 namespace 形状**（describe/update/mutate
+ revision），所以客户端存储的读写形状可以原样保留——只换数据源。

## 移植方案（已定，按序执行）

### P0 · host 自持设置存储（消掉 ~60% tsc 错误）

- 新建 `packages/control-center/src/settings-store.ts`：`ControlCenterSettings` 服务，
  复用本项目已在 `file-processing-tasks.ts` 验证过的 storage-domain 接缝
  （`defineDomain` + `domain.table('namespaces')`，KvTable<string, {revision, value}>）。
  API 对齐旧 scope：`register(ns, schema)`（元数据）/ `get(ns)` / `update(ns, patch)`
  （浅合并 + revision 递增）/ `list()`。
- 全部 host 服务替换 `ctx.settings.register/get/update`：
  index.ts（general/model-prefs/api-keys/composer/knowledge/appearance/notifications/
  provider-stash/gateway/notes-starred/onboarding）、data.ts、file-processing.ts、
  local-models.ts、mcp.ts、providers.ts、tasks.ts、channel-bridge.ts。
- `SettingsScope` 类型导入全部删除（TS2614 源头）。

### P1 · 客户端换数据源（不动 UI 逻辑）

- 新增 `controlCenterSettings` typert remote（describe/mutate 两个方法，形状照抄旧 wire）。
- 客户端存储换源：general-store、NotificationSection、AppearanceSection（仅 appearance
  命名空间；`ui-theme` 仍走 `api.settings`，是 DSH 原生条目）、model-prefs-store、
  channels-store、welcome-store、notification-runtime 的 refreshPreferences。
- `data.ts` 的 exportControlCenter/importControlCenter 改读适配器。
- `SettingsScopeBinder` 导入断裂：client-ui-settings/client 导出面变了，按新导出重接
  `ctx.get('settingsScope')`。

### P2 · 图标自持

0.2.0 的 `dsh-client-ui-primitives` 只剩权限组图标（FullAccess/ReadOnly/WorkspaceWrite ×
Medium/Regular），通用图标全部移除。新建 `client/cc-icons.tsx` 内联 SVG（Close/Copy/Search/
Plus/Trash/Chevron×3/Check/Loading/Pause/Send/Globe/Data/Sparkle/Settings，约 20 枚），
替换 12 个文件的 import（旧名 `IconXOutline16` 等全部悬空）。

### P3 · 会话列表形状

`SessionListState` 只剩 `{ ids, byId, phase, projectionsBySession }`；
`current/currentAddress/subagentsByParent/jobsBySession` 移除；`ISessions` =
`list/retain/using/retainInfo`——"当前会话"变成 view-owner 的 binding 职责。
- 受影响：client/index.ts（connection/reset 刷新）、SettingsRoot.tsx、
  ModelSelectionPanel.tsx（`.current`/`.currentAddress`）、notification-runtime.spec 夹具。
- 移植时先在 0.2.0 web 环境用探针确认 `ctx.sessions.list` 运行时快照的真实形状，再决定
  "当前会话 id" 从哪个 binding 源读。

### P4 · 收尾

- compatibility 窗口 `/^0\.2\./`（分支上已改）、`SUPPORTED_DSH_VERSION='0.2.0-rc.2'`、
  baseline `639ed01539`（分支上已改）。
- `tests/providers.spec.ts`：`@deepseek-ai/dsh-settings-file`（上游已删包）的
  `FileSettingsProvider` 测试夹具需要替代（in-memory settings provider）。
- `pnpm check` 全绿 → `pnpm run pack:check` → 装进本机 web profile（npm dsh 需先升到
  0.2.0-rc.2，`npm i -g @deepseek-ai/dsh@0.2.0-rc.2`）→ 浏览器实测。
- E2E：本机 harness checkout 已在 0.2.0-rc.2 且能起（`pnpm run clean` 后 `start-dsh.cmd`
  全量重建——跨大版本 lib 戳会失真，这是 09-30 实测教训）。
- 双 profile 分发：web 用 npm dsh 装；desktop profile 用桌面版自带 CLI
  （`dsh plugin --profile desktop add`，需先退出桌面应用）。

## 分支上已完成（contract-0.2.0-port @ 6f29270）

- pnpm-workspace.yaml overrides（247 包）+ 三个 package.json 全部升到 0.2.0-rc.2；
  cordis 4.0.4 / schemastery 3.18.4 / cordis-plugin-* 各自 npm 最新（loader 1.0.5 peer
  要求 cordis ~4.0.4，吻合）。
- 改名 chase：`dsh-agent-presets` → `dsh-agent-preset-registry`（0.2.0 起 `trust` 字段
  消失，`remoteExportList()` 返回 `{presets:[...row, isDefault]}`）；`AgentPresetsService`
  已重接；`dsh-experimental-agent-team-web-profile` → `-agent-team-profile`；
  `dsh-settings-file` 上游删除。
- 兼容门窗口 `/^0\.2\./` + 错误消息标签 + compatibility.spec 夹具全部更新；
  bundled-deployment 测试加 `DSH_HOME` 沙箱（机器状态污染防御，09-28 教训同款）。

## 2026-09-30 已落 main（先行手术）

桌面壳整体退役（73ac8e4）：官方桌面版吸收了托盘/自启动/代理/全局热键/截图/窗口 chrome/
原生文件对话框/硬件加速/菜单呈现全部面。按诚实标签宪法删开关而非留死开关；
对话完成通知换 `conversation` 键继续存在；频道 Agent 绑定换新
`controlCenterAgentPresets` 服务。check 全链绿。

## 进度日志

- **2026-09-30 · P0 完成（host 自持设置存储）**：`settings-store.ts` 落地（ControlCenterSettings：
  storage-domain KvTable 存 `{revision, value}`，register/get/update/describe/watch 全套旧语义，
  schema 默认值惰性求值，无 storageDomain 时诚实降级内存并告警）。13 个 host 文件完成
  `ctx.settings.*` → `ctx.get('controlCenterSettings')!*` 机械替换 + inject 列表更新 +
  SettingsScope 类型导入清除。三处 `agent-default-model` describe 扫描（gateway×2/notes/
  channel-bridge）改走 0.2.0 原生 `ctx.get('agentDefaultModel').currentSelection()`。
  context-policy 按 0.2.0 merge-extensible 惯例自声明 `control-center-context-policy`
  source kind。四个 codec 的 `schema:` 换成惰性 `create: () => schema`（0.2.0 TypertCodec）。
  knowledge/painting 的 SettingsProvider → SettingsForms。**11 个 spec 的假 settings 双打
  全部换成真 ControlCenterSettings 实例（降级内存）**；providers 根 spec 的
  FileSettingsProvider（上游已删包）换成真 store——P4 的该项提前完成。
  验收：host tsc 0 error（剩 41 全在 client/，P1-P3 范围）；vitest **289/289 全绿**
  （与 0.1.6 基线同覆盖，零丢失）；lint 0。教训新增：vitest 的 spy 用
  `mockImplementation`（本版本无 `callsFake`）；大补丁脚本用 Write 写文件再执行，heredoc
  会被截断。
- 下一步：P1 客户端换源（controlCenterSettings typert remote + 7 个客户端存储 +
  SettingsScopeBinder 重接）。
