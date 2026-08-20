# DSH Control Center — Desktop Shell (P0/P1)

Electron 桌面壳，把 DSH loopback Web surface 装进原生窗口，并挂载 `@dsh-control-center/bundle`
的 Control Center 表面。

- **P0（薄壳）**：窗口 + surface 加载 + 诚实冒烟。
- **P1（自包含 host）**：当目标端口无 surface 监静时，壳自动 spawn 一个 DSH host
  （`--port 0` 由 OS 挑空闲端口），从就绪行解析实际 URL 并加载 —— 免去手动先起 `dsh web`。
  原生能力桥（文件对话框、通知、全局快捷键、托盘、OCR/PDF 本地模型、频道推送）按
  `docs/DESKTOP_PLAN.zh.md` 的 P1–P5 逐步接入。

## 结构

```
apps/desktop/
  bin/main.mjs        Electron main：单实例锁 → 探测 surface → 未监听则自启 host → 加载 BrowserWindow
  tests/smoke.mjs     P0/P1 冒烟：--e2e 启动壳；默认断 surface+P0 挂载，--selfhost 断自启 URL 解析
  package.json        独立包（electron devDep）
```

## 为什么独立于根 workspace

根 `pnpm-workspace.yaml` 只含 `packages/*`；`apps/desktop` 作为**独立目录**（不进根 workspace），
因此 electron 的二进制下载与构建不会混入根 `pnpm run check` 的构建/安装链路。根
`tsconfig`/`oxlint` 不引用 `apps/`，不触碰根 check 任何环节。

## 运行前提

- **连接已有 surface**：一个 DSH Web surface 监听默认 `http://127.0.0.1:3080/`（即 `dsh web`），
  或用 `DSH_CONTROL_DESKTOP_URL` 指向其它 loopback surface。
- **自启**：`DSH_HARNESS_DIR` 指向 `deepseek-harness`（默认 `D:\Github_Open\deepseek-harness`）；
  壳用系统 Node.js（`DSH_DESKTOP_NODE`，默认 `node`）spawn host，并**复用用户默认
  `~/.dsh` home**（与 `dsh web` 共享 profile/bundle/会话数据），因此自启 surface 同样挂载
  Control Center；`DSH_DESKTOP_HOME` 可显式指定变为独立隔离 home。

> 已知边界：electron 二进制以 `ELECTRON_RUN_AS_NODE` 当 node 用时，与 harness 的原生目录选择
> 依赖 ABI 不匹配，故 P1 暂用系统 node spawn；打包阶段将随应用内置匹配版本的 node。

## 安装与运行（一次性步骤）

```bash
cd apps/desktop
pnpm install --ignore-workspace          # 只装本包依赖（不触碰根 workspace）
node node_modules/electron/install.js    # 放行 electron 二进制下载（pnpm 默认拦截 build 脚本）
```

```bash
pnpm start        # 连接 127.0.0.1:3080 surface（在线则连，否则自启）
```

## 冒烟测试

```bash
cd apps/desktop
pnpm smoke            # 需要 3080 surface 在线：断 SURFACE_LOADED + CONTROL_CENTER_ATTACHED
pnpm smoke:selfhost   # 无需已有 surface：断 self-host ready(URL 行解析) + SURFACE_LOADED + CONTROL_CENTER_ATTACHED
pnpm pack:dir && pnpm smoke:packed   # 打开发包目录并验证打包后的 exe 能加载控制中心
```

连接冒烟示例：

```
[desktop] surface already listening at http://127.0.0.1:3080/
[desktop] SURFACE_LOADED
[desktop] CONTROL_CENTER_ATTACHED=true
smoke PASS
```

自启冒烟示例：

```
[desktop] no DSH surface at http://127.0.0.1:39999/; self-hosting…
[desktop] self-host ready at http://127.0.0.1:56682
[desktop] SURFACE_LOADED
[desktop] CONTROL_CENTER_ATTACHED=true
smoke PASS(self-host)
```

## 打包发行

