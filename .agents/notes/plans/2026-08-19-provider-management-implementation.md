# Provider Management Implementation Plan
**Priority**: P0 (Phase 2 - 设置外壳与模型纵向闭环)
**Target**: 2026-08-19 onwards

## 目标
实现完整的 Provider Management（提供方管理）功能，作为 Phase 2 "设置外壳与模型纵向闭环"的核心组件。

## 范围（基于规格 line 95）

### Client UI 职责
- ✅ 提供方列表/编辑器
- ✅ 密钥状态展示
- ✅ Endpoint 配置
- ✅ Custom Header 配置
- ✅ 模型发现触发

### DSH Host 职责
- ✅ 提供方适配器
- ✅ 连通性测试
- ✅ 远程模型发现
- ✅ 配置验证

### 权威与存储
- DSH settings (`settings.yaml` namespace)
- DSH credentials (API keys, tokens)
- SQLite 发现缓存

### Web Edition 规则
**复用并扩展 DSH LLM 注册表，而不是创建第二套模型权威**

---

## Cherry Studio 基线分析

### 文件结构
```
src/renderer/pages/settings/ProviderSettings/
├── ProviderSettingsPage.tsx        # 主页面组件
├── ProviderList.tsx                # 左侧 Provider 列表
├── ProviderSetting.tsx             # 右侧 Provider 详情/编辑器
├── hooks/
│   ├── useProviderDeepLinkImport.ts
│   └── ...
├── primitives/
│   ├── ProviderSettingsDrawer.tsx
│   └── ProviderSettingsPrimitives.tsx
└── utils/
    └── providerDisplay.ts
```

### 核心功能
1. **Provider 列表** (`ProviderList.tsx`)
   - 显示所有可见 providers
   - 筛选（agent/all）
   - 选中状态
   - 添加新 provider

2. **Provider 编辑器** (`ProviderSetting.tsx`)
   - 基本信息（名称、类型、icon）
   - Endpoint 配置
   - API Key 管理
   - Custom Headers
   - 模型发现/刷新
   - 模型启用/禁用
   - 连通性测试
   - 删除 provider

3. **Deep Link Import**
   - 从 URL/share link 导入 provider 配置

---

## DSH 现有能力分析

### LLM 包（`packages/llm/`）
- ✅ Provider adapters
- ✅ Model catalog
- ✅ API key management (via credentials)
- ✅ Call config

### Settings 包（`packages/settings/`）
- ✅ Settings schema & validation
- ✅ Settings file persistence
- ✅ Namespace isolation

### Credentials 包（`packages/credentials/`）
- ✅ Encrypted secret storage
- ✅ Credential views
- ✅ Scoped access

### 现有 UI（`packages/client/ui-settings-models/`）
- ⚠️ 可能存在但功能不完整
- 需要检查并决定是扩展还是替换

---

## 实施步骤

### Step 1: Architecture & Types (2-3 hours)
**目标**: 定义 Control Center Provider Service 架构

1. **创建 provider-types.ts**
   ```typescript
   export interface ProviderView {
     id: string
     name: string
     type: ProviderType
     baseURL: string
     enabled: boolean
     models: ModelView[]
     // ...
   }
   
   export interface CreateProviderDto { ... }
   export interface UpdateProviderDto { ... }
   
   declare module '@deepseek-ai/dsh-typert-protocol' {
     interface TypertRemoteNamespaceMap {
       controlCenterProviders: {
         list(): Promise<ProviderView[]>
         get(params: { providerId: string }): Promise<ProviderView>
         create(params: { dto: CreateProviderDto }): Promise<ProviderView>
         update(params: { providerId: string; dto: UpdateProviderDto }): Promise<ProviderView>
         delete(params: { providerId: string }): Promise<void>
         testConnection(params: { providerId: string }): Promise<TestConnectionResult>
         discoverModels(params: { providerId: string }): Promise<DiscoverModelsResult>
       }
     }
   }
   ```

2. **创建 provider-remote-client.ts**
   - TypertRemoteContribution descriptor
   - 7 methods with proper parameters

### Step 2: Host Service (4-6 hours)
**目标**: 实现 ProviderService with DSH LLM registry integration

1. **创建 providers.ts**
   ```typescript
   export class ProvidersService extends Service {
     static inject = ['settings', 'credentials', 'llm'] as const
     readonly typertRemote = bindTypertRemote(this, 'controlCenterProviders')
     
     async list(): Promise<ProviderView[]> {
       // 从 DSH settings namespace 读取 providers
       // 注入 credential status (无需暴露实际 key)
       // 映射到 ProviderView
     }
     
     async create(params: { dto: CreateProviderDto }): Promise<ProviderView> {
       // 验证 dto
       // 写入 DSH settings
       // 存储 API key 到 credentials
       // 返回 ProviderView
     }
     
     async update(params: { providerId, dto }): Promise<ProviderView> {
       // 更新 settings
       // 更新 credentials（如果 API key 变化）
       // 触发 LLM registry 刷新
     }
     
     async testConnection(params: { providerId }): Promise<TestConnectionResult> {
       // 使用 provider adapter 测试连接
       // 返回成功/失败+错误信息
     }
     
     async discoverModels(params: { providerId }): Promise<DiscoverModelsResult> {
       // 调用 provider /models endpoint
       // 解析模型列表
       // 更新 discovery cache (SQLite?)
       // 返回发现的模型
     }
   }
   ```

