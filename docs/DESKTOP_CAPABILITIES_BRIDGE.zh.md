# DSH Control Center — 桌面原生能力桥（host-in-main）架构

> 目标：把 Cherry 桌面级的原生能力（文件/目录对话框、系统通知、托盘、全局快捷键、截图、OCR/PDF
> 本地模型）经 **DSH Host Cordis service** 真实暴露给运行在 loopback 页面里的 Control Center web UI，
> 让"桌面（已就绪）"过渡为真实接线。本文档记录可行性实测、架构与分阶段实施。

## 一、为何必须 host-in-main

Control Center web UI 运行在 Electron 加载的 loopback DSH surface 里（sandbox renderer，无 preload
bridge，也不向 renderer 暴露 Electron API——沿用 upstream 无 preload 原则）。renderer 只能经 DSH
`/api` RPC 与 Host service 通信。原生能力（`dialog`、`Notification`、托盘）**只在 Electron main 进程的
API 域**存在。因此能力桥唯一干净的形态是：

> Electron main 进程内嵌 DSH Host Cordis 根；Control Center 的 desktop 插件作为 Host plugin 注册
> `desktopNative` service（用 Electron `dialog`/`Notification` 实现），renderer 经 DSH 的
> `*Remote` 客户端描述符调用它。

这与 `deepseek-harness-desktop`（路线 A）同理：其 `desktop-shell` Host plugin "通过 Cordis effect
拥有 BrowserWindow、导航策略"。

## 二、可行性实测（2026-08，本机）

`apps/desktop/tests/host-in-main-probe.mjs`（`pnpm probe:hostinmain`）是一个可复现的 B0 门禁，已在
harness cwd 下验证：

- `RESOLVE_APPBOOT=OK` — 从 harness 解析 `@deepseek-ai/dsh-app-boot`。
- `PREPARE_PROFILE=OK C:\Users\user\.dsh\profiles\web` — app-boot 的 profile-boot 能准备 web profile
  （bundle compose）。
- `HOST_IN_MAIN=OK` — probe PASS。

**约束**：profile-boot 的 bare specifiers（`@deepseek-ai/cordis`）必须从 **harness 的 node_modules**
解析；因此门禁把探针以 **cwd=harness** 子进程启动，运行时 `chdir()` 无效（需进程启动时即 harness）。
实际 host-in-main 的 Electron main 也必须以 harness 为 resolver 锚。

## 三、目标架构

```
Electron main (host-in-main)
  └─ DSH Host Cordis 根 (profile 组合)
       ├─ upstream dsh-web-app (+ 第三方 bundle，含 @dsh-control-center/bundle)
       └─ desktop-native Host plugin (control-center 提供)
            ├─ service.desktopNative.fileDialog  → electron.dialog.showOpenDialog
            ├─ service.desktopNative.notify      → new Notification()
            └─ (托盘/快捷键/截图/OCR 后续)
            │      │
renderer ← DSH /api RPC ←  (control-center client: *Remote 描述符)
  └─ window.__DSH_DESKTOP__ marker 的 capabilities 列表按已真实接线能力扩充
```

## 四、分阶段实施

| 阶段 | 能力 | host-in-main 前置 | 验证 |
|---|---|---|---|
| B0 | host 内嵌 Electron main（锚 harness resolver，boot profile 出 loopback surface） | 重构 spawn→in-main | **门禁 `probe:hostinmain` 已 PASS**（profile 可 prepare）；下一步 main 内真 boot server 出 URL line + smoke |
| B1 | desktopNative.fileDialog = Electron showOpenDialog | B0 | 知识库「添加数据源」/文件上传走原生对话框 |
| B2 | desktopNative.notify = Notification；配 system 通知 | B0 | 通知设置页开关真实生效 |
| B3 | 托盘 + 全局快捷键（快捷键页从真实接线） | B0 | 托盘菜单 + 快捷键冲突检测 |
| B4 | 截图 / 划词；OCR/PDF 本地模型 | B0 + 本地模型管线 | 截图页/OCR 实时 |

每个能力上线前：live 验证 + `pnpm run check` + 打包 E2E；沿用"能力经 Host service 暴露、无 preload
bridge、UI 诚实标注（capabilities 列表只列真实接线的能力）"。

## 五、风险与边界

- host-in-main 重构是进程模型变更：spawn 子进程 → in-main，需回归现有连接/自启两条冒烟路径。
- 依赖解析域：必须以 harness 为锚（否则 cordis 版本错乱，见实测）；**probe 需 cwd=harness 启动，运行时
  `chdir()` 无效**。
- B0 门禁只验证了 profile 组织（app-boot trunk）可挂载；真正的 server 启动 + `desktopNative` service
  注册是 B0 主体的下一步（Electron main 内真·boot loopback surface，并在这层 Host 上加
  `service.desktopNative.fileDialog/notify`，renderer 经 DSH `*Remote` 调用）。
