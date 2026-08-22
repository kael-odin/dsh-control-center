# DSH Control Center — 桌面原生能力桥（main 原生微服务 + host 服务面）

> 目标：把 Cherry 桌面级的原生能力（文件/目录对话框、系统通知、托盘、全局快捷键、缩放、字体）真实暴露给
> Control Center web UI，让"桌面（已就绪）"过渡为真实接线 —— 并且**不把原生 token 放进 renderer**。

## 一、方案决策（2026-08 已拍板：main 原生微服务桥 + host `controlCenterDesktop` 服务面）

原生能力（`dialog`、`Notification`、托盘）只存在于 **Electron main 进程**。renderer（DSH surface 页面）
是 sandbox、无 preload bridge、也不向 renderer 暴露 Electron API。

两条候选路径：
1. **host 内嵌 Electron main**（DSH Host Cordis service 方式）——经实测在当前工具链受阻：
   harness workspace 裸依赖在 Electron 内置 node 的 resolver 下 `Cannot find package`（`dsh-llm`/
   `directory-picker-native`），而 system node + tsx 能解析但那在**子进程**拿不到 Electron API。
2. **main 原生微服务桥 + host 服务面（已采用）**——Electron main 起一个 **loopback HTTP 微服务**（绑定
   127.0.0.1 高端口 + 每启动随机 bearer token）；DSH host（被 Electron main spawn 的子进程）通过环境变量
   `DSH_DESKTOP_NATIVE_URL`/`DSH_DESKTOP_NATIVE_TOKEN` 持有访问权，包一层 Cordis 服务
   `controlCenterDesktop`，经既有的 `desktop-remote-client.ts` + STRICT_JSON RPC 线暴露给同一套
   Control Center UI。**renderer 不持有任何 token**（标记只含 `{ shell, host, version }`）。

## 二、已实现（2026-08）

架构：

```
Electron main (apps/desktop/bin/main.mjs)
  ├─ startNativeService() → 127.0.0.1:<random> HTTP micro-service (bearer token + CORS)
  │     GET  /dsh-native/status      → { ok, shell, electron, node, trayActive, hotkey, hotkeyRegistered }
  │     POST /dsh-native/fonts       → { ok, fonts[] }
  │     POST /dsh-native/menu        → { ok, action }
  │     POST /dsh-native/zoom        → { ok, zoom } (delta / reset)
  │     POST /dsh-native/relaunch    → { ok }
  │     POST /dsh-native/fileDialog  → { canceled, filePaths }
  │     POST /dsh-native/readFile    → { name, contentBase64, mediaType }
  │     POST /dsh-native/notify      → { ok, supported }
  └─ startSelfHost(native)  → 子进程 env 注入 DSH_DESKTOP_NATIVE_URL / DSH_DESKTOP_NATIVE_TOKEN
            │  (startNativeService 先于 startSelfHost 就绪，端口已知才能注入)
            ▼
DSH host (control-center bundle)
  └─ DesktopService (packages/control-center/src/desktop.ts, 服务名 controlCenterDesktop)
       ├─ 构造时读 env；bridgeFetch<T>(path, init) 私有代理 → 带 Bearer 的同机 fetch
       ├─ check()/fonts()/menu()/adjustZoom()/relaunch()/pickFile()/readFile()/notify()
       └─ bindTypertRemote(this, 'controlCenterDesktop') → desktop-remote-client.ts descriptors
            │
            ▼
renderer (DSH surface 页面)
  ├─ window.__DSH_DESKTOP__ = { shell: true, host, version }   ← 无 nativeUrl / nativeToken / capabilities
  ├─ remote.controlCenterDesktop（RPC 线）→ AppearanceSection / KnowledgeWorkspace / notification-runtime
  └─ desktop.check() 是能力真值来源；web profile 下服务诚实返回 { supported:false } → 行显"需要桌面版"
```

端到端已验证（三种冒烟 dev-connect / dev-selfhost / packed exe 均输出 `NATIVE_BRIDGE=REACHED`）：

- `native service listening on 127.0.0.1:<port>`（Electron main 起服务）
- `DESKTOP_MARKER=true` + `DESKTOP_MARKER_NO_TOKEN=true`（标记只含 shell 身份，renderer 无 token）
- main 进程直接 `fetch(/dsh-native/status)`（带 token）→ `NATIVE_BRIDGE=REACHED`；host 侧
  `desktop.check()` → `{ supported:true, electron }`，web profile（无 env）→ `{ supported:false }`。

## 三、分阶段实施

| 阶段 | 能力 | 状态 |
|---|---|---|
| B0 | main 原生微服务桥（status + token + CORS）+ host 服务面 + 能力探测 | **已完成**：三种冒烟握手 REACHED，renderer 无 token |
| B1 | 文件对话框真实接线 | **已完成**：`desktop.pickFile`/`readFile` → 知识库"添加文件"走原生对话框，失败回退 file input |
| B2 | 系统通知真实接线 | **已完成**：`desktop.notify` → Electron Notification；对话完成通知 runtime 消费 |
| B3 | 托盘 + 全局快捷键 | 微服务路由 + 托盘/快捷键注册（status 上报，`check()` 可见） |
| B4 | 缩放 / 字体 / 菜单 / 重启 | **已完成**：`desktop.adjustZoom`/`fonts`/`menu`/`relaunch` → 外观页缩放持久化、字体列表、应用菜单 |
| B5 | 截图 / 划词；OCR/PDF 本地模型 | 后续 |

每个能力上线前：live 验证 + `pnpm run check` + 打包 E2E；UI 诚实标注（`desktop.check()` 只报真实接线的
能力；bridge 缺席时 `{supported:false}`，绝不静默假装）。

