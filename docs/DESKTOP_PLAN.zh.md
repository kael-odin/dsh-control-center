# DSH Control Center 桌面版方案（Draft）

> 目标：把当前 web 插件形态的 DSH Control Center 演进为 Cherry Studio 同级别的桌面应用，
> 补齐 web 端天花板能力：OCR/PDF 本地解析、系统级文件/目录对话框、托盘/通知/全局快捷键、
> 本地模型托管、代理 TUN、频道消息推送等。

## 一、现状与复用边界

当前形态：`dsh-control-center` = 一个 DSH **可安装 profile bundle 插件**（@dsh-control-center/bundle），
运行在 DSH host（`deepseek-harness`）+ web 前端（`dsh web`）之上。全部 UI、host 服务、wire 层
都在插件包内，对 harness 零侵入。

**桌面化必须最大化复用这层**：翻译/绘画/知识库/设置九成 UI 与全部真实服务逻辑（SQLite、LLM、
用量记录）不需要重写——桌面版只是换一个"壳 + 桌面能力桥"。

## 二、两条路线

### 路线 A：deepseek-harness-desktop（推荐先试）— 已审计（2026-08，commit 558eb53）
- 仓库 `https://github.com/anywhere-labs/deepseek-harness-desktop`（MIT，活跃演化中，v2.0.1）。
- 架构：`dsh-plugin-desktop` 是一个 **Cordis 插件**，在 Electron main 里内嵌 Host Cordis 根，
  沿用现有 loopback Web carrier（无 preload bridge，不暴露 Electron API 给 renderer）。
  `cordis.patch.yml` 在 `dsh-web-app` 后插入 desktop-shell / desktop-profiles / desktop-terminal /
  desktop-pnpm / desktop-updates 等 layer；**保留被选 profile 的第三方 bundle 相对顺序**。
- 兼容性：依赖 DSH `0.1.1-rc.2`（与我们 boxed 的基线一致），经 Yarn patch 钉死相关 @deepseek-ai 包。
- 接入路径：创建/选用 `desktop` profile → `dsh plugin --profile desktop add @dsh-control-center/bundle`，
  我们的插件即自动进入 Loader 组合，UI 与服务**零重写**；profile 切换有 last-known-good 回滚。
- 契合点：正是 DESKTOP_PLAN 想要的"桌面本身也是插件"的薄宿主形态。
- 成本：需 `yarn@4.18.0`（本机为 yarn 1）+ Electron toolchain + 平台安装包下载；发布/更新由
  anywhere-labs 主导，我们作为"被安装插件"而非常驻产品线。
- 桌面能力桥（`window.api.*` 命名空间并不存在，桌面能力经 Host Cordis service 暴露，见插件 service 文档）。

### 路线 B：自建 Electron 壳（Cherry 同构）
- 结构：`apps/desktop/`（electron-vite：main/preload/renderer）+ `packages/`（复用 DSH 各
  @deepseek-ai 包）+ 我们的 bundle 装进 desktop profile。
- 桌面能力桥（preload → IPC）按 Cherry 的 `window.api` 命名空间复刻：
  - `window.api.file.select / selectFolder`（原生文件/目录对话框）
  - `window.api.shortcut.register / onRegistrationConflict`（全局快捷键 + 冲突检测）
  - `window.api.screenshot.capture`（截屏 + 框选 + 标注，Cherry 有完整实现可借鉴）
  - `window.api.notification`（系统通知）
  - `window.api.tray`（托盘 + Quick Assistant 窗口）
  - OCR：Cherry 的本地模型方案（下载 PaddleOCR 类模型到 userData，`useLocalModel('ocr')`）
- 收益：完全可控、可对标 Cherry 桌面体验；风险：工作量最大（窗口/托盘/自动更新/签名/发布）。

## 三、插件形态的桌面版（推荐：保持插件身份）

**结论：桌面版仍然做成"插件"。** DSH 架构天然支持：
- 桌面版 = 新的 host 分发（desktop runner），profile 里 `plugin add @dsh-control-center/bundle`
- 插件新增"桌面能力探测"：检测到 `window.api` 桌面桥时启用对应能力（文件对话框、快捷键注册、
  截图、通知），web 环境下保持现在的诚实降级标注
- 这样：web 预览 / 打包 E2E / 桌面版三态共用一份代码，UI 工作零浪费

## 四、桌面能力分阶段实施

| 阶段 | 能力 | 依赖 |
|---|---|---|
| P0 | Electron 壳 + DSH host 内嵌 + bundle 安装 | 路线 A 或 B 落地 |

> **P0 已落地（路线 B，2026-08）**：`apps/desktop`（Electron main 单实例锁 + 探测/唤起 loopback
> surface + BrowserWindow `--e2e` smoke 断言 SURFACE_LOADED 与 CONTROL_CENTER_ATTACHED）。当前先
> 连接已运行的 `dsh web` surface 作外接验证；host 内嵌（main 里 spawn/profile-boot）为下一步。
| P1 | 原生文件/目录对话框（替换 showDirectoryPicker）、系统通知 | preload IPC 桥 |
| P2 | 全局快捷键（快捷键页从"桌面"标签变真实生效）、托盘 | 同上 |
| P3 | 屏幕截图（截图页真实化）、划词助手（取词/工具栏/悬浮窗） | Cherry 实现借鉴 |
| P4 | OCR/PDF 本地解析（翻译文件上传、截图文字识别）、本地模型托管 | 模型下载管线 |
| P5 | 频道消息推送（飞书/Telegram/QQ/微信/Discord/Slack 真实连接） | 长连接 + 平台 API |

## 五、质量红线（延续 web 版）

- 每个能力上线前：live 验证 + `pnpm run check` + 打包 E2E（桌面版增加 playwright electron 冒烟）
- 桌面桥缺失时 UI 保持诚实标注，不假装可用
- Cherry 代码借鉴全部进 provenance
- 及时提交推送 + 更新记忆

## 六、下一步建议（审计结论后）

路线 A 已审计确认可落地，且与我们的插件 100% 复用。但存在两个现实约束：
1. 路线 A 用 `yarn@4`（本机是 yarn 1）+ Electron 安装包下载，构建与发布由第三方仓库主导；
2. 环境已具备完整 `deepseek-harness`（pnpm10 + node24），自建壳更贴近"借鉴 Cherry electron 壳、产品化"的目标。

故推进顺序（每个能力上线前 live 验证 + `pnpm run check` + 打包 E2E；Cherry 借鉴进 provenance）：
1. 确认桌面壳承载位置：在本机 `deepseek-harness` 新增 `apps/desktop`（路线 B，可控且环境就绪）
   vs 直接安装路线 A 发布的安装包手动验证。→ 拍板后进入 P0。
2. P0：Electron main 加载 loopback Web surface + profile 装 @dsh-control-center/bundle 冒烟。
3. P1：桌面能力桥（原生文件/目录对话框、系统通知）——经 Host Cordis service 暴露，UI 侧能力探测启用。
4. P2：全局快捷键真实化、托盘；P3：截图/划词；P4：OCR/PDF 本地模型；P5：频道推送。
