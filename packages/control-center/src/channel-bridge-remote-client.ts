import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'
import type { ChannelBridgeStatus } from './channel-bridge.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'status', parameters: [] },
  { method: 'getLog', parameters: ['channelId', 'lines'] },
  { method: 'wechatLoginState', parameters: ['channelId'] },
  { method: 'wechatQrBegin', parameters: ['channelId'] },
  { method: 'wechatQrPoll', parameters: ['channelId'] },
]

/** Client descriptor contribution for the Control Center channel bridge. */
const channelBridgeRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterChannelBridge/${method}`,
    service: 'controlCenterChannelBridge',
    namespace: 'controlCenterChannelBridge',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default channelBridgeRemote

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterChannelBridge: {
      status(): Promise<{ ok: true; value: ChannelBridgeStatus[] } | { ok: false; error: { code: string; message: string; details: object } }>
      getLog(channelId: string, lines?: number): Promise<{ ok: true; value: string[] } | { ok: false; error: { code: string; message: string; details: object } }>
      wechatLoginState(channelId: string): Promise<{ ok: true; value: { loggedIn: boolean; userId?: string | undefined } } | { ok: false; error: { code: string; message: string; details: object } }>
      wechatQrBegin(channelId: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      wechatQrPoll(channelId: string): Promise<{ ok: true; value: WechatLoginStateView } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}

/** Wire shape of one channel's QR login flow. */
export interface WechatLoginStateView {
  phase: 'idle' | 'pending' | 'scaned' | 'confirmed' | 'expired' | 'error'
  qrContent?: string | undefined
  userId?: string | undefined
  error?: string | undefined
}
