# DSH Control Center — 桌面原生能力桥（main 原生微服务）

> 目标：把 Cherry 桌面级的原生能力（文件/目录对话框、系统通知、托盘、全局快捷键、截图、OCR/PDF
> 本地模型）真实暴露给运行在 loopback 页面里的 Control Center web UI，让"桌面（已就绪）"过渡为真实接线。

## 一、方案决策（2026-08 已拍板：main 原生微服务桥）

原生能力（`dialog`、`Notification`、托盘）只存在于 **Electron main 进程**。renderer（DSH surface 页面）
是 sandbox、无 preload bridge、也不向 renderer 暴露 Electron API。

两条候选路径：
1. **host 内嵌 Electron main**（DSH Host Cordis service 方式）——经实测在当前工具链受阻：
   harness workspace 裸依赖在 Electron 内置 node 的 resolver 下 `Cannot find package`（`dsh-llm`/
   `directory-picker-native`），而 system node + tsx 能解析但那在**子进程**拿不到 Electron API。
2. **main 原生微服务桥（已采用）**——Electron main 起一个 **loopback HTTP 微服务**（绑定 127.0.0.1
   高端口 + 每启动随机 bearer token），renderer 用 token 鉴权的同机 `fetch` 调它，main 内直接调
   `electron.dialog`/`Notification`。**不引入 preload bridge**（仍是 HTTP），可立即验证。

## 二、已实现（2026-08）

架构：

```
Electron main (apps/desktop/bin/main.mjs)
  └─ startNativeService() → 127.0.0.1:<random> HTTP micro-service (bearer token + CORS)
       ├─ GET  /dsh-native/status       → { ok, shell, electron, node }
       ├─ POST /dsh-native/fileDialog   → electron.dialog.showOpenDialog → { canceled, filePaths }
       ├─ POST /dsh-native/notify       → new Notification(...).show() → { ok, supported }
       └─ token 校验(非 OPTIONS) + CORS 头(预检先于鉴权放行)
                  │
renderer (DSH surface 页面)
  └─ window.__DSH_DESKTOP__ = { shell, host, version, capabilities:['window','fileDialog','notification'],
                               nativeUrl, nativeToken }
       └─ desktopNativeApi(packages/control-center/src/client/desktop-capabilities.ts):
            status() / pickFile() / notify() 均为带 Bearer 的 fetch 封装
```

端到端已验证（三种冒烟 dev-connect / dev-selfhost / packed exe 均输出 `NATIVE_BRIDGE=REACHED`）：

- `native service listening on 127.0.0.1:<port>`（Electron main 起服务）
- `DESKTOP_MARKER=true`（注入 nativeUrl/nativeToken + capabilities 扩充）
- renderer 用 token `fetch(/dsh-native/status)` → `{ ok, shell: true, electron }` → `NATIVE_BRIDGE=REACHED`

## 三、分阶段实施

| 阶段 | 能力 | 状态 |
|---|---|---|
| B0 | main 原生微服务桥（status + token + CORS） | **已完成**：三种冒烟握手 REACHED |
| B1 | 文件对话框真实接线 | 路由就绪（`dialog.showOpenDialog`）；交互弹出待 live 人工验证 + 知识库接入 |
| B2 | 系统通知真实接线 | 路由就绪（`Notification`）；通知设置页接入待接 |
| B3 | 托盘 + 全局快捷键 | 微服务加路由 + 托盘/快捷键注册 |
| B4 | 截图 / 划词；OCR/PDF 本地模型 | 后续 |

每个能力上线前：live 验证 + `pnpm run check` + 打包 E2E；沿用"无 preload bridge、UI 诚实标注
（`capabilities` 列表只列真实接线的能力，`desktopNativeApi` 只有在 bridge up 且带 token 时才可用）"。

## 四、风险与边界

- **安全**：微服务 token 每次启动随机、只监听 127.0.0.1、CORS 预检先放行但真实请求必须带 `Bearer`；
  `capabilities` 只列真实接线的能力，绝不静默假装。
- **交互无法无头断言**：`dialog.showOpenDialog` 会弹 GUI 阻塞、`Notification` 无头不弹，因此 B1/B2 的
  "真弹出"验证放在 live 人工 / 后续交互 E2E；自动化冒烟覆盖到 **握手 REACHED**（renderer 真实触达
  Electron main 服务）。
- **打包**：`packed exe` 冒烟同样 REACHED，证明打包产物内的微服务与握手可用。

## 六、发行状态与物化瓶颈（2026-08）

- **正式安装器已交付**：`pnpm pack:win` 产出 `release/DSH Control Center Setup 0.1.0.exe`（NSIS，93MB，
  用户级安装），静默安装 → exe `--e2e`（surface + 桥 + 托盘 + 全局快捷键）→ 卸载器彻底移除，全程验证。
- **内置 node 已落地**：`vendor/node`（node 24，ABI 与 harness 匹配）经 `extraResources` 打进
  `resources/vendor/node`；`startSelfHost` 优先用内置 node —— **自启免系统 node**（dev + packed 均验证）。
- **完全自包含（免 `DSH_HARNESS_DIR`）受阻 — harness 物化**：首次物化器
  `apps/desktop/scripts/materialize-harness.mjs`（`fs.cpSync dereference:true`）在 harness 的**循环
  pnpm-store 符号链接**（如 `cordis ↔ cordis-plugin-include`）上实测 **ELOOP** 失败。正确物化需要
  **循环感知物化器**（参照 `deepseek-harness-desktop/scripts/materialize3.js`），且整树物化体积数百 MB。
  这是后续发布架构项（需专门的物化器实现/复用，并评估体积），当前以"内置 node + 复用本机 harness"
  形态为可用发行基线。

- `probe:hostinmain`（B0 门禁）已验证 host 的 app-boot trunk 可在 harness resolver 下**准备 profile**
  （`HOST_IN_MAIN=OK`），并验证 host 可在当前进程真·boot loopback surface（编译版
  `profile-boot-BnJoK_kl.js` + cwd=harness）。这些是能力桥候选路径 1 的证据；因 Electron-resolver 障碍，
  已转用 main 原生微服务桥（本方案）。