`apps/desktop` 用 [electron-builder](https://www.electron.build/)（devDependency）打包：

- `pnpm pack:dir` — 产出未安装目录 `release/win-unpacked/DSH Control Center.exe`（快速冒烟用，不生成安装器）。
- `pnpm pack:win` — 产出 Windows NSIS 安装器（需要证书/下载 nsis + winCodeSign，CI 或发布时用）。
- 配置在 `electron-builder.json`：appId、productName=DSH Control Center、win(`build/icon.png` 品牌图标)/mac/linux
  的 `--dir` 目标、`files` 只收 `bin/**` + `build/**` + `package.json`（asar 打包主进程 + 托盘图标）。
- 打包冒烟：`pnpm smoke:packed` spawn 打包后的 exe `--e2e`，断言 `SURFACE_LOADED` + `CONTROL_CENTER_ATTACHED=true`。
- 正式安装器：`pnpm pack:win` 产出 `release/DSH Control Center Setup 0.1.0.exe`（NSIS，93MB，用户级安装）。
  已本地验证：静默安装到 `%LOCALAPPDATA%\Programs\@dsh-control-centerdesktop` → exe `--e2e` 冒烟
  （surface + NATIVE_BRIDGE=REACHED + tray/hotkeyRegistered:true）；卸载器静默卸载彻底移除目录。

> `build/icon.png` 是 ffmpeg 生成的**过渡品牌图标**（纯品牌绿），正式设计后替换；代码签名需要受信证书
> （当前 signtool 走未签名 → Windows SmartScreen 提示未知发布者，可"仍要运行"）。**分布边界**：当前正式
> 安装包是"复用本机已有 `deepseek-harness` 的开发/已有环境发行"——自启 host 依赖 `DSH_HARNESS_DIR`
> （默认 `D:\Github_Open\deepseek-harness`）与系统 node（`DSH_DESKTOP_NODE`）。要做**完全自包含**
> （随安装内置匹配 ABI 的 node + 物化 harness）是更大的发布架构项，见 `docs/DESKTOP_CAPABILITIES_BRIDGE.zh.md`。

## 原生能力桥（main 原生微服务）

Electron main 起一个 **loopback HTTP 微服务**（`startNativeService()`，127.0.0.1 高端口 + 每启动随机
bearer token + CORS），路由：`GET /dsh-native/status`、`POST /dsh-native/fileDialog`（
`dialog.showOpenDialog`）、`POST /dsh-native/notify`（`Notification`）。renderer 用 marker 里的
`nativeUrl`/`nativeToken` 以带 `Bearer` 的 `fetch` 调用（`packages/control-center/.../desktop-capabilities.ts`
`desktopNativeApi.status()/pickFile()/notify()`）。无 preload bridge。

冒烟（dev-connect / dev-selfhost / packed-exe）均断言 `DESKTOP_MARKER=true` + `NATIVE_BRIDGE=REACHED`
（renderer 真实触达 Electron main 服务）。交互弹出（真对话框/真通知）留待 live 人工验证。详见
`docs/DESKTOP_CAPABILITIES_BRIDGE.zh.md`。

> 历史：`pnpm probe:hostinmain` 验证了 host 的 app-boot trunk 在 harness resolver 下可准备 profile
> （`HOST_IN_MAIN=OK`）；因 Electron 内置 node 解析 harness workspace 裸依赖受阻，能力桥采用
> main 原生微服务桥而非 host 内嵌。

## 桌面环境探测

壳加载页面后向 renderer 注入 `window.__DSH_DESKTOP__`（含 `shell`/`host`/`version`/
`capabilities:['window','fileDialog','notification']`，以及 bridge 存在时的 `nativeUrl`/`nativeToken`）
并派发 `dsh-desktop-ready`。web UI（`packages/control-center/src/client/desktop-capabilities.ts`）据此把
"需要桌面版"的行切换为"桌面（已就绪）"——仅在桌面壳里有该标记，浏览器标签页永看不到，因此 web 预览与
E2E 保持诚实标注。

## 后续（P1–P5）

- 单实例锁已实现；自启 host 已实现（`--port 0` + 就绪行 URL 解析 + 复用默认 home，surface 含完整
  Control Center）；原生能力桥已握手连通（status/fileDialog/notify 路由就绪）。
- 下一步：文件对话框/系统通知在 UI 侧真实接线（状态栏/设置页 + live 验证），随能力扩充
  `capabilities`；接托盘/全局快捷键；随应用内置 node + 打包发行。
- 每阶段前：live 验证 + `pnpm run check` + 打包 E2E；Cherry 借鉴进 provenance。
