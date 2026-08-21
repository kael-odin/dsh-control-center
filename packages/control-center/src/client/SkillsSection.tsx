/**
 * Skills catalog section component.
 *
 * Cherry-style skills management UI over the controlCenterSkills Remote service.
 * Displays installed skills in a card grid with search, enable/disable, and uninstall
 * actions. Online search installs from the host's skill marketplace (a real host
 * capability); local import needs a host filesystem path and is honestly gated.
 *
 * AGPL-3.0-only – adapted from Cherry Studio ResourceCatalog pattern for skills.
 */

import { useCallback, useEffect, useState } from 'react'
import type { InstalledSkill } from '../skills-types.ts'
import css from './SkillsSection.module.css'

/** Wire envelope of a strict-mode Typert remote call (same shape as translation-types). */
type RemoteResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }

interface SkillsService {
  list(params: { search?: string }): Promise<RemoteResult<InstalledSkill[]>>
  update(skillId: string, dto: { isGlobalEnabled: boolean }): Promise<RemoteResult<InstalledSkill>>
  uninstall(skillId: string): Promise<RemoteResult<{ absent: true }>>
}

export interface SkillsSectionProps {
  skills?: SkillsService
}

export function SkillsSection(props: SkillsSectionProps) {
  const { skills: skillsService } = props
  const [skills, setSkills] = useState<InstalledSkill[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSkills = useCallback(async () => {
    if (!skillsService) {
      setError('技能服务不可用')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const params = search ? { search } : {}
      const result = await skillsService.list(params)
      if (!result.ok) throw new Error(result.error.message)
      setSkills(result.value)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载技能失败')
    } finally {
      setLoading(false)
    }
  }, [skillsService, search])

  useEffect(() => {
    loadSkills()
  }, [loadSkills])

  const handleToggleEnable = useCallback(
    async (skillId: string, currentEnabled: boolean) => {
      if (!skillsService) return
      try {
        const result = await skillsService.update(skillId, { isGlobalEnabled: !currentEnabled })
        if (!result.ok) throw new Error(result.error.message)
        await loadSkills()
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新技能失败')
      }
    },
    [skillsService, loadSkills]
  )

  const handleUninstall = useCallback(
    async (skillId: string, skillName: string) => {
      if (!skillsService) return
      if (!window.confirm(`确定要卸载 "${skillName}" 吗？`)) return

      try {
        const result = await skillsService.uninstall(skillId)
        if (!result.ok) throw new Error(result.error.message)
        await loadSkills()
      } catch (err) {
        setError(err instanceof Error ? err.message : '卸载技能失败')
      }
    },
    [skillsService, loadSkills]
  )

  return (
    <div className="cc-settings-column">
      <div>
        <h1 className="cc-page-title">技能</h1>
        <p className="cc-page-description">管理已安装的 Skills，启用或禁用功能</p>
      </div>

      <div className="cc-field-row">
        <span className="cc-field-label">添加技能</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            disabled
            title="当前平台不支持：技能市场搜索尚未接入宿主"
          >
            在线搜索
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled
            title="当前平台不支持：本地导入需要宿主文件系统路径"
          >
            本地导入
          </button>
        </div>
      </div>

      <div className={css.searchRow}>
        <input
          type="text"
          className={css.searchInput}
          placeholder="搜索已安装的 Skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="cc-loading">加载中...</div>
      ) : error ? (
        <div className="cc-notice-error">
          {error}
          <button type="button" className="cc-btn cc-btn-ghost" onClick={() => loadSkills()} style={{ marginLeft: 8 }}>
            重试
          </button>
        </div>
      ) : skills.length === 0 ? (
        <div className="cc-empty">
          <div className="cc-empty-title">暂无已安装的 Skills</div>
          <div className="cc-empty-description">
            {search ? '没有找到匹配的 Skills' : '安装能力在当前平台暂不可用'}
          </div>
        </div>
      ) : (
        <div className={css.grid}>
          {skills.map((skill) => (
            <div key={skill.id} className={css.card}>
              <div className={css.cardHeader}>
                <h3 className={css.cardTitle}>{skill.name}</h3>
                <div className={css.cardActions}>
                  <button
                    type="button"
                    className="cc-icon-btn"
                    title={skill.isGlobalEnabled ? '禁用' : '启用'}
                    onClick={() => handleToggleEnable(skill.id, skill.isGlobalEnabled)}
                  >
                    {skill.isGlobalEnabled ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M8 2C4.7 2 2 4.7 2 8C2 11.3 4.7 14 8 14C11.3 14 14 11.3 14 8C14 4.7 11.3 2 8 2ZM6.5 11L3 7.5L4.4 6.1L6.5 8.2L11.6 3.1L13 4.5L6.5 11Z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    className="cc-icon-btn"
                    title="卸载"
                    onClick={() => handleUninstall(skill.id, skill.name)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 5H13L12 14H4L3 5ZM6 2H10V3H6V2ZM7 7V12H8V7H7ZM9 7V12H10V7H9Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {skill.description && <p className={css.cardDescription}>{skill.description}</p>}

              <div className={css.cardMeta}>
                {skill.author && (
                  <span className={css.cardMetaItem}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M2 10C2 8.34315 3.34315 7 5 7H7C8.65685 7 10 8.34315 10 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    {skill.author}
                  </span>
                )}
                {skill.version && (
                  <span className={css.cardMetaItem}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M6 2L3 4V8L6 10L9 8V4L6 2Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    v{skill.version}
                  </span>
                )}
                {skill.source && (
                  <span className={css.cardMetaItem}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    {skill.source}
                  </span>
                )}
              </div>

              {(skill.sourceTags.length > 0 || skill.isGlobalEnabled) && (
                <div className={css.cardFooter}>
                  <div className={css.cardTags}>
                    {skill.sourceTags.slice(0, 3).map((tag) => (
                      <span key={tag} className={css.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div>
                    {skill.isGlobalEnabled ? (
                      <span className="cc-badge-enabled">已启用</span>
                    ) : (
                      <span className="cc-badge-disabled">未启用</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
