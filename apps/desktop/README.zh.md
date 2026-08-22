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

- **默认自启**：桌面壳会使用 `DSH_HARNESS_DIR` 指向的官方 `deepseek-harness`，在空闲端口启动独立 surface。默认使用 Windows 原生资源管理器目录选择器；设置 `DSH_DESKTOP_DIRECTORY_PICKER=browse` 才切换到应用内目录浏览。
- **连接已有 surface**：仅当设置 `DSH_CONTROL_DESKTOP_USE_EXISTING=1` 且未设置 `DSH_CONTROL_DESKTOP_SELF_HOST=1` 时，才连接默认 `http://127.0.0.1:3080/`；显式设置 `DSH_CONTROL_DESKTOP_URL` 也会进入连接模式。`DSH_CONTROL_DESKTOP_SELF_HOST=1` 优先级最高。
- **自启路径**：壳用内置 Node.js（`vendor/node/node.exe`，node 24 —— ABI 与 harness 匹配）spawn host；无内置时回退 `DSH_DESKTOP_NODE` 或系统 `node`。桌面壳复用用户默认 `~/.dsh` home（与 `dsh web` 共享 profile/bundle/会话数据），`DSH_DESKTOP_HOME` 可显式指定独立 home。

> 已知边界：electron 二进制以 `ELECTRON_RUN_AS_NODE` 当 node 用时，与 harness 的原生目录选择
> 依赖 ABI 不匹配，故随应用内置匹配版本的 node（node 24，`vendor/node`，extraResources 打包）。

## 安装与运行（一次性步骤）

```bash
cd apps/desktop
pnpm install --ignore-workspace          # 只装本包依赖（不触碰根 workspace）
node node_modules/electron/install.js    # 放行 electron 二进制下载（pnpm 默认拦截 build 脚本）
```

```bash
pnpm start        # 默认使用最新 harness 自启独立 surface
# 连接已经运行的 127.0.0.1:3080 surface：
DSH_CONTROL_DESKTOP_USE_EXISTING=1 pnpm start
# 指定其它已有 loopback surface 时，DSH_CONTROL_DESKTOP_URL 会自动启用连接模式：
DSH_CONTROL_DESKTOP_URL=http://127.0.0.1:3080/ pnpm start
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
> 安装包自启 host 已用**内置 node**（`resources/vendor/node`，免系统 node），但 harness 仍是外部依赖
> `DSH_HARNESS_DIR`（默认 `D:\Github_Open\deepseek-harness`）。做**完全自包含**（随安装物化
> rebuild harness —— 926+ 个 pnpm 虚拟包真实实体化，体积数百 MB）是更大的发布架构项，尚待完成，
> 见 `docs/DESKTOP_CAPABILITIES_BRIDGE.zh.md`。

## 原生能力桥（main 原生微服务 + host 服务面）

Electron main 起一个 **loopback HTTP 微服务**（`startNativeService()`，127.0.0.1 高端口 + 每启动随机
bearer token + CORS），路由：`GET /dsh-native/status`、`POST /dsh-native/fonts`、`POST /dsh-native/menu`、
`POST /dsh-native/zoom`、`POST /dsh-native/relaunch`、`POST /dsh-native/fileDialog`（
`dialog.showOpenDialog`）、`POST /dsh-native/readFile`、`POST /dsh-native/notify`（`Notification`）。

**renderer 不持有 token。** 微服务的 URL/token 通过环境变量 `DSH_DESKTOP_NATIVE_URL`/`DSH_DESKTOP_NATIVE_TOKEN`
注入到 spawn 出的 DSH host 子进程（`startNativeService()` 先于 `startSelfHost()` 就绪，端口已知才能注入）。
host 侧 `DesktopService`（`packages/control-center/src/desktop.ts`）包一层 Cordis 服务
`controlCenterDesktop`，经 `desktop-remote-client.ts` + STRICT_JSON RPC 线暴露给 UI。

冒烟（dev-connect / dev-selfhost / packed-exe）均断言 `DESKTOP_MARKER=true` + `DESKTOP_MARKER_NO_TOKEN=true`
+ `NATIVE_BRIDGE=REACHED`（main 进程直接触达 Electron 原生服务）。交互弹出（真对话框/真通知）留待 live
人工验证。详见 `docs/DESKTOP_CAPABILITIES_BRIDGE.zh.md`。

> 历史：`pnpm probe:hostinmain` 验证了 host 的 app-boot trunk 在 harness resolver 下可准备 profile
> （`HOST_IN_MAIN=OK`）；因 Electron 内置 node 解析 harness workspace 裸依赖受阻，能力桥采用
> main 原生微服务桥 + host 服务面而非 host 内嵌。

## 桌面环境探测

壳加载页面后向 renderer 注入 `window.__DSH_DESKTOP__`（只含 `shell`/`host`/`version`，**无**
`nativeUrl`/`nativeToken`/`capabilities`）并派发 `dsh-desktop-ready`。web UI 据此判断 `isDesktopEnv()`，
能力真值来自 `desktop.check()` RPC 调用（web profile 下服务诚实返回 `{supported:false}` → 行显
"需要桌面版"）。浏览器标签页永看不到桌面标记，因此 web 预览与 E2E 保持诚实标注。

## 后续（P1–P5）

- 单实例锁已实现；自启 host 已实现（`--port 0` + 就绪行 URL 解析 + 复用默认 home，surface 含完整
  Control Center）；原生能力桥已握手连通，UI 侧真实接线：文件对话框/读文件（知识库）、系统通知
  （对话完成）、缩放/字体（外观页）。
- 下一步：托盘/全局快捷键 UI 化（`check()` 已上报状态）；截图 / 划词；OCR/PDF 本地模型；随能力扩充
  服务方法。
- 每阶段前：live 验证 + `pnpm run check` + 打包 E2E；Cherry 借鉴进 provenance。
