# Agent Note: 面向 DSH 的 Cherry Studio Control Center Web Edition

Status: proposed

[English](control-center-web-edition.md) | 中文

## 问题

DeepSeek Harness 已具备强大的 coding agent（编程智能体）运行时，但当前 Web 设置体验只暴露了用户所需配置和管理能力的一小部分。模型提供方与模型配置、MCP 生命周期、skill（技能）发现、搜索提供方、数据管理、用量分析、自动化和系统服务分散在不完整或偏技术化的界面中。

Cherry Studio 已经提供所需的设置信息架构、视觉设计、组件和后端行为。依据行为描述重新构建这些资产会把时间花在复刻可依法复用的代码上；让 Cherry 作为控制平面运行，则会使完整体验依赖一个独立应用，而不是安装到现有 DSH 部署中的扩展。

产品要求是一个独立 DSH 扩展，使现有 DSH 用户无需运行 Cherry Studio 即可获得完整的 Cherry 风格控制中心。该扩展可以比 DSH 本身更大；安装简便性、UI 对等和真实能力集成优先于包体积或减少源码复制量。

## 提案

### 产品决策

- 将 **Control Center Web Edition** 构建为可安装的 DSH 组合包，而不是由 Cherry 承载的 DSH 体验。
- 对用户呈现一个安装单元和一个设置入口，同时保持内部 Host、Client、共享领域、存储及提供方包可独立测试。
- 在 DSH Web 内完整复刻 Cherry Studio 的设置导航、页面结构、视觉行为和管理工作流。
- 即使 Cherry Studio 的翻译、绘画／图像生成和知识库没有独立的顶层设置页，也必须复制并集成这三个产品工作区。其完整 UI 工作流和后端能力属于强制产品范围，而非可选设置附加项。
- 将每一个复制过来的设置控件和产品工作流连接到真实的 DSH Host 能力；仅外观看似可用的页面、空占位或静默空操作均不构成对等。
- 保留 DSH 现有的编程、会话、agent preset、工具、权限、subagent、工作流和插件能力。Control Center 扩展 DSH，而不是替换 agent 产品。
- 将完整对等视为最终范围，同时按经过验证的纵向阶段交付。早期阶段可以不完整，但路线图不得静默删除已经确认的设置领域。

### 源码复用与许可证姿态

- 当复制和改造能够缩短建设时间或保持对等时，可以复用 Cherry Studio 的组件、样式、路由、hook、schema、服务及配套源码。
- 初始对等基线为本地 `D:\Github_Open\cherry-studio` 在提交 `13687df` 的检出状态，其应用版本为 `2.0.7`。后续上游同步是明确安排的工作，而不是隐式移动目标。
- 发布的 Control Center 项目采用与 AGPL-3.0 兼容的许可证姿态。复制和修改的 Cherry 源码保留适用的版权、许可证、归属及修改通知。
- 对发布或通过网络访问的版本，依照适用 AGPL 条款公布对应源码和必要通知。不得利用包边界隐藏或规避源码复用产生的义务。
- 源码来源清单记录复制文件、Cherry 基线、本地目标、实质修改和许可证通知覆盖情况，使上游刷新与合规审查保持可审计。

### 面向用户的约定

- 现有受支持 DSH 安装可通过一个有文档说明的安装或组合操作加入 Control Center；用户无需克隆或启动 Cherry Studio。
- 打开设置时显示 Cherry 风格的分组导航和页面框架，而不是第二个互不相关的配置应用。
- 配置变更作用于用户正在使用的同一个 DSH 运行时。Control Center 不维护相互竞争的提供方、模型、权限或 agent preset 权威。
- 所有受支持秘密均使用 DSH credentials 域或其他专用秘密存储，且绝不出现在普通设置响应、日志、导出、分析记录或浏览器持久化中。
- Control Center Web Edition 不另行发布 Electron 或 Tauri 伴生程序。浏览器负责展示；DSH Host 插件可以使用 Node.js API、原生模块和受控子进程提供本地系统行为。
- 面向桌面的结果应适配 Web/Host 产品边界，而不是被省略。平台限制必须明确显示，且 UI 不得宣称当前 Host 无法执行的操作受支持。
- 中文和英文都是一等产品语言，从 Cherry 复制的用户可见文案继续纳入产品 i18n 系统。

### 架构与打包

