/**
 * Skills catalog section component.
 *
 * Cherry-style skills management UI over the controlCenterSkills Remote service.
 * Displays installed skills in a card grid with search, enable/disable, and uninstall actions.
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
  update(params: { skillId: string; dto: { isGlobalEnabled: boolean } }): Promise<RemoteResult<InstalledSkill>>
  uninstall(params: { skillId: string }): Promise<RemoteResult<{ absent: true }>>
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
      setError('Skills service not available')
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
      setError(err instanceof Error ? err.message : 'Failed to load skills')
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
        const result = await skillsService.update({
          skillId,
          dto: { isGlobalEnabled: !currentEnabled }
        })
        if (!result.ok) throw new Error(result.error.message)
        await loadSkills()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update skill')
      }
    },
    [skillsService, loadSkills]
  )

  const handleUninstall = useCallback(
    async (skillId: string, skillName: string) => {
      if (!skillsService) return
      if (!window.confirm(`确定要卸载 "${skillName}" 吗？`)) return

      try {
        const result = await skillsService.uninstall({ skillId })
        if (!result.ok) throw new Error(result.error.message)
        await loadSkills()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to uninstall skill')
      }
    },
    [skillsService, loadSkills]
  )

  return (
    <div className={css.root}>
      <div className={css.header}>
        <div className={css.headerLeft}>
          <h1 className={css.title}>Skills</h1>
          <p className={css.description}>管理已安装的 Skills，启用或禁用功能</p>
        </div>
        <div className={css.headerActions}>
          <button
            type="button"
            className={css.secondaryButton}
            onClick={() => alert('Market功能开发中')}
            disabled
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M14 7H9V2C9 1.45 8.55 1 8 1C7.45 1 7 1.45 7 2V7H2C1.45 7 1 7.45 1 8C1 8.55 1.45 9 2 9H7V14C7 14.55 7.45 15 8 15C8.55 15 9 14.55 9 14V9H14C14.55 9 15 8.55 15 8C15 7.45 14.55 7 14 7Z"
                fill="currentColor"
              />
            </svg>
            从市场安装
          </button>
          <button
            type="button"
            className={css.primaryButton}
            onClick={() => alert('本地安装功能开发中')}
            disabled
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M14 7H9V2C9 1.45 8.55 1 8 1C7.45 1 7 1.45 7 2V7H2C1.45 7 1 7.45 1 8C1 8.55 1.45 9 2 9H7V14C7 14.55 7.45 15 8 15C8.55 15 9 14.55 9 14V9H14C14.55 9 15 8.55 15 8C15 7.45 14.55 7 14 7Z"
                fill="currentColor"
              />
            </svg>
            从本地安装
          </button>
        </div>
      </div>

      <div className={css.searchRow}>
        <input
          type="text"
          className={css.searchInput}
          placeholder="搜索 Skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={css.content}>
        {loading ? (
          <div className={css.loading}>加载中...</div>
        ) : error ? (
          <div className={css.error}>
            <div className={css.emptyTitle}>加载失败</div>
            <div className={css.emptyDescription}>{error}</div>
            <button className={css.secondaryButton} onClick={() => loadSkills()}>
              重试
            </button>
          </div>
        ) : skills.length === 0 ? (
          <div className={css.empty}>
            <svg className={css.emptyIcon} viewBox="0 0 64 64" fill="none">
              <path
                d="M32 8L8 20V36C8 46.4 17.2 56 32 56C46.8 56 56 46.4 56 36V20L32 8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 32C35.3137 32 38 29.3137 38 26C38 22.6863 35.3137 20 32 20C28.6863 20 26 22.6863 26 26C26 29.3137 28.6863 32 32 32Z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div className={css.emptyTitle}>暂无已安装的 Skills</div>
            <div className={css.emptyDescription}>
              {search ? '没有找到匹配的 Skills' : '点击上方按钮安装新的 Skill'}
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
                      className={css.iconButton}
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
                      className={css.iconButton}
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
                        <span className={css.enabledBadge}>已启用</span>
                      ) : (
                        <span className={css.disabledBadge}>未启用</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
