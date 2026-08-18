# DSH Control Center Web Edition

这是一个面向 DSH Web profile 的可安装 AGPL-3.0 控制中心。第一批以 Cherry Studio 的信息架构改造 DSH 原生设置外壳和模型设置页，同时继续以 DSH settings、credentials、LLM routes、sessions、权限、preset 和插件 surface 为唯一权威。

## 支持基线

- DeepSeek Harness `0.1.0-rc.7`（`99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`）
- Cherry Studio 源码／视觉基线 `13687df354e9845c7e2b6d155eac6a9171f6a533`（应用版本 `2.0.7`）

若运行时实际解析到的 DSH 契约包不匹配支持基线，本包会在浏览器端激活前使启动失败。

## 安装

```bash
dsh plugin --profile web add @dsh-control-center/bundle
```

## 移除

```bash
dsh plugin --profile web remove @dsh-control-center/bundle
```

移除后恢复 DSH 原生设置包，不删除 DSH 设置、凭据、提供方或会话。

## 当前状态与路线图

已验证范围包含设置外壳、通用设置贡献、本地配置文件操作、onboarding、提供方创建／编辑／删除、只写凭据、草稿模型发现与采纳、默认／当前模型选择，以及增量产品工作区导航／surface seam。

完整对等路线还包括翻译、绘画／图像生成和知识库三个产品工作区，以及 MCP、Skills、搜索、文档处理、OCR、本地模型、API Gateway、数据与备份、用量、Channels、计划任务、快捷能力、助手界面、截图、诊断和更新。当前不会用不可用控件或空页面冒充完成；只有具备真实 Host 行为、持久化、取消、恢复和 DSH 权威集成的能力才会进入已发布 UI。

完整目标见双语[产品规格](docs/control-center-web-edition.zh.md)，当前实现状态见[实施账本](docs/implementation-status.zh.md)。

## 开发

```bash
pnpm install
```

```bash
pnpm check
```

```bash
pnpm test:browser
```

浏览器测试使用只绑定 loopback 的合成 OpenAI-compatible fixture。不得把真实凭据写入源码或公开 issue；详见 [SECURITY.md](SECURITY.md)。

## 源码与许可证

本项目采用 GNU AGPL version 3 only。Cherry Studio 衍生源码与修改记录见 [NOTICE](NOTICE) 和[源码来源清单](provenance/cherry-source-inventory.json)。DSH 依赖继续遵循其 MIT 许可证。