```text
@dsh-control-center/bundle                 one user-facing install unit
├─ client/control-center-shell             Cherry settings shell, navigation, routes, page UI
├─ host/control-center-api                 typed Host/Client operations and events
├─ shared/control-center-domain            wire-safe schemas, IDs, capability contracts
├─ host/control-center-storage             SQLite catalogs, history, jobs, migrations
├─ capabilities/*                          provider, MCP, skills, search, translation, image, knowledge, data, automation, system
├─ client/capabilities/*                   feature-owned settings pages, product workspaces, and state controllers
└─ vendor/cherry-studio/*                  attributed copied/adapted Cherry source
```

该组合包组装一组 Cordis 插件，但作为一个产品安装。每项长生命周期注册、进程、监听器、监视器、定时器和路由都归所属插件生命周期管理，并在组合包或能力卸载时 dispose（资源释放）。

Client 侧负责路由、渲染、本地草稿、无障碍和响应式行为。Host 侧负责秘密、文件、需要特权凭据的网络调用、进程、数据库、计划任务、本地模型、原生集成和策略执行。Host/Client 边界仅传递带类型且 JSON 安全的约定；renderer 代码不得导入 Host 服务或 Cherry Electron IPC facade。

| 内部包组 | 职责 |
|---|---|
| `bundle` | 挂载完整产品，为此组合替换原生设置外壳，并选择能力实现。 |
| `client/control-center-shell` | 渲染 Cherry 兼容的设置导航、路由布局、搜索、页面框架、响应式状态、语言和主题集成。 |
| `shared/control-center-domain` | 维护跨进程 schema、稳定 ID、错误、能力状态和传输安全记录。 |
| `host/control-center-api` | 通过 DSH 支持的传输 seam 向 Client 暴露特权操作和事件。 |
| `host/control-center-storage` | 维护不属于 `settings.yaml` 或会话日志的 SQLite 迁移和业务记录。 |
| `capabilities/*` | 为各受管领域实现独立的 Service Definition、Service Provider 和 Consumer 角色。 |
| `vendor/cherry-studio/*` | 保存带来源和许可证元数据的复制或实质改造 Cherry 源码。 |

### 设置 UI 对等约定

Control Center 复制并改造 Cherry 设置外壳及其功能页面，而不是使用现有通用插件卡片布局近似实现。初始导航基线为：

| 分组 | 页面 |
|---|---|
| 核心 | 模型服务／提供方、模型管理、本地模型、API Gateway。 |
| 能力 | MCP、Skills、网络搜索、文档转 Markdown、OCR。 |
| 个人 | 外观、通知、数据、用量。 |
| 自动化 | Channels、计划任务、快捷键、Quick Assistant、Selection Assistant、截图。 |
| 系统 | 系统设置、环境依赖、关于与更新信息。 |
| DSH 原生 | 通用设置、权限、默认模型、agent preset、插件清单／配置及其他 DSH 独有贡献。 |

翻译、绘画／图像生成和知识库是产品工作区，而不是人为塞入设置页面的功能。Control Center 使用 Cherry 兼容的工作区外壳将它们加入 DSH 主产品导航，其提供方和检索选项仍可从相关设置及上下文控件进入。对等范围包括翻译历史和语言管理；绘画创作、模板、模型专属控件、异步任务、画廊、复用与下载；以及知识库创建、数据源摄取、处理、切分、Embedding、索引、检索配置、召回测试、引用、更新、删除和 agent／工具集成。

对等范围涵盖导航层级、标签、在许可证允许时使用的图标、页面布局、表单、列表、筛选、对话框、加载与错误状态、空状态、验证、键盘行为、响应式行为以及亮／暗主题。Web 适配可以替换 Electron 传输或 OS 原语，但必须保留用户可见结果和失败语义。

该组合包在自身组合中替换原生 `ui-settings-general` 展示，并继续消费功能注册。它构建于[插件自有设置界面](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/.agents/notes/implemented/architecture/2026-08-12-plugin-owned-settings-surface.md)之上，而不是撤销 namespace 自注册；同时保留[客户端设置分层提案](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/.agents/notes/proposed/architecture/2026-07-25-client-settings-locale-theme.md)中的功能所有权。复制页面会成为由 DSH 服务支撑的 DSH Client 贡献；不得保留对 Cherry Electron `ipcApi`、Preference、DataApi、WindowManager 或应用生命周期容器的隐藏依赖。

### 能力所有权与集成矩阵

