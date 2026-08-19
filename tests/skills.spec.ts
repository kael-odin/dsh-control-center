/**
 * Skills service contract tests.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { rmSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { SkillsService } from '../packages/control-center/src/skills'

const TEST_DSH_HOME = join(process.cwd(), '.test-skills')

describe('Skills service', () => {
  let ctx: Context
  let service: SkillsService

  beforeEach(() => {
    if (existsSync(TEST_DSH_HOME)) {
      rmSync(TEST_DSH_HOME, { recursive: true, force: true })
    }
    mkdirSync(TEST_DSH_HOME, { recursive: true })

    ctx = new Context()
    service = new SkillsService(ctx, { dshHome: TEST_DSH_HOME })
  })

  afterEach(() => {
    try {
      service[Symbol.dispose]()
    } catch {
      // Already disposed
    }
    if (existsSync(TEST_DSH_HOME)) {
      rmSync(TEST_DSH_HOME, { recursive: true, force: true })
    }
  })

  describe('list', () => {
    it('returns empty array when no skills installed', async () => {
      const skills = await service.list()
      expect(skills).toEqual([])
    })

    it('returns installed skills', async () => {
      // Create a test skill directory
      const skillDir = join(TEST_DSH_HOME, 'test-skill')
      mkdirSync(skillDir, { recursive: true })
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: Test Skill
description: A test skill for testing
author: Test Author
version: 1.0.0
---

# Test Skill

This is a test skill.
`
      )

      await service.install({ source: 'directory', path: skillDir })
      const skills = await service.list()

      expect(skills).toHaveLength(1)
      expect(skills[0].name).toBe('Test Skill')
      expect(skills[0].description).toBe('A test skill for testing')
      expect(skills[0].author).toBe('Test Author')
      expect(skills[0].version).toBe('1.0.0')
      expect(skills[0].isGlobalEnabled).toBe(false)
    })

    it('filters skills by search query', async () => {
      const skillDir1 = join(TEST_DSH_HOME, 'skill-one')
      mkdirSync(skillDir1, { recursive: true })
      await writeFile(join(skillDir1, 'SKILL.md'), '---\nname: Skill One\n---\n# Skill One')

      const skillDir2 = join(TEST_DSH_HOME, 'skill-two')
      mkdirSync(skillDir2, { recursive: true })
      await writeFile(join(skillDir2, 'SKILL.md'), '---\nname: Skill Two\n---\n# Skill Two')

      await service.install({ source: 'directory', path: skillDir1 })
      await service.install({ source: 'directory', path: skillDir2 })

      const filtered = await service.list({ search: 'One' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Skill One')
    })
  })

  describe('install', () => {
    it('installs skill from directory', async () => {
      const skillDir = join(TEST_DSH_HOME, 'my-skill')
      mkdirSync(skillDir, { recursive: true })
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: My Skill
description: A skill
---
# My Skill
`
      )

      const installed = await service.install({ source: 'directory', path: skillDir })

      expect(installed.name).toBe('My Skill')
      expect(installed.description).toBe('A skill')
      expect(installed.source).toBe('directory')
      expect(installed.isGlobalEnabled).toBe(false)
    })

    it('rejects directory without SKILL.md', async () => {
      const skillDir = join(TEST_DSH_HOME, 'invalid-skill')
      mkdirSync(skillDir, { recursive: true })

      await expect(service.install({ source: 'directory', path: skillDir })).rejects.toThrow(
        'SKILL.md not found'
      )
    })

    it('rejects duplicate folder name', async () => {
      const skillDir = join(TEST_DSH_HOME, 'duplicate-skill')
      mkdirSync(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: Duplicate\n---\n')

      await service.install({ source: 'directory', path: skillDir })

      await expect(service.install({ source: 'directory', path: skillDir })).rejects.toThrow(
        'already installed'
      )
    })
  })

  describe('getById', () => {
    it('returns null for non-existent skill', async () => {
      const skill = await service.getById('nonexistent')
      expect(skill).toBeNull()
    })

    it('returns skill by id', async () => {
      const skillDir = join(TEST_DSH_HOME, 'test-skill')
      mkdirSync(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: Test\n---\n')

      const installed = await service.install({ source: 'directory', path: skillDir })
      const retrieved = await service.getById(installed.id)

      expect(retrieved).not.toBeNull()
      expect(retrieved!.id).toBe(installed.id)
      expect(retrieved!.name).toBe('Test')
    })
  })

  describe('update', () => {
    it('updates skill enable status', async () => {
      const skillDir = join(TEST_DSH_HOME, 'test-skill')
      mkdirSync(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: Test\n---\n')

      const installed = await service.install({ source: 'directory', path: skillDir })
      expect(installed.isGlobalEnabled).toBe(false)

      const updated = await service.update(installed.id, { isGlobalEnabled: true })
      expect(updated.isGlobalEnabled).toBe(true)
    })

    it('rejects update for non-existent skill', async () => {
      await expect(service.update('nonexistent', { isGlobalEnabled: true })).rejects.toThrow(
        'Skill not found'
      )
    })
  })

  describe('uninstall', () => {
    it('removes skill from catalog and filesystem', async () => {
      const skillDir = join(TEST_DSH_HOME, 'test-skill')
      mkdirSync(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: Test\n---\n')

      const installed = await service.install({ source: 'directory', path: skillDir })
      const skillsDir = join(TEST_DSH_HOME, 'skills', installed.folderName)
      expect(existsSync(skillsDir)).toBe(true)

      await service.uninstall(installed.id)

      const retrieved = await service.getById(installed.id)
      expect(retrieved).toBeNull()
      expect(existsSync(skillsDir)).toBe(false)
    })

    it('rejects uninstall for non-existent skill', async () => {
      await expect(service.uninstall('nonexistent')).rejects.toThrow('Skill not found')
    })
  })

  describe('searchMarketplace', () => {
    it('returns empty results (stub)', async () => {
      const results = await service.searchMarketplace({ query: 'test' })
      expect(results.skills).toEqual([])
      expect(results.total).toBe(0)
    })
  })
})
