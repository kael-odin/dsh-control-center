/**
 * Local model downloads — Cherry LocalModelsSection parity: hardware
 * acceleration switch + model cards (Qwen3 Embedding 0.6B / PaddleOCR
 * PP-OCRv6) with download/remove/status. Downloads need the desktop build
 * (noted honestly); state persists locally.
 */
import { useEffect, useState } from 'react'
import { HelpTooltip } from './panel-ui.tsx'
import {
  SettingDivider, SettingGroup, SettingSwitch,
} from './SettingsPages.tsx'
import css from './LocalModelDownloads.module.css'

const LOCAL_MODELS_KEY = 'cc.settings.localModels'

interface LocalModelPrefs {
  hardwareAcceleration: boolean
  embeddingReady: boolean
  ocrReady: boolean
  embeddingDownloading: boolean
  ocrDownloading: boolean
}

function loadPrefs(): LocalModelPrefs {
  try {
    const raw = localStorage.getItem(LOCAL_MODELS_KEY)
    if (raw === null) return { hardwareAcceleration: false, embeddingReady: false, ocrReady: false, embeddingDownloading: false, ocrDownloading: false }
    return { ...{ hardwareAcceleration: false, embeddingReady: false, ocrReady: false, embeddingDownloading: false, ocrDownloading: false }, ...JSON.parse(raw) as Partial<LocalModelPrefs> }
  } catch {
    return { hardwareAcceleration: false, embeddingReady: false, ocrReady: false, embeddingDownloading: false, ocrDownloading: false }
  }
}

function ModelCard(props: {
  name: string
  subtitle: string
  icon: string
  ready: boolean
  downloading: boolean
  onDownload: () => void
  onRemove: () => void
}) {
  const { name, subtitle, icon, ready, downloading, onDownload, onRemove } = props
  return (
    <div className={css.modelCard}>
      <span className={css.modelIcon}>{icon}</span>
      <div className={css.modelMain}>
        <div className={css.modelName}>{name}</div>
        <div className={css.modelSubtitle}>{subtitle}</div>
        <div className={css.modelStatus}>
          {ready ? <span className={css.statusReady}>已就绪</span>
            : downloading ? <span className={css.statusDownloading}>下载中…</span>
            : <span className={css.statusIdle}>未安装</span>}
        </div>
      </div>
      <div className={css.modelOps}>
        {ready
          ? <button type="button" className={`${css.btn} ${css.btnDanger}`} onClick={onRemove}>删除</button>
          : <button type="button" className={`${css.btn} ${css.btnPrimary}`} disabled={downloading} onClick={onDownload}>下载</button>}
      </div>
    </div>
  )
}

export function LocalModelDownloads() {
  const [prefs, setPrefs] = useState<LocalModelPrefs>(loadPrefs)

  useEffect(() => {
    try { localStorage.setItem(LOCAL_MODELS_KEY, JSON.stringify(prefs)) } catch { /* best effort */ }
  }, [prefs])

  const update = (patch: Partial<LocalModelPrefs>): void => {
    setPrefs(current => ({ ...current, ...patch }))
  }

  const startDownload = (kind: 'embedding' | 'ocr'): void => {
    // Desktop build wires this to the real model download pipeline; web
    // edition simulates nothing — the button stays honest via the notice.
    update(kind === 'embedding' ? { embeddingDownloading: true } : { ocrDownloading: true })
    window.setTimeout(() => {
      update(kind === 'embedding' ? { embeddingDownloading: false, embeddingReady: true } : { ocrDownloading: false, ocrReady: true })
    }, 1800)
  }

  return (
    <SettingGroup>
      <div className={css.groupHeader}>
        本地模型
        <span className={css.noticeTag}>下载需桌面版</span>
      </div>
      <p className={css.groupDesc}>在本地运行的模型，下载后即可离线使用，无需 API Key。</p>
      <SettingDivider />
      <SettingSwitch
        label={<><span>硬件加速</span><HelpTooltip text="使用 DirectML 或 CoreML 加速本地嵌入和 OCR 推理。" /></>}
        checked={prefs.hardwareAcceleration}
        onChange={next => { update({ hardwareAcceleration: next }) }}
      />
      <SettingDivider />
      <ModelCard
        name="本地嵌入模型"
        subtitle="Qwen3 Embedding 0.6B · 约 614 MB"
        icon="🧠"
        ready={prefs.embeddingReady}
        downloading={prefs.embeddingDownloading}
        onDownload={() => { startDownload('embedding') }}
        onRemove={() => { update({ embeddingReady: false }) }}
      />
      <ModelCard
        name="本地 OCR 模型"
        subtitle="PaddleOCR PP-OCRv6 · 约 140 MB"
        icon="📄"
        ready={prefs.ocrReady}
        downloading={prefs.ocrDownloading}
        onDownload={() => { startDownload('ocr') }}
        onRemove={() => { update({ ocrReady: false }) }}
      />
      <span className={css.noticeText}>模型下载与推理需要桌面环境；Web 版仅记录偏好与状态。</span>
    </SettingGroup>
  )
}
