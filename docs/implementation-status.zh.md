# 实施状态

[English](implementation-status.md) | 中文

本账本严格区分已验证能力与承诺范围。只有当已发布控件调用真实 DSH Host 行为、展示进度与失败、在适用场景支持取消、按持久化约定从刷新／重连／重启恢复，并通过 packed profile 浏览器验证后，能力才可标记为**已验证**。

## 基线

- DSH：`0.1.1-rc.2` / `b150a551b8`
- Cherry Studio 源码与视觉参考：应用 `2.0.8` / `0bb1725c638bf12d505e9baadaa69f8da47dd05e`
- Cherry Studio 运行时依赖：无

## 能力账本

| 领域 | 状态 | 当前证据／下一验收边界 |
|---|---|---|
| 可安装 bundle 与可逆 profile patch | 已验证 | packed 安装／移除；移除保留设置和会话。 |
| Cherry 风格设置外壳 | 已验证 | 分组导航、响应式几何、语言／主题行为、未知 DSH section 保留。 |
| 提供方与模型管理 | 已验证 | Settings／credentials／LLM 权威；连接测试；OpenAI 兼容模型发现；模型启用／禁用；Cherry 对等分栏 UI；精确写入和移除。 |
| 默认与当前模型选择 | 已验证 | revision-fenced 默认写入和真实 session 切换，并在写后重新确认。 |
| 兼容性与秘密 schema 预检 | 已验证 | 精确 DSH 基线 gate 和 unsupported wrapper fail-closed 审计。 |
| 产品工作区组合 seam | 已验证 | 增量导航与 keyed 主 surface 权威、conversation 共存、瞬时选择、packed browser 选择／返回及卸载回落测试。 |
| 翻译工作区 | 计划中 | 流式 DSH LLM job、取消、语言管理、复制／替换和持久分页历史。 |
| 绘画／图像生成工作区 | 计划中 | 提供方／模型控件、异步任务、轮询／取消、托管文件、画廊、复用／下载／删除和 DSH 附件。 |
| 知识库／RAG 工作区 | 计划中 | CRUD、摄取、解析／切分、Embedding／向量索引、检索／重排、召回测试、引用及 DSH tool/context 注册。 |
| MCP | 计划中 | Server 生命周期、传输、日志、prompt／resource／tool、信任及 DSH tool 注册。 |
| Skills | 计划中 | 来源目录、安装／更新／移除、完整性、生命周期及普通 DSH skill 注册。 |
| 网络搜索 | 计划中 | 提供方设置和 credentials，并接入 DSH search/fetch adapter 与策略。 |
| 文档转 Markdown 与 OCR | 计划中 | 带类型上传／选择、有界 Host worker、进度、取消和结果处理。 |
| 本地模型与 API Gateway | 计划中 | 下载／运行时生命周期，以及带认证和安全绑定的 gateway 控件。 |
| 外观与通知 | 计划中 | DSH 主题／语言权威和浏览器／Host 能力检测。 |
| 数据、导入／导出、备份和连接器 | 计划中 | 规范 DSH archive、验证／恢复、调度、冲突处理和秘密过滤连接器。 |
| 用量分析 | 计划中 | 直接检测 DSH 调用、token／cache／费用归因、保留、查询和仪表盘。 |
| Channels 与计划任务 | 计划中 | 持久 Host 生命周期、准入／权限路由、锁、恢复、执行历史和手动运行。 |
| 快捷键与助手界面 | 计划中 | 浏览器基线、能力检测 Host 集成和 DSH session/context 权威。 |
| 截图 | 计划中 | 浏览器捕获／上传基线、可选 Host 捕获、标注／导入和附件生命周期。 |
| 系统、依赖、诊断、关于与更新 | 计划中 | Control Center／DSH 事实、许可证／来源清单、有界操作、更新验证和迁移。 |
| 完整对等／安全／恢复矩阵 | 计划中 | 桌面／窄屏、亮／暗、中／英、重启／重连／卸载、迁移、供应链和兼容性覆盖。 |

## 安全不变量

> Secret 不得进入普通设置响应、浏览器持久化、日志、导出、analytics 或 diagnostics

真实凭据绝不作为 fixture。测试只在一次性 profile 中使用合成凭据；`pnpm verify:secrets` 会在发布前拒绝常见的源码内嵌秘密形式。
