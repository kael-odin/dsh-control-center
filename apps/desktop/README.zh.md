# DSH Control Center — Desktop Shell (P0)

Electron 桌面壳，把运行中的 DSH loopback Web surface 装进原生窗口，并挂载 `@dsh-control-center/bundle`
的 Control Center 表面。P0 只做 **薄窗口 + surface 加载 + 诚实冒烟**；原生能力桥（文件对话框、通知、
全局快捷键、托盘、OCR/PDF 本地模型、频道推送）按 `docs/DESKTOP_PLAN.zh.md` 的 P1–P5 逐步接入。

## 结构

```
apps/desktop/
  bin/main.mjs        Electron main：单实例锁 → 探测 surface → 加载 BrowserWindow
  tests/smoke.mjs     P0 冒烟：以 --e2e 启动壳，断言 surface 加载 + Control Center 挂载
  package.json        独立包（electron devDep）
```

## 为什么独立于根 workspace

根 `pnpm-workspace.yaml` 只含 `packages/*`；`apps/desktop` 作为**独立目录**（不进根 workspace），
因此 electron 的二进制下载与构建不会混入根 `pnpm run check` 的构建/安装链路。根
`tsconfig`/`oxlint` 不引用 `apps/`，P0 不触碰根 check 任何环节。

## 运行前提

- 一个 DSH Web surface 正在监听，默认 `http://127.0.0.1:3080/`（即 `dsh web`）。
- 或设置 `DSH_CONTROL_DESKTOP_URL` 指向其它 loopback surface。
- 壳会先探测：已监听则直接加载；未监听时最佳尝试从 `DSH_HARNESS_DIR` 指定的 harness
  拉起 host，失败则弹出诚实错误（不假装联网能力存在）。

## 安装与运行（一次性步骤）

```bash
cd apps/desktop
pnpm install --ignore-workspace          # 只装本包依赖（不触碰根 workspace）
node node_modules/electron/install.js    # 放行 electron 二进制下载（pnpm 默认拦截 build 脚本）
```

```bash
pnpm start        # 打开桌面窗口，连接 127.0.0.1:3080 surface
```

## 冒烟测试

```bash
cd apps/desktop
pnpm smoke        # 需要 3080 surface 在线；electron --e2e 断言 SURFACE_LOADED + CONTROL_CENTER_ATTACHED
```

P0 冒烟结果示例：

```
[desktop] surface already listening at http://127.0.0.1:3080/
[desktop] SURFACE_LOADED
[desktop] CONTROL_CENTER_ATTACHED=true
smoke PASS
```

## 后续（P1–P5）

- 单实例锁已实现；原生能力桥经 Host Cordis service 暴露（非 `window.api.*`）。
- 每阶段前：live 验证 + `pnpm run check` + 打包 E2E；Cherry 借鉴进 provenance。
