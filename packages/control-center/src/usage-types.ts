/**
 * Usage Analytics types (shared between Host and Client).
 */

export interface UsageOverview {
  providers: number
  enabledModels: number
  totalModels: number
  repos: number
  skills: number
  mcpServers: number
  mcpActive: number
  translationHistory: number
  knowledgeBases: number
  knowledgeSources: number
  collectedAt: string
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterUsage: {
      getOverview(): Promise<{ ok: true; value: UsageOverview } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}

export {}