| Cherry 设置领域 | Web Client 职责 | DSH Host／后端职责 | 权威与存储 | Web Edition 规则 |
|---|---|---|---|---|
| 提供方与模型管理 | 提供方列表／编辑器、密钥状态、Endpoint、Header、模型发现和启用。 | 提供方适配器、连通性测试、远程模型发现、配置验证。 | DSH 设置及 credentials；发现缓存存入 SQLite。 | 复用并扩展 DSH LLM 注册表，而不是创建第二套模型权威。 |
| 本地模型 | 目录、下载、进度、模型状态和运行时控制。 | 下载管理器、校验和、存储配额、本地推理进程生命周期。 | 托管文件及 SQLite 元数据。 | Host 服务提供本地操作；不需要桌面外壳。 |
| API Gateway | 状态、URL、凭据控制、启动／停止／重启和文档链接。 | 带认证的 OpenAI 兼容本地网关及生命周期。 | 设置及 credentials；运行时状态保存在内存。 | 默认安全绑定，仅在明确策略下开放非 loopback 访问。 |
| MCP | 服务器目录／编辑器、安装、启用、日志、工具、prompt、资源和逐工具批准。 | stdio／SSE／Streamable HTTP 客户端、进程生命周期、信任、发现、重启和取消。 | SQLite 业务记录、credentials 及有界日志。 | 复制 Cherry 工作流，同时把发现的能力注册到 DSH 工具和 prompt 注册表。 |
| Skills | 目录、搜索、安装、更新、卸载、启用和来源详情。 | 来源解析、下载、验证、版本管理、文件系统安装和索引。 | 托管 skill 文件及 SQLite 目录元数据。 | 已安装 skill 成为普通 DSH skill，并可在设置页面之外继续使用。 |
| 网络搜索 | 提供方编辑器、API 凭据、默认项和能力专属选项。 | 搜索／抓取适配器、重试、结果标准化和策略。 | 设置及 credentials。 | 扩展 DSH 搜索能力，而不是代理到运行中的 Cherry 进程。 |
| 翻译 | 源／目标语言选择、自动检测、流式结果、复制／替换操作、语言管理和分页历史。 | 翻译 prompt／运行时执行、语言检测、取消、历史写入及模型／提供方选择。 | 设置及 credentials；SQLite 语言和翻译历史。 | 复制 Cherry 完整翻译工作区并连接 DSH 模型提供方，且不把每次翻译变成 coding session。 |
| 绘画／图像生成 | Prompt 编辑器、模板、模型选择、提供方专属控件、进度、画廊、复用、下载和删除。 | 图像模型能力发现、请求映射、异步任务、轮询／取消、结果摄取和文件生命周期。 | 设置及 credentials；SQLite 绘画／任务记录及托管图像文件。 | 保留 Cherry 专属工作区和适配器，并将生成图像暴露为 DSH 文件和 agent 附件。 |
| 知识库 | 知识库列表／详情、创建、数据源管理、处理状态、RAG 配置、召回测试、结果和引用。 | 文件／URL／文本摄取、解析、切分、Embedding、向量索引、检索、重排、更新、删除和引用投影。 | SQLite 知识元数据／分片／任务、托管源文件及向量索引；Embedding／重排提供方 credentials。 | 复制完整 Cherry 知识工作流，并把检索注册为 coding agent 可用的 DSH 工具／上下文能力。 |
| 文档处理 | 转换器选择、选项、进度和结果处理。 | 文档转 Markdown worker、文件暂存、限制和取消。 | 设置、临时文件及可选历史记录。 | 浏览器上传／选择流程通过带类型操作调用 Host worker。 |
| OCR | 提供方／本地引擎选择、语言／选项和进度。 | OCR 适配器、本地引擎管理、文件暂存和取消。 | 设置及 credentials；可选托管模型。 | 使用 Host 模块或子进程替换 Electron 专属实现。 |
| 外观 | 主题、语言、密度、字体和兼容视觉偏好。 | 必要时执行持久化偏好验证。 | Client 偏好／设置 namespace。 | 在渲染 Cherry 兼容控件的同时保留 DSH 主题和语言约定。 |
| 通知 | 权限状态和通知偏好。 | 事件路由及可选 Host 原生通知提供方。 | 设置及浏览器权限状态。 | 可用时使用 Web Notifications；Host 原生提供方可增强能力但不引入独立伴生程序。 |
| 数据、导入、导出与备份 | 备份／导入／导出工作流，以及 WebDAV、S3、坚果云、Notion、语雀、Joplin、Obsidian 和思源配置。 | 归档生成、恢复验证、连接器、调度、冲突处理和秘密使用。 | SQLite 业务数据、托管文件、设置及 credentials。 | DSH 数据格式是规范格式；Cherry 格式是迁移输入，而不是第二个实时数据库。 |
| 用量分析 | 指标、图表、热力图、筛选、下钻和分页记录。 | 请求归因、token／缓存／费用聚合、保留和查询 API。 | SQLite 用量记录。 | 直接检测 DSH 模型调用，使所有 agent 活动均被统计。 |
| Channels | Channel 配置、状态、凭据和路由控制。 | Channel 适配器、Webhook／轮询生命周期、消息准入和策略。 | SQLite 记录、设置及 credentials。 | Channel 轮次进入现有 DSH 会话和权限流程。 |
| 计划任务 | 编辑器、日历／列表视图、运行历史、启用和手动运行。 | 持久调度器、锁、恢复、执行和结果记录。 | SQLite 计划及运行历史。 | 调度驻留于 DSH Host，并在浏览器关闭后继续存在。 |
| 快捷键 | 快捷键编辑器、冲突和可用性状态。 | 可选 Host 级全局快捷键提供方和命令分发。 | 设置。 | 浏览器快捷键通用可用；全局快捷键在受支持平台使用 Host 原生模块，并报告不支持的平台。 |
| Quick Assistant | 配置和 Web 内启动界面。 | 会话创建、上下文注入、模型选择和策略。 | 设置及 DSH 会话。 | Web 外壳提供助手界面，无需独立桌面窗口。 |
| Selection Assistant | 配置及对应用内所选文本执行的操作。 | 上下文处理和 agent 分发；可选 Host 集成提供方。 | 设置及 DSH 会话。 | 以页面内选择为基线；系统级选择需要可用 Host 提供方，且不得虚假宣称。 |
| 截图 | 捕获选项、预览、标注／导入和 agent 附件。 | 文件暂存、可选 Host 捕获提供方和清理。 | 临时文件及附件元数据。 | 以浏览器捕获／上传为基线；桌面捕获使用同一插件发行中的可选 Host 提供方。 |
| 系统、依赖、关于与更新 | 运行时状态、依赖控制、诊断、版本／许可证通知和更新状态。 | 依赖检测／安装策略、诊断、插件更新检查和安全生命周期操作。 | 设置、托管工具元数据及更新记录。 | 控件管理 Control Center 和 DSH，而不是并不存在的 Cherry 桌面应用。 |
| 现有 DSH 设置 | 以 Cherry 兼容方式展示权限、默认模型、preset 和插件清单。 | 现有 DSH 服务保持权威。 | 现有 DSH 存储。 | 不允许出现功能回退或重复设置权威。 |

