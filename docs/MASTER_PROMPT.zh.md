# DSH Control Center — Master Prompt（持续打磨与 100% 复刻总纲）

> 用法：把本文件内容作为提示词交给 Claude Code，即可在任何新会话中无缝接管本项目。
> 仓库：`D:\Github_Open\dsh-control-center`（repo=kael-odin/dsh-control-center，main 分支）

---

## 一、项目定位（一句话）

把 **Cherry Studio**（`D:\Github_Open\cherry-studio`，本地源码即权威对照物）**纳米级 100% 复刻**为 DSH（deepseek-harness）生态里的一个 **web 插件**（可安装/可卸载），最终再演进为**桌面版 App**。

## 二、核心原则（不可妥协）

1. **逐像素对照 Cherry 源码**：每个界面元素都以 `D:\Github_Open\cherry-studio\src\renderer\pages\*` 为蓝本，先读 Cherry 源码再动手，图标、间距、字号、文案（zh-CN）、交互全部对齐；不要凭记忆或猜测设计。
2. **诚实 UI**：做不了的功能明确标注"未配置/不使用/暂不支持"，绝不静默假装；所有数据走真实实现（SQLite、真实 API、真实 token 记录），零 mock。
3. **每个改动必须 live 验证**：改完 `pnpm run build` → 重启 3080 服务 → playwright 打开 `http://127.0.0.1:3080/` 逐项验证 → 提交前跑 `pnpm run check`（typecheck+49 单测+lint+provenance+artifacts+secrets）与 `pnpm run test:browser`（打包 E2E）。
4. **及时提交推送**：每个完整功能一个 commit，推 GitHub；同时更新记忆文件 `C:\Users\user\.claude\projects\D--Github-Open\memory\dsh-control-center-spec-progress.md`。
5. **借用 Cherry 资产需进 provenance**：vendor 拷贝（模板图/上传图标/提示词）登记在 `provenance/cherry-source-inventory.json`。

## 三、环境与命令（Windows）

- 检查链：`pnpm run check`；打包浏览器 E2E：`pnpm run test:browser`（需先 `pnpm exec playwright install chromium-headless-shell`）
- 预览：`http://127.0.0.1:3080/`（`deepseek-harness` 下 `pnpm dsh web`；改 host 代码后必须重建+重启才生效；served client.js 与本地 build sha1 必须一致）
- 结构：`packages/control-center/src/`（host 服务）与 `.../client/`（UI）；`packages/bundle/`（安装包）；wire 三层：`*-types.ts`（类型图）+ `*-remote-client.ts`（**客户端描述符才是代理方法面的真相**）+ host 服务 `markRemoteMethods`
- 真实模型测试 key：DeepSeek `https://api.deepseek.com/v1`（OpenAI 兼容）/ `https://api.deepseek.com/anthropic`，模型 `deepseek-v4-flash`

## 四、已完成（当前基线 HEAD 9538467）

- **翻译工作区**：Cherry 全页布局（语言 Combobox 带搜索/emoji、交换钮、emerald 翻译按钮、ModelSelector 带服务商头像分组+配置自定义模型跳转、历史/设置浮动面板、拖入或点击上传 6 格式图标、Cherry 内置提示词模板 {{text}}/{{target_language}}、自动检测 自动/算法/LLM 三模式真实生效、HelpTooltip 问号）
- **绘画工作区**：68px 会话轨道、25 个 Cherry 模板轮盘（固定尺寸确定性布局+像素间距层叠）、参数弹层（背景/生成数量/质量/尺寸 chips，portal 视口自适应）、+号快捷面板（上传附件/提示词管理/管理对话框）、Artboard 工具栏、生成骨架屏
- **知识库工作区**：250px 导航（新建/重命名/删除）、两行 header（标题+召回测试+齿轮 / 更新于 X 前+添加数据源）、空态四卡片（文件/笔记/目录/链接）、数据源表格（类型彩色图标/状态徽章/行菜单）、召回测试抽屉、设置抽屉（文档处理/嵌入模型可编辑/重排模型/TopK/高级设置折叠：智能分段+分隔符+分段大小 1024+重叠 200+提示）、添加后自动索引（幂等）
- **设置**：Cherry 外壳（250px 导航分组+lucide 图标）、API 提供商（56 预设+搜索创建）、用量统计（真实 token 记录+指标条+热力图+分布图+请求表）、MCP/Skills/网络搜索/文档处理/OCR/通用/数据/计划任务/系统/本地模型/更新
- **代码仓库工作区已按用户要求整体移除**

## 五、待办（按用户明确顺序）

1. **设置页剩余纳米级复刻**：逐个 section 对照 Cherry 检查（外观/通知/快捷键/快捷助手/划词助手/截图/频道 Channels 等），图标、开关、文案、分组全部对齐
2. **桌面版 App**（最终形态）：web 插件天花板在 OCR/PDF 解析（Cherry 用本地 BabelDOC/OCR 引擎）、系统级文件/目录对话框、托盘/通知/全局快捷键、本地模型托管、代理 TUN、系统通知——拉取 `https://github.com/anywhere-labs/deepseek-harness-desktop` 或借鉴 Cherry electron 壳，把 DSH host+本插件作为核心加载
3. **持续优化**：Provider-specific fetchers、Model Registry 富化、模板按模型过滤、成本价格表扩充

## 六、用户交互偏好（教训沉淀）

- 用户会**逐像素核对**，任何"没对齐 Cherry"的细节都会被点名；先读 Cherry 源码再动手
- 改 UI 后必须重启服务并确认 served 版本一致，否则用户看到旧版会误判为没改
- 大段代码替换优先用 Write/Edit（heredoc 中文+反引号+转义序列会静默失败，replace 不生效也不报错，务必 typecheck+live 双验证）
- 交互类改动用 playwright 真实点击序列验证（不是 evaluate 合成点击）
- 用户 profile 的数据不要留探针残留（测试后清理）；用户当前无知识库，创建后布局即与 Cherry 一致