## 四、风险与边界

- **安全**：微服务 token 每次启动随机、只监听 127.0.0.1、CORS 预检先放行但真实请求必须带 `Bearer`；
  **token 只在 Electron main 与 host 子进程之间流转**（env 注入），renderer 拿不到 `readFile` 可达的凭证。
- **交互无法无头断言**：`dialog.showOpenDialog` 会弹 GUI 阻塞、`Notification` 无头不弹，因此 B1/B2 的
  "真弹出"验证放在 live 人工 / 后续交互 E2E；自动化冒烟覆盖到 **握手 REACHED**（main 进程真实触达
  Electron 服务）。
- **打包**：`packed exe` 冒烟同样 REACHED，证明打包产物内的微服务与握手可用。

## 六、发行状态与物化瓶颈（2026-08）

- **正式安装器已交付**：`pnpm pack:win` 产出 `release/DSH Control Center Setup 0.1.0.exe`（NSIS，93MB，
  用户级安装），静默安装 → exe `--e2e`（surface + 桥 + 托盘 + 全局快捷键）→ 卸载器彻底移除，全程验证。
- **内置 node 已落地**：`vendor/node`（node 24，ABI 与 harness 匹配）经 `extraResources` 打进
  `resources/vendor/node`；`startSelfHost` 优先用内置 node —— **自启免系统 node**（dev + packed 均验证）。
- **完全自包含（免 `DSH_HARNESS_DIR`）— harness 物化**：
  - v1（`fs.cpSync dereference:true`）在 harness 循环 pnpm-store 符号链接（`cordis ↔
    cordis-plugin-include`）上实测 **ELOOP**。
  - **v3（保留 pnpm 语义的物化器，`scripts/materialize-harness.mjs`）已实现**：非 node_modules 内容复制为真实
    文件；每个 `.pnpm/<pkg>@<ver>/node_modules/` 保留本体 + 直接依赖 relink（物化树内 junction）。三 pass
    全部跑通、无 ELOOP、无 JS 错（`probe:materialize` 断言无 dangling）。
  - **现实瓶颈**：全树物化极慢（>20min；926 虚拟包本体 + ~8k junction 创建）且体积数百 MB——当作发布期
    一次性长作业，非开发循环内快速步骤。**完整自包含启动验证 + 打包含 ~1GB 安装包**是后续发布流程项。
  - 当前可用发行基线：**内置 node + 复用本机 harness**（正式 NSIS 安装器已交付）。
  - **剩余**：全量物化、`DSH_HARNESS_DIR` 指向物化树 + 打包含 1GB 安装包 + 自包含安装验证。这是后续
    发布架构项（需大体积打包策略），当前以"内置 node + 复用本机 harness"为可用发行基线。
  - **v4 实测（2026-08）**：去掉 copyTree 每目录 realpathSync、`norm` 改 resolve 后，pass1/pass2 显著提速
    （~600s 内完成），junction relink 已验证指向物化树内（如 `.pnpm/tsx@4.22.4/node_modules/esbuild ->
    .materialized/.../esbuild@0.28.1/...`）；但**完整物化仍 >40min**（pass3 顶层 `@deepseek-ai/*` workspace
    junction/复制是残存瓶颈）。**结论**：这是发布期一次性长作业（真实数据量大），不以开发循环内加速为
    目标；当前基线 = 内置 node + 复用本机 harness。
  - **v5 事故 + v6（2026-08）**：尝试把顶层 `@deepseek-ai/*` workspace 链接 re-link 到物化 `packages/`
    时触发 **junction 自环/无限嵌套**（materialized packages 源码被误引回顶层，Windows 磁盘污染）。已
    回滚：物化器现在**安全跳过顶层 `@deepseek-ai`**（仅物化 `.pnpm` 依赖语义），并新增
    `scripts/clean-tree.mjs`（junction-aware 删除，用于清理此类污染）。
  - **v6.7/v6.8（2026-08）**：物化器重构成可复用的 `materializeNM`（共享 `realToMat`），枚举 harness 根
    **所有层** node_modules（顶层 + apps/packages/vendor 嵌套）物化（commander 等嵌套依赖可解析）；
    顶层 `@deepseek-ai/*` 用 `relative(src,t)` 映射到 out 对应位置（如 dsh-base→packages/bundle/base、
    cordis→vendor/cordis）——**自包含启动中 `@deepseek-ai/dsh-base` 已成功解析**（此前 cannot resolve）。
    全树物化 **~168s 无环完成**（17274 目录/135098 文件/2236 链接），主要跳过仅限源码自带 node_modules 的包。
  - **裁定（2026-08-20）：以可用基线验收**。物化机制已充分验证（无环/快速/顶层 workspace 全 link/dsh-base
    解析通过），但**自包含 boot 的依赖闭包是逐层迭代的发布级工程**（当前到 `vendor/hmr` chokidar→readdirp，
    每修一层需 ~168s 物化+验证，属持续维护的物化器/trim 工作，类比社区 materialize3.js）。**完整自包含
    （免 `DSH_HARNESS_DIR`）记录为发布 SOP/继续项**；当前桌面 app 交付以 **内置 node + 复用本机 harness**
    的正式 NSIS 安装器（93MB，安装/卸载验证全绿）为基线。

- `probe:hostinmain`（B0 门禁）已验证 host 的 app-boot trunk 可在 harness resolver 下**准备 profile**
  （`HOST_IN_MAIN=OK`），并验证 host 可在当前进程真·boot loopback surface（编译版
  `profile-boot-BnJoK_kl.js` + cwd=harness）。这些是能力桥候选路径 1 的证据；因 Electron-resolver 障碍，
  已转用 main 原生微服务桥（本方案）。