### 数据所有权与安全

| 数据类别 | 规范所有者 |
|---|---|
| 提供方启用状态、Endpoint、默认项、功能选项和普通配置 | DSH `settings.yaml` namespace。 |
| API Key、Token、密码、私有 Header 和远程存储凭据 | DSH credentials 或专用加密秘密提供方。 |
| MCP 目录、市场元数据、翻译历史／语言、绘画任务／画廊元数据、知识库记录／分片／索引元数据、用量历史、计划任务、连接器记录和任务历史 | 使用仅追加迁移的 Control Center SQLite。 |
| Skills、本地模型、生成图像、知识源文件／向量索引、下载、备份和生成产物 | 带来源和完整性元数据的 namespace 托管数据目录。 |
| Agent 会话、消息、计划、工具结果和模型可见的持久事实 | 现有 DSH 会话持久化。 |
| 浏览器草稿、筛选、已选标签页和临时展示状态 | 有界 Client 存储，绝不作为 Host 行为权威。 |

设置写入保留 revision fencing（修订隔离）和恢复读取。DSH 设置脱敏器已证明能够移除经 object、dict 和 array 容器到达的 secret role 字段，并把带 secret role 的容器作为不透明秘密整体移除。若复制或第三方 schema 的秘密后代只能经 union、intersection、transform、lazy、tuple 等当前不支持的 wrapper 到达，则该 namespace 在跨越设置协议前必须被 fail-closed schema 审计拒绝，或先为 DSH 脱敏器补充并证明对应 wrapper 支持。导出、备份、诊断、日志和用量采集均分别应用明确的秘密过滤。

