# Chat 块级渲染审计 — DSH Control Center vs Cherry Studio

> 基线：Cherry `56cf04c3`、DSH `cd5ef814`（0.1.2-alpha.1）。本审计以 DSH 的 Node 模型为真源，Cherry 块为对照，回答“哪些 Cherry 块已由 DSH 覆盖、哪些不应重复造、哪些只做 token 级视觉对齐”。

## 一、真源判定（第一性原理）

Cherry 的 `messages/blocks/`（`ThinkingBlock`/`ToolBlockGroup`/`MainTextBlock`/`CitationsList` 等）是**渲染层**，DSH 的 `assistant-step`（`AssistantBlock: text/reasoning/image/tool-call`）+ `ReasoningRow` + `conversation.details.tool` + `TurnProcess`/`CompactionAnchor` 是**数据层 + 宿主渲染层**。

铁律“只留一份”在此处落为：**不在 DSH 之上重复渲染同一数据**。DSH 已拥有的 `assistant-step` 块是 agent loop 的直接投影，重做一遍 Cherry 块会产生两套流式状态、两套滚动锚点，且与宿主的 Turn/Step 索引脱节。

## 二、块级映射

| Cherry 块 | DSH 真源 | 结论 | 备注 |
|---|---|---|---|
| `ThinkingBlock`（折叠 + 流式预览 + `BeatLoader`） | `assistant-step.reasoning` → `ReasoningRow`（`DisclosureRow` + `latestLine/latest` 摘要 + `data-follow-end`） | **已覆盖，等价** | Cherry 的 `scanThinkingPreview`/`BeatLoader` + 1s 最小展示，DSH 用 `ThinkingDisclosure` 语义等价；差异仅为 token 级动画与摘要策略，不另起块 |
| `ToolBlockGroup`（工具折叠群 + `tool-node-reader`） | `tool-call` → `conversation.details.tool` 的 `DetailsPanel` + `findToolCall` | **已覆盖，等价** | 已有 `conversation.details.tool` 单 slot，无需自建分组；子渲染器（webSearch/knowledge/mcp/painting）由各 Host `toolService.register` 的 `render` 提供 |
| `CitationsList` / `ImageBlock` | `text`/`image` blocks + 附件缝 | **已覆盖** | 引用与图片由 `MarkdownText`/`renderMessageImages` 承载 |
| `ErrorBlock` / `RetryStatusBlock` | `turn-error`/`model-retry`/`turn-max-tokens` Nodes | **已覆盖** | 属 Turn 级节点，非 Assistant 块 |
| `MessageTranslate` | `AssistantMessageActions` 的翻译动作 | **已覆盖** | 不在消息体块内，属动作层 |
| `CompactionAnchorBlock` | `compaction`/`manual-compaction` + `TurnProcess` | **已覆盖** | General 的 compaction 策略联动已在位 |
| `MainTextBlock`（含 citations/references） | `assistant-step.text` → `MarkdownText` + `markdownLabels` | **已覆盖** | Cherry 的引用脚注与 DSH 的 `fileMentions` 同为 Markdown 扩展 |

## 三、结论

- **不再新增块渲染器**：以 DSH 的 `AssistantMarkdown`/`ReasoningRow`/`DetailsPanel` 为真源。
- **只做视觉对齐**：间距、字号、分隔线、`[data-chat-flow-kind]` 等 token 级差异随 Phase 1.3 列表体验一起做像素级横扫。
- **不再做 `user-actions` slot**：DSH 暂无该 slot，`assistant-actions` 已在 `turn-tail` 的 `assistant-actions` list 上挂载；user 侧动作待上游 slot 再议。

## 四、证据路径

- DSH：`packages/client/ui-chat/src/client/chat/AssistantMarkdown.tsx`、`ReasoningRow.tsx`、`details/tool-node-reader.ts`、`contract/chat-nodes.ts`、`chat/ChatView.tsx`（工具行分组）
- Cherry：`src/renderer/components/chat/messages/blocks/`（`ThinkingBlock.tsx`/`ToolBlockGroup.tsx`/`CitationsList.tsx`/`MainTextBlock.tsx` 等）
- 本仓已验证：`MIGRATION_PLAN.md` §1.2 已更新为“深研结论”，不再列单块待办。
