import { readFileSync, writeFileSync } from 'node:fs'
const p = 'packages/control-center/src/client/KnowledgeWorkspace.tsx'
let s = readFileSync(p, 'utf8')

s = s.replace(`import type {
  KnowledgeBaseView, KnowledgeRetrievalHit, KnowledgeSourceView,
} from '../knowledge-types.ts'`, `import type {
  KnowledgeBaseConfig, KnowledgeBaseView, KnowledgeRetrievalHit, KnowledgeSourceView,
} from '../knowledge-types.ts'`)

s = s.replace(`import {
  IconCircleAlert, IconCopy, IconFileText, IconFlaskConical, IconFolder, IconLink2,
  IconMoreHorizontal, IconPlus, IconRefreshCw, IconStickyNote, IconZap,
} from './cherry-icons.tsx'`, `import {
  IconCircleAlert, IconCopy, IconFileText, IconFlaskConical, IconFolder, IconLink2,
  IconMoreHorizontal, IconPlus, IconRefreshCw, IconSlidersHorizontal, IconStickyNote, IconZap,
} from './cherry-icons.tsx'`)

s = s.replace(`  const [recallOpen, setRecallOpen] = useState(false)`, `  const [recallOpen, setRecallOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [config, setConfig] = useState<KnowledgeBaseConfig | null>(null)
  const [configDraft, setConfigDraft] = useState<KnowledgeBaseConfig | null>(null)`)

s = s.replace(`    void knowledge.listSources(selectedId).then(result => {
      if (!active || !result.ok) return
      setSources(result.value.sources)
    })
    return () => { active = false }
  }, [knowledgeReady, knowledge, selectedId])`, `    void knowledge.listSources(selectedId).then(result => {
      if (!active || !result.ok) return
      setSources(result.value.sources)
    })
    void knowledge.getBaseConfig(selectedId).then(result => {
      if (!active || !result.ok) return
      setConfig(result.value)
      setConfigDraft(result.value)
    })
    return () => { active = false }
  }, [knowledgeReady, knowledge, selectedId])`)

s = s.replace(`  const openAdd = (type: AddSourceType): void => {`, `  const saveConfig = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '' || configDraft === null) return
    const result = await knowledge.setBaseConfig(selectedId, configDraft)
    if (!result.ok) { setError(result.error.message); return }
    setConfig(result.value)
    setConfigDraft(result.value)
    setNotice('知识库设置已保存')
  }

  const openAdd = (type: AddSourceType): void => {`)

s = s.replace(`                <div className={css.detailHeaderActions}>
                  <button type="button" className={css.ghostButton} onClick={() => { setRecallOpen(true) }}>
                    <IconFlaskConical size={14} />
                    <span>召回测试</span>
                  </button>`, `                <div className={css.detailHeaderActions}>
                  <button type="button" className={css.ghostButton} onClick={() => { setRecallOpen(true) }}>
                    <IconFlaskConical size={14} />
                    <span>召回测试</span>
                  </button>
                  <button
                    type="button"
                    className={css.ghostButton}
                    title="知识库设置"
                    aria-label="知识库设置"
                    onClick={() => { setConfigOpen(true) }}
                  >
                    <IconSlidersHorizontal size={14} />
                  </button>`)

const drawer = `      {configOpen && configDraft !== null && (
        <PanelShell title="知识库设置" onClose={() => { setConfigOpen(false) }}>
          <div className={css.ragBody}>
            <div className={css.ragSection}>
              <div className={css.ragTitle}>嵌入模型</div>
              <div className={css.ragReadonly}>
                {selected?.embedding.providerId === 'local-hash'
                  ? '本地 Hash Embedding（离线可用）'
                  : \`\${selected?.embedding.providerId ?? ''} · \${selected?.embedding.model ?? ''}\`}
              </div>
            </div>
            <div className={css.ragSection}>
              <div className={css.ragTitle}>Top K</div>
              <div className={css.ragSliderRow}>
                <input
                  type="range"
                  className={css.ragSlider}
                  min={1}
                  max={50}
                  step={1}
                  value={configDraft.topK}
                  onChange={event => { setConfigDraft(current => current === null ? current : { ...current, topK: Number(event.target.value) }) }}
                />
                <input
                  type="number"
                  className={css.ragNumber}
                  min={1}
                  max={50}
                  value={configDraft.topK}
                  onChange={event => {
                    const value = Math.min(50, Math.max(1, Number(event.target.value) || 1))
                    setConfigDraft(current => current === null ? current : { ...current, topK: value })
                  }}
                />
              </div>
            </div>
            <div className={css.ragSection}>
              <div className={css.ragTitle}>高级设置</div>
              <div className={css.ragField}>
                <label className={css.ragLabel} htmlFor="cc-rag-chunk-size">分段大小（tokens）</label>
                <input
                  id="cc-rag-chunk-size"
                  type="number"
                  className={css.ragNumberFull}
                  min={100}
                  max={8000}
                  step={50}
                  value={configDraft.chunkSize}
                  onChange={event => {
                    const value = Math.min(8000, Math.max(100, Number(event.target.value) || 100))
                    setConfigDraft(current => current === null ? current : { ...current, chunkSize: value })
                  }}
                />
              </div>
              <div className={css.ragField}>
                <label className={css.ragLabel} htmlFor="cc-rag-overlap">重叠大小（tokens）</label>
                <input
                  id="cc-rag-overlap"
                  type="number"
                  className={css.ragNumberFull}
                  min={0}
                  max={4000}
                  step={10}
                  value={configDraft.chunkOverlap}
                  onChange={event => {
                    const value = Math.min(4000, Math.max(0, Number(event.target.value) || 0))
                    setConfigDraft(current => current === null ? current : { ...current, chunkOverlap: value })
                  }}
                />
              </div>
              <div className={css.ragHint}>分块设置的修改只针对新添加的内容有效</div>
            </div>
          </div>
          <div className={css.ragFooter}>
            <button
              type="button"
              className={css.btn}
              disabled={config === null || (configDraft.chunkSize === config.chunkSize && configDraft.chunkOverlap === config.chunkOverlap && configDraft.topK === config.topK)}
              onClick={() => { setConfigDraft(config) }}
            >
              恢复默认
            </button>
            <button type="button" className={\`\${css.btn} \${css.btnPrimary}\`} onClick={() => { void saveConfig() }}>保存</button>
          </div>
        </PanelShell>
      )}

      {recallOpen && (`

s = s.replace(`      {recallOpen && (`, drawer)

writeFileSync(p, s)
console.log('knowledge workspace patched')