下载的 MCP 服务器、Skills、模型、二进制和更新记录来源、版本、完整性哈希、权限和安装状态。安装与进程执行必须通过 DSH 权限策略、路径约束、取消和生命周期清理。浏览器请求不得直接选择任意 Host 方法；每项能力只暴露窄化且带类型的操作集合。

### 与现有 DSH 集成

- Control Center 组合包通过组合和公开 Client 扩展点替换设置展示；它不需要永久 fork 无关的 DSH 核心包。
- 现有 DSH 模型、设置、credentials、权限、agent preset、会话、工具、Skills、工作流、遥测和插件服务在已经满足领域需求时保持规范能力。
- 缺失的可复用行为应作为能力 seam 实现，并明确 Service Definition、Service Provider 和 Consumer 所有权，而不是隐藏在 React 页面或 API 路由中。
- Host 和 Client 贡献通过可逆 Cordis effect 注册。卸载或禁用 Control Center 会移除其 UI、进程、路由、监视器和计划任务，且不破坏基础 DSH 状态。
- 产品发布受支持 DSH 版本的兼容性声明，并用可操作诊断拒绝不兼容运行时组合。
- Cherry 上游同步是经过审查的源码更新：比较已记录来源清单，移植相关变更，重跑对等与集成测试，并更新通知。禁止盲目替换整个子树。

### 交付阶段

1. **基础与合规：** 创建外部 AGPL 兼容包布局、源码来源清单、单操作组合包、Host/Client 传输、SQLite 迁移基础、秘密策略及 Cherry `13687df` 对等 fixture（测试前置数据）。
2. **设置外壳与模型纵向闭环：** 复制／改造完整设置外壳和提供方／模型页面，在组合包中替换原生外壳，并端到端连接提供方创建、credentials、模型发现、选择和真实 DSH 会话。
3. **核心能力与产品工作区：** 交付 MCP、Skills、网络搜索、翻译、绘画／图像生成和知识库，然后交付文档处理和 OCR，并具备真实的生命周期、安装、模型执行、摄取、检索、权限和取消行为。
4. **个人与数据：** 交付外观、通知、导入／导出、本地与远程备份连接器、数据迁移和完整用量分析。
5. **自动化：** 通过 Web/Host 实现交付 Channels、计划任务、快捷键、Quick Assistant、Selection Assistant 和截图工作流。
6. **系统与分发：** 交付本地模型、依赖管理、诊断、关于／许可证／更新页面、插件更新器、迁移助手及跨平台安装器或安装脚本。
7. **对等与加固：** 关闭每一项基线能力，运行视觉与行为对等套件、安全审查、迁移／恢复测试、性能预算、DSH 版本兼容测试及上游刷新演练。

第一实施批次只有在一个已安装组合包能够打开复制的 Cherry 风格外壳，并对真实 DSH 进程完成提供方／模型纵向闭环后才算结束。该批次可以为布局测试搭建后续导航项，但未发布页面必须在开发构建中清楚标记为不可用，且不得被描述为已完成功能。

## 已考虑的替代方案

**让 Cherry Studio 作为控制平面、DSH 作为执行引擎。** 该方案复用最多后端代码，且 Cherry 已有 DSH bridge，但不满足选定的产品约定：现有 DSH 用户必须能够安装扩展并使用完整体验，而无需运行第二个应用。

**依据截图和行为 clean-room 重写 UI。** 该方案减少复制代码带来的许可证耦合，但会丢弃可用组件并延长对等时间。项目接受与 AGPL 兼容的源码发布和通知义务，因此直接复用是首选构建方式。

**构建一个物理单体 Cordis 插件。** 单文件／单包可使用户所说的“插件”在字面上成立，但设置 UI、存储、子进程、提供方和自动化具有不同生命周期与测试边界。在多个内部插件之上提供一个可安装组合包，既保留目标安装体验，又避免不可维护的实现。

**fork DSH 核心并原地替换其设置实现。** fork 可以绕过当前外部 Client 打包摩擦，但用户将不再是在普通 DSH 之上安装该产品。组合包可以提出上游扩展点改进，而产品代码继续保持可安装组合形态。

**发布独立 Electron 或 Tauri 伴生程序。** 伴生程序能简化全局桌面集成，但会增加另一个应用、生命周期、更新器和信任边界。Control Center 保持 Web Edition，并使用 DSH Host 模块或子进程实现本地行为；不支持的平台专属结果继续明确呈现。

