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

### 路线 A：deepseek-harness-desktop（推荐先试）
- 拉取 `https://github.com/anywhere-labs/deepseek-harness-desktop`，评估其成熟度。
- 预期形态：Electron 主进程内嵌 DSH host（node 侧）+ 渲染进程加载现有 web UI + profile 安装
  我们的 bundle。插件身份不变——**安装即用，卸载即走**。
- 收益：桌面壳（窗口/托盘/更新）由仓库提供，我们只补桌面能力桥；插件复用度 100%。
- 风险：仓库可能不活跃/未达生产级，需先审阅其架构与 license。

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

## 六、下一步建议

1. 拉取并审阅 `deepseek-harness-desktop`（1-2 小时），决定 A/B
2. 若 A 可用：接 P0（壳 + bundle 安装冒烟）→ P1（文件对话框 + 通知）
3. 若 B：按 Cherry electron-vite 结构搭 `apps/desktop/`，先补 P0-P1
