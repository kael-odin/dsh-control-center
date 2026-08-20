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

## 后续（P1–P5）

- 单实例锁已实现；自启 host 已实现（`--port 0` + 就绪行 URL 解析 + 复用默认 home，surface 含完整
  Control Center）。
- 下一步：接原生能力桥（文件对话框、系统通知等，经 Host Cordis service 暴露，UI 侧按能力探测启用），
  并随应用内置 node + 打包发行。
- 每阶段前：live 验证 + `pnpm run check` + 打包 E2E；Cherry 借鉴进 provenance。
