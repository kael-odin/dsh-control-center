# DSH Control Center × Cherry Studio — 项目路线图（ROADMAP）

> 状态：规划文档 · 生成于 2026-08-21
> 配套清单：[`CHERRY_PARITY.md`](../CHERRY_PARITY.md)（根目录，逐节对标落地清单，含 61 供应商全表）
> 本文回答一个问题：**桌面桥已落地的前提下，接下来做什么、按什么顺序做、怎么算做完。**

---

## 1. 方向判断：为什么主线不是继续刷 1.md 的能力表

`1.md`（桌面能力桥）解决的是"桌面能力怎么接进 DSH"，分两层：

- **架构层**：桌面能力做成 DSH Cordis 服务。**正确，且已完成**（commit `c2a0af6`）：
  - `controlCenterDesktop` 服务上线，桥 URL/Token 走 host 环境变量，**token 已从渲染进程剥离**
  - 文件对话框 / 通知 / 字体 / 缩放 / relaunch 真实接线；tray / 热键状态可查
  - `smoke:desktop` 与 `smoke:desktop:selfhost` 双模式通过（`DESKTOP_MARKER_NO_TOKEN` 已断言）
- **能力清单层**：1.md 的 P2–P5（tray 交互、截图、划词、OCR/PDF、本地模型、频道、TUN）。**这是加分项，不是当前主线。**

用户的实际痛点在**功能对标**——模型服务与各设置页 vs Cherry，属于"使用层"。

> **结论：架构方向照旧；优先级主线从"桌面能力补齐"切换到"Cherry 功能对标"。**
> 1.md 的 P2–P5 降级为 Tier 2 支线，等使用层稳定再逐个做。

---

## 2. 铁律（每一节都必须遵守）

1. **禁止 mock、假数据、静默 no-op、伪造能力。**
2. **每个控件要么接真实 DSH host 能力，要么诚实标"当前平台不支持"**（不允许假开关/假按钮）。
3. **用户 profile 数据不留测试探针残留**（测试后清理）。
4. **每完成一节：`pnpm run check` + `pnpm run test:browser`**（涉及桌面再加 smoke），**一节一 commit**，message 注明对齐的 Cherry section。
5. **`deepseek-harness` 与 `cherry-studio` 保持官方源、零修改**；本地 cherry-studio 是唯一视觉/行为参照。

---

## 3. 优先级分层

| 层 | 内容 | 对照清单 |
|----|------|---------|
| **P0**（门户，现在修） | 模型服务 + 模型选择：两栏化布局 + 内置供应商目录真实接线 + first-run 空态 | `CHERRY_PARITY.md` §2 |
| **Tier 1**（核心链路） | MCP / 技能 / 联网搜索 / 文件处理·OCR / 通用 / 外观 / 通知 / 数据管理 / 用量 | §3 |
| **Tier 2**（自动化·桌面增强） | 频道 / 定时任务 / 快捷键 / 快捷助手 / 划词助手 / 截图 / 依赖 / 关于 / 更新 | §4 |

**P0 为什么排第一**：供应商 → 模型是 AI 客户端的门户。当前全新 profile 下模型服务页是空列表、加号按钮禁用——用户连第一个模型都配不上，其余都是白搭。

---

## 4. 对标方法（每一节固定四步）

1. **取参照**：用本地 cherry-studio 当唯一视觉/行为参考，把该节每个控件的状态和操作路径录下来（`CHERRY_PARITY.md` 各节已列出 Cherry 参照文件路径）。
2. **能力映射**：每个控件 → 一个真实 DSH host 能力。没有现成能力的，要么按 1.md 的方式做成 DSH 服务（Cordis service + remote-client + STRICT_JSON），要么诚实标"当前平台不支持"。
3. **实现 + 单元测试 + 浏览器 E2E**（涉及桌面再加 smoke）。
4. **一节一 commit**，commit message 注明对齐了 Cherry 的哪个 section。

**完成标准**：不是像素级一样，而是"**同样的操作路径、真实生效**"——像素其次，能力真实是底线。

---

## 5. P0 开工说明（模型服务——含两个 bug 的根因与文件地图）

### 5.1 根因（已读源码确认）

**Bug A「没有现成的内置供应商」**
- 模型服务页的行全部来自 `store.ts:140` 的 `api.llm.providers({})` —— **host 的 LLM 适配器目录**（[store.ts:140](../packages/control-center/src/client/store.ts:140)）。
- `provider-presets.ts` 的 61 个预设（Cherry 目录全量）**从未被 `ctx.llm.registerAdapter()` 注册进 host**（全仓 grep `registerAdapter` 0 命中）。全新 profile 下目录为空。
- 连锁反应：`configured`/`addable` 为空 → 加号按钮被禁用（[ModelsSection.tsx:466](../packages/control-center/src/client/ModelsSection.tsx:466)）→ 页面空列表、两个按钮全灰。