**止步于缩减版 MVP。** 仅提供方、MCP 和 Skills 已经有用，但确认的产品承诺是完整的 Cherry 设置与后端对等。纵向分阶段用于控制实施风险，而不是重新定义最终范围。

## 验收标准

- 一个有文档说明的安装／组合操作即可将 Control Center 加入受支持的现有 DSH 部署，移除后部署恢复原设置展示且数据不损坏。
- 运行时不需要任何 Cherry Studio 进程、Profile、数据库、IPC 服务器或安装。
- 设置外壳包含全部基线导航领域，并保留 Cherry 中没有对应项的 DSH 原生设置。
- 每个已发布控件都读取真实状态、验证变更、执行承诺的 Host 操作、报告进度和失败，并按其持久化约定在刷新或重连后恢复。
- 提供方与模型配置只有一个权威，秘密绝不跨越普通设置响应，且配置模型能够启动真实 DSH coding agent 会话。
- MCP、Skills、搜索、翻译、绘画／图像生成、知识库、处理、数据、用量、自动化、本地模型和系统功能注册到现有 DSH 能力中，而不是停留为孤立管理记录。
- 翻译保留语言检测、语言管理、流式输出和持久历史；绘画保留模型专属生成、异步任务、托管图像结果和画廊工作流；知识库保留摄取、切分、Embedding、索引、可配置检索、召回测试、引用和 coding agent 检索。
- Web/Host 适配在没有独立伴生程序的前提下提供预期结果，且不可用的平台集成通过能力检测准确呈现。
- 复制的 Cherry 源码具有可审计来源记录，并完整覆盖适用的许可证、归属、修改和源码发布要求。
- 视觉回归 fixture 覆盖约定桌面及窄屏 Web 视口下的 Cherry 基线亮／暗主题；行为测试覆盖表单、验证、对话框、加载、空、错误和恢复状态。
- Host 集成测试使用真实设置、credentials 脱敏、SQLite 迁移、生命周期拆卸、有界子进程，以及有代表性的提供方／MCP／备份／调度器流程。
- 挂载 Control Center 后，现有 DSH 编程会话、权限模式、agent preset、subagent、工作流、工具和插件清单仍可使用。
- 受支持 DSH 和 Cherry 源码基线版本会被记录、测试并显示在诊断中；不兼容 DSH 版本必须在部分激活前失败。
- 在完整对等套件通过前，文档区分已完成、平台受限和计划中能力；任何占位都不得标为功能对等。

## 风险

- **AGPL 范围与归属错误：** 如果源码来源清单和发布检查不是强制项，复制代码可能在缺少完整通知或对应源码的情况下发布。
- **Cherry 上游漂移：** 复制的 renderer 代码和改造服务会与 Cherry 分化；上游刷新需要语义移植，而非盲目合并。
- **Electron 耦合：** Cherry 组件经常依赖 IPC、Preference、DataApi、窗口或 OS 约定。每个复制页面都需要明确的 DSH Client/Host 替代，残留导入可能产生具有欺骗性的可运行 mock。
- **外部 Client 打包缺口：** 在单操作安装足够稳健前，DSH 的仓外 Client 组合包工具链和设置外壳替换点可能需要上游改进。
- **秘密泄漏：** 广泛设置 namespace 暴露、嵌套 schema、诊断、导出、连接器和市场 manifest 增加了必须证明脱敏的路径数量。
- **供应链与进程执行：** MCP、Skills、模型、依赖和更新会下载或执行第三方内容。完整性元数据、信任提示、约束、权限和回滚都是产品要求。
- **跨平台差异：** 全局快捷键、捕获、通知、OCR、本地推理和依赖安装因操作系统与浏览器而异。能力检测必须防止虚假的对等声明。
- **重复权威：** 如果复制 Cherry hook 或存储时未替换其持久化假设，可能产生两份提供方、模型或设置真源并导致 agent 行为不一致。
- **组合包体积与启动成本：** 复制 UI 资产、目录、连接器和原生模块可能超过 DSH 体积。懒加载与能力激活可以优化运行时，但包体积不能成为删减范围的理由。
- **兼容性变动：** DSH 仍处于 1.0 之前，其 Client 模块、设置和传输约定可能变化。必须维护经过测试的兼容性矩阵并快速失败激活。
