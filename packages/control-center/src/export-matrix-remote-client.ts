import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'

export const exportMatrixRemote = bindTypertRemote(null as unknown as { ctx: unknown }, 'controlCenterExport') as unknown as {
  descriptors: unknown[]
}