2. **DSH Integration Points**
   - Read from `settings` service
   - Write to `settings` service (with validation)
   - Read/write `credentials` service
   - Integrate with `llm` adapters
   - Optional: SQLite for model discovery cache

### Step 3: Tests (2-3 hours)
**目标**: 13+ tests covering all Host service methods

1. **tests/providers.spec.ts**
   - list() returns DSH providers
   - create() writes to settings + credentials
   - update() modifies settings
   - delete() removes provider + credentials
   - testConnection() success/failure
   - discoverModels() parses model list
   - Credential isolation (no API keys in response)
   - Settings validation
   - Duplicate provider ID handling

### Step 4: Client UI - Provider List (3-4 hours)
**目标**: 左侧 Provider 列表组件

1. **创建 ProviderList.tsx**
   - 复制 Cherry Studio 的 ProviderList
   - 替换 data source: `remote.controlCenterProviders.list()`
   - 筛选功能
   - 添加新 provider 按钮
   - 选中状态管理

2. **创建 ProviderList.module.css**
   - Cherry-style 样式
   - 响应式布局

### Step 5: Client UI - Provider Editor (4-6 hours)
**目标**: 右侧 Provider 详情/编辑器

1. **创建 ProviderEditor.tsx**
   - 复制 Cherry Studio 的 ProviderSetting
   - 表单字段:
     - Name
     - Type (dropdown)
     - Base URL
     - API Key (masked input)
     - Custom Headers (key-value pairs)
   - 操作按钮:
     - Test Connection
     - Discover Models
     - Save
     - Delete (with confirmation)
   - 模型列表 (discovered models)
     - Enable/disable checkboxes
     - Model details

2. **创建 ProviderEditor.module.css**

### Step 6: Client UI - Provider Section Page (2-3 hours)
**目标**: 组装完整的 Provider Settings 页面

1. **创建 ProviderSection.tsx**
   - 复制 Cherry Studio 的 ProviderSettingsPage 布局
   - 左右分栏: ProviderList + ProviderEditor
   - State management (selected provider)
   - Remote service injection

2. **注册到 settings.section**
   ```typescript
   ctx.slots.inject('settings.section', () =>
     ctx.slots.register({
       name: 'settings.section',
       id: 'providers',
       order: 5,  // Before Models (10)
       label: () => providersT('nav'),
       inject: providersInjected,
     }, ProviderSection)
   )
   ```

### Step 7: E2E Tests (2-3 hours)
**目标**: Browser E2E tests

1. **tests/providers.e2e.spec.ts**
   - Open Settings > Providers
   - Create new provider
   - Edit provider details
   - Test connection
   - Discover models
   - Enable/disable models
   - Delete provider

### Step 8: Integration & Polish (2-3 hours)
- Type checking
- Build verification
- Visual regression testing
- Cherry Studio UI parity check
- Documentation update

---

## 工作量估算
- **Total**: 22-33 hours (3-4 days)
- **Step 1-3** (Backend): 8-12 hours (1-1.5 days)
- **Step 4-6** (Frontend): 9-13 hours (1-1.5 days)
- **Step 7-8** (Testing & Polish): 4-6 hours (0.5-1 day)

---

## 风险与依赖

### 风险
1. **DSH LLM Registry 耦合** - 需要理解现有 LLM 架构
2. **Credentials Integration** - 密钥存储和检索的安全性
3. **Settings Schema** - 可能需要扩展 DSH settings schema
4. **Cherry UI Electron 依赖** - 需要剥离 IPC/Preference 依赖

### 依赖
- DSH `llm` package API 稳定性
- DSH `settings` package schema extension capability
- DSH `credentials` package API
- TypertRemote protocol (已验证 ✅)

---

## 验收标准

### 功能验收
- [ ] 可以列出所有 DSH providers
- [ ] 可以创建新 provider（写入 DSH settings）
- [ ] API key 存储在 credentials（不在 settings）
- [ ] 可以编辑 provider 配置
- [ ] 可以测试 provider 连接
- [ ] 可以发现 provider 的模型列表
- [ ] 可以启用/禁用模型
- [ ] 可以删除 provider
- [ ] UI 与 Cherry Studio 100% 对等

### 集成验收
- [ ] Provider 配置是唯一权威（无重复）
- [ ] 配置的 provider 可以在 coding session 中使用
- [ ] Credentials 不泄漏到普通 settings 响应
- [ ] 现有 DSH 功能不受影响

### 质量验收
- [ ] 13+ unit tests (all passing)
- [ ] E2E tests covering full workflow
- [ ] No TypeScript errors
- [ ] Build successful
- [ ] Visual regression tests pass

---

## 后续步骤（Phase 2 剩余）
1. ✅ **Provider Management** (本计划)
2. **Model Management** - 完善模型管理 UI
3. **Settings Shell** - 复制 Cherry 设置导航外壳
4. **Model 纵向闭环验证** - 端到端验证 provider → model → coding session

---

## 参考文档
- 规格: Line 95-96 "提供方与模型管理"
- Cherry Studio: `src/renderer/pages/settings/ProviderSettings/`
- DSH LLM: `packages/llm/`
- DSH Settings: `packages/settings/`
- DSH Credentials: `packages/credentials/`
