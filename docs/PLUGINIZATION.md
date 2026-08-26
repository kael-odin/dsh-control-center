# 🔌 插件化章程：独立插件 × 新旧版 DSH 兼容 × 一键更新 × 桌面打包

> 立项文档（2026-08-26）。对应总目标：「以后能兼容旧版 dsh，并且能适应新版 dsh，
> 作为独立的插件，能支持设置内检查定位 dsh 并支持一键更新，能够打包成桌面级应用」。
> 本文档盘点每块的**真实现状**（很多能力已存在而未被记账），并给出剩余工作的落地方案。

## 现状盘点（2026-08-26 逐项核查）

| 目标 | 现状 | 证据 | 缺口 |
|---|---|---|---|
| 独立插件 | ✅ 已是 | `@dsh-control-center/control-center` npm 包（host 服务 + client bundle 双面），经 cordis.patch.yml 挂载进宿主组合 | 无 |
| 设置内定位 DSH | ✅ 基本具备 | About 页：dshHome / nodeVersion / platform / 契约包解析版本列表（system.ts getInfo + listDependencies）；兼容性校验（compatibility.ts + invariants，不匹配拒激活） | 无结构性缺口 |
| 兼容旧版 DSH | ⚠️ 部分 | 契约版本检查已做「防不兼容」（硬失败）；但 peerDependencies 钉死 `0.1.1-rc.2`，无运行时多版本适配层 | 见 §1 |
| 适应新版 DSH | ⚠️ 部分 | 同上：新 rc 出现即需重新发版 | 见 §1 |
| 一键更新 | ⚠️ 检查已通，安装缺失 | UpdateService.checkForUpdates（GitHub releases 轮询）+ releaseUrl 外链 + 发布说明内嵌页 | 见 §2 |
| 打包桌面应用 | ✅ 已具备 | `apps/desktop` Electron 壳（electron-builder，pack:dir / pack:win nsis，vendor node 内置，smoke e2e 三套） | 发布流水线自动化（可选） |

## §1 新旧版兼容层

**原则**：不做全量 shim——那会腐化。只做「契约探测 + 优雅降级 + 明确告知」。

1. **能力探测表**（capability probe）：启动时对每个依赖的 host 面（apiProxy.sessions /
   settings scope update / storage-domain / typert remote）做一次存在性 + 行为探测，
   结果挂 `ctx.controlCenterCompat`。调用方读探测结果而非裸 try/catch 散布各处。
   - 已有的诚实降级先例：频道桥 `apiProxy` 不存在→裸 LLM 回退；settings 不存在→浏览器本地持久化。
2. **peerDependencies 放宽为区间**：`"0.1.1-rc.2 || 0.1.x"`（pnpm 允许），配合 invariant
   校验实际解析版本在受支持集合内。受支持集合随每次适配新版而扩充。
3. **版本协商日志**：About 页诊断包加入逐能力探测结果，用户报障时一眼可见哪条契约断了。

## §2 一键更新（下载安装闭环）

分两阶段，先 Web 可用、再桌面原生：

**阶段 A —— 引导式半自动（Web + 桌面通用，低成本）**
1. UpdateService 增加 `downloadRelease(asset)`：从 GitHub release 拉 bundle tarball
   （`.packs` 产物），校验大小/来源后存入 DSH storage-domain。
2. About 更新卡出现「下载并安装更新」按钮 → 下载完成后弹确认 →
   调 DSH 插件管理接口（若宿主提供 plugin install RPC；否则引导 `dsh plugin install <path>`）。
3. 安装完成提示重启宿主。

**阶段 B —— 桌面壳全自动（apps/desktop 独占）**
1. 壳内 main 进程直接执行：检测自身安装目录 → 下载新版 npm 包/tarball →
   替换 vendor 目录 → `app.relaunch()`。
2. 更新通道设置（stable/pre-release）进 control-center-general。

## §3 桌面发布流水线（可选打磨）

- GitHub Actions：tag push → `pnpm run check` → electron-builder win/mac 产物 →
  附到 GitHub Release（供 §2 的更新源消费）。
- 当前手动 `pnpm --dir apps/desktop pack:win` 即可出 NSIS 安装器。

## 实施顺序

1. ~~§1.1 能力探测表~~ ✅ 2026-08-26（`controlCenterCompat.probe()`，结果随诊断包导出）
2. §2.A 引导式更新 —— **下载半已落地（2026-08-26）**：`UpdateService.prepareUpdate()` 拉 latest release 的 `.tgz` asset（仅接受 control-center 命名，64MB 上限），base64 存入 storage-domain `control_center_update_bundles`；更新页有「下载更新包」按钮与状态反馈。**剩余：安装步骤自动化**（调宿主 plugin install RPC 或桌面壳直接替换 vendor 目录）
3. ~~§3 发布流水线~~ ✅ 已存在（`.github/workflows/release.yml`：tag push → pnpm check → pack bundle tgz → draft GitHub release；asset 命名与 §2.A 的 pickBundleAsset 匹配）
4. §2.B 全自动更新（大；产物源已就绪）
5. ~~§1.2/1.3 版本区间放宽~~ ✅ 2026-08-26（compatibility.ts 支持 0.1.x 窗口 `/^0\.1\.\d+/`，peerDependencies/dependencies 放宽为 `>=0.1.1-rc.2 <0.2.0-0`；跨 minor 仍需显式适配评审后扩窗）