**Bug B「点击其它供应商无法切换配置面板」**
- 表层：add-flow 卡片只在 `addNamespace`（`state.namespaces.get(settingsNs)`）能解析时渲染（[ModelsSection.tsx:403](../packages/control-center/src/client/ModelsSection.tsx:403)）；选中供应商的命名空间没挂载时卡片直接消失。
- 深层：当前 UI 没有 Cherry 的**左栏供应商目录**，只有"已配置行 + 下拉"，"左点右切"的操作路径在结构上不存在。

### 5.2 目标（对齐 Cherry）

复刻 Cherry `ProviderSettingsPage.tsx` 的两栏布局：
```
┌──────────────────────┬──────────────────────────────────────┐
│ ProviderList（左栏）   │ ProviderSetting（右栏，随选择切换）    │
│  · 分组：国内/国际/本地  │  · ProviderHeader：名称/官网/启用/API 选项 │
│  · 搜索               │  · AuthenticationSection：密钥/连接/拉取  │
│  · 添加自定义          │  · ModelList：模型列表/启用/添加/默认     │
│  · 右键：删除          │                                        │
└──────────────────────┴──────────────────────────────────────┘
```

### 5.3 子任务拆解（建议顺序）

| # | 子任务 | 关键点 | 参照 |
|---|--------|--------|------|
| A | **目录接线** | 用 `ctx.llm.registerAdapter()` 把 61 个预设注册为真实 adapter（OpenAI 兼容为主，特殊 type 单独处理：`deepseek`/`anthropic`/`google`/`azure`/`ollama`）；凭据走 DSH credentials；`llm.providers()` 真实返回目录 | `packages/control-center/src/translation.ts` 现有 adapter 注册模式 |
| B | **左栏 ProviderList** | 分组渲染、搜索、添加自定义、右键删除、启用态 | Cherry `ProviderList/` |
| C | **右栏 ProviderSetting** | Header（名称/官网链接/启用开关/API 选项抽屉）+ 认证区（API key、连接测试、模型拉取引导）+ 模型列表 | Cherry `ProviderSetting.tsx`、`ConnectionSettings/`、`ModelList/` |
| D | **模型选择页 ModelSettings** | 默认 / 快捷 / 翻译 / 绘画 四个模型选择器 + 重试设置（开关、次数、退避、兜底模型） | Cherry `ModelSettings/ModelSettings.tsx` |
| E | **first-run 空态** | 无任何配置时给出引导（对齐 Cherry onboarding / 空态），不再是空列表 | Cherry `ProviderSettings`（isOnboarding） |

### 5.4 文件地图

- 控制侧（改）：[store.ts](../packages/control-center/src/client/store.ts)、[ModelsSection.tsx](../packages/control-center/src/client/ModelsSection.tsx)、[ModelSelectionPanel.tsx](../packages/control-center/src/client/ModelSelectionPanel.tsx)、[ProviderEditor.tsx](../packages/control-center/src/client/ProviderEditor.tsx)、[provider-presets.ts](../packages/control-center/src/client/provider-presets.ts)
- 控制侧（增）：host 侧 adapter 注册模块（`ctx.llm.registerAdapter`）、两栏布局组件
- 参照（只读）：`D:\Github_Open\cherry-studio\src\renderer\pages\settings\ProviderSettings\`、`...\ModelSettings\`

---

## 6. 执行节奏

- **一节一个对话窗口**，一个窗口不要同时铺多个 section（深度优先，不做广度补丁）。
- 新窗口开工前：读本文件 §5（P0）或 `CHERRY_PARITY.md` 对应节，把该节的"待办"逐行划掉。
- 每节完成后：回写 `CHERRY_PARITY.md` 的"现状"列（✅ / 部分 / 未做）。

---

## 7. 验证门（每节交付前）

| 门 | 命令 | 断言 |
|----|------|------|
| 静态+测试 | `pnpm run check` | typecheck / vitest / lint / build / provenance / artifacts / secrets 全绿 |
| 浏览器 | `pnpm run test:browser` | web profile 下 UI 挂载、能力诚实显示 |
| 桌面（如涉及） | `pnpm run smoke:desktop` + `smoke:desktop:selfhost` | marker / 桥 / tray / hotkey 全断言 |

---

## 8. 与 CHERRY_PARITY.md 的关系

`ROADMAP.zh.md` 是"为什么、按什么顺序、怎么算做完"；`CHERRY_PARITY.md` 是"每一节到底有哪些控件、现状如何、待办和完成标准逐行列"。
**执行以 `CHERRY_PARITY.md` 为准，`ROADMAP` 只定序。**
