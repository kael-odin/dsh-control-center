/**
 * Built-in provider presets — Cherry Studio provider catalog parity
 * (providers.json endpointConfigs). All presets are OpenAI-compatible
 * endpoints unless noted; provider-specific IAM/OAuth flows (Vertex, Bedrock,
 * Azure IAM) are represented by their API-key/baseURL form.
 *
 * AGPL-3.0-only — adapted from Cherry Studio's provider registry
 * (packages/provider-registry/data/providers.json; website/apiUrl from
 * metadata.website.official / .apiKey).
 */

import type { ProviderType } from '../provider-types.ts'

export interface ProviderPreset {
  /** Stable preset id. */
  id: string
  /** Display name (zh-CN, Cherry label). */
  name: string
  /** API shape used for connection tests and discovery. */
  type: ProviderType
  /** Base URL prefill; '' means the user supplies it. */
  baseURL: string
  /** Preset group for the picker. */
  group: 'domestic' | 'international' | 'local' | 'custom'
  /** Official website (Cherry registry metadata.website.official). */
  website: string
  /** Where to apply for an API key, when the registry names one. */
  apiUrl?: string
}

export const PROVIDER_PRESETS: readonly ProviderPreset[] = [
  // ----- 国内平台 (Domestic) ----- 29 providers
  { id: 'zhipu', name: '智谱开放平台 (ZhiPu)', type: 'openai-compatible', baseURL: 'https://open.bigmodel.cn/api/paas/v4', group: 'domestic' , website: 'https://open.bigmodel.cn/', apiUrl: 'https://open.bigmodel.cn/apikey/platform' },
  { id: 'deepseek', name: '深度求索 (DeepSeek)', type: 'deepseek', baseURL: 'https://api.deepseek.com/v1', group: 'domestic' , website: 'https://deepseek.com/', apiUrl: 'https://platform.deepseek.com/api_keys' },
  { id: 'moonshot', name: '月之暗面 (Moonshot AI)', type: 'openai-compatible', baseURL: 'https://api.moonshot.cn/v1', group: 'domestic' , website: 'https://www.moonshot.cn/', apiUrl: 'https://platform.moonshot.cn/console/api-keys' },
  { id: 'baichuan', name: '百川 (Baichuan)', type: 'openai-compatible', baseURL: 'https://api.baichuan-ai.com/v1', group: 'domestic' , website: 'https://www.baichuan-ai.com/', apiUrl: 'https://platform.baichuan-ai.com/console/apikey' },
  { id: 'dashscope', name: '阿里云百炼 (DashScope)', type: 'openai-compatible', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', group: 'domestic' , website: 'https://www.aliyun.com/product/bailian', apiUrl: 'https://bailian.console.aliyun.com/?tab=model#/api-key' },
  { id: 'stepfun', name: '阶跃星辰 (StepFun)', type: 'openai-compatible', baseURL: 'https://api.stepfun.com/v1', group: 'domestic' , website: 'https://platform.stepfun.com/', apiUrl: 'https://platform.stepfun.com/interface-key' },
  { id: 'doubao', name: '火山引擎 (Doubao)', type: 'openai-compatible', baseURL: 'https://ark.cn-beijing.volces.com/api/v3', group: 'domestic' , website: 'https://console.volcengine.com/ark/', apiUrl: 'https://www.volcengine.com/experience/ark' },
  { id: 'minimax', name: 'MiniMax', type: 'openai-compatible', baseURL: 'https://api.minimaxi.com/v1', group: 'domestic' , website: 'https://platform.minimaxi.com/', apiUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key' },
  { id: 'silicon', name: '硅基流动 (Silicon)', type: 'openai-compatible', baseURL: 'https://api.siliconflow.cn/v1', group: 'domestic' , website: 'https://www.siliconflow.cn', apiUrl: 'https://cloud.siliconflow.cn/i/d1nTBKXU' },
  { id: 'aihubmix', name: 'AiHubMix', type: 'openai-compatible', baseURL: 'https://aihubmix.com/v1', group: 'domestic' , website: 'https://aihubmix.com', apiUrl: 'https://aihubmix.com' },
  { id: 'zai', name: 'Z.ai', type: 'openai-compatible', baseURL: 'https://api.z.ai/api/paas/v4', group: 'domestic' , website: 'https://z.ai', apiUrl: 'https://z.ai/manage-apikey/apikey-list' },
  { id: 'alayanew', name: 'Alaya NeW', type: 'openai-compatible', baseURL: 'https://deepseek.alayanew.com', group: 'domestic' , website: 'https://www.alayanew.com/', apiUrl: 'https://www.alayanew.com/' },
  { id: 'dmxapi', name: 'DMXAPI', type: 'openai-compatible', baseURL: 'https://www.dmxapi.cn', group: 'domestic' , website: 'https://www.dmxapi.cn/', apiUrl: 'https://www.dmxapi.cn/' },
  { id: 'aionly', name: '唯一AI (AIOnly)', type: 'openai-compatible', baseURL: 'https://api.aiionly.com', group: 'domestic' , website: 'https://www.aiionly.com', apiUrl: 'https://maas.aiionly.com/keyApi' },
  { id: 'burncloud', name: 'BurnCloud', type: 'openai-compatible', baseURL: 'https://ai.burncloud.com', group: 'domestic' , website: 'https://ai.burncloud.com/', apiUrl: 'https://ai.burncloud.com/token' },
  { id: '302ai', name: '302.AI', type: 'openai-compatible', baseURL: 'https://api.302.ai', group: 'domestic' , website: 'https://302.ai', apiUrl: 'https://dash.302.ai/apis/list' },
  { id: 'lanyun', name: '蓝耘科技 (LANYUN)', type: 'openai-compatible', baseURL: 'https://maas-api.lanyun.net', group: 'domestic' , website: 'https://maas.lanyun.net', apiUrl: 'https://maas.lanyun.net/#/system/apiKey' },
  { id: 'ph8', name: 'PH8', type: 'openai-compatible', baseURL: 'https://ph8.co', group: 'domestic' , website: 'https://ph8.co', apiUrl: 'https://ph8.co/apiKey' },
  { id: 'sophnet', name: 'SophNet', type: 'openai-compatible', baseURL: 'https://www.sophnet.com/api/open-apis/v1', group: 'domestic' , website: 'https://sophnet.com', apiUrl: 'https://sophnet.com/#/project/key' },
  { id: 'ppio', name: 'PPIO 派欧云', type: 'openai-compatible', baseURL: 'https://api.ppinfra.com/v3/openai', group: 'domestic' , website: 'https://ppio.com/', apiUrl: 'https://ppio.com/settings/key-management' },
  { id: 'qiniu', name: '七牛云 AI 推理 (Qiniu)', type: 'openai-compatible', baseURL: 'https://api.qnaigc.com', group: 'domestic' , website: 'https://qiniu.com', apiUrl: 'https://portal.qiniu.com/ai-inference/api-key' },
  { id: 'modelscope', name: 'ModelScope 魔搭', type: 'openai-compatible', baseURL: 'https://api-inference.modelscope.cn/v1', group: 'domestic' , website: 'https://modelscope.cn', apiUrl: 'https://modelscope.cn/my/myaccesstoken' },
  { id: 'xirang', name: '天翼云息壤 (XiRang)', type: 'openai-compatible', baseURL: 'https://wishub-x1.ctyun.cn', group: 'domestic' , website: 'https://www.ctyun.cn', apiUrl: 'https://huiju.ctyun.cn/service/serviceGroup' },
  { id: 'tokenhub', name: 'TokenHub', type: 'openai-compatible', baseURL: 'https://tokenhub.tencentmaas.com/v1', group: 'domestic' , website: 'https://cloud.tencent.com/product/tokenhub', apiUrl: 'https://console.cloud.tencent.com/tokenhub/inference' },
  { id: 'baidu-cloud', name: '百度云千帆 (Baidu Cloud)', type: 'openai-compatible', baseURL: 'https://qianfan.baidubce.com/v2', group: 'domestic' , website: 'https://cloud.baidu.com/', apiUrl: 'https://console.bce.baidu.com/iam/#/iam/apikey/list' },
  { id: 'longcat', name: '龙猫 (LongCat)', type: 'openai-compatible', baseURL: 'https://api.longcat.chat', group: 'domestic' , website: 'https://longcat.chat', apiUrl: 'https://longcat.chat/platform/api_keys' },
  { id: 'mimo', name: '小米 MiMo', type: 'openai-compatible', baseURL: 'https://api.xiaomimimo.com', group: 'domestic' , website: 'https://mimo.mi.com/', apiUrl: 'https://platform.xiaomimimo.com/' },
  { id: 'radeon-cloud', name: 'AMD GPU Cloud', type: 'openai-compatible', baseURL: 'https://developer.amd.com.cn/radeon/v1', group: 'domestic' , website: 'https://developer.amd.com.cn/radeon/', apiUrl: 'https://developer.amd.com.cn/radeon/tokenfactory?source=cherry-studio' },
  { id: 'ocoolai', name: 'ocoolAI', type: 'openai-compatible', baseURL: 'https://api.ocoolai.com', group: 'domestic' , website: 'https://one.ocoolai.com/', apiUrl: 'https://one.ocoolai.com/token' },

  // ----- 国际平台 (International) ----- 28 providers
  { id: 'openai', name: 'OpenAI', type: 'openai', baseURL: 'https://api.openai.com/v1', group: 'international' , website: 'https://openai.com/', apiUrl: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', name: 'Anthropic', type: 'anthropic', baseURL: 'https://api.anthropic.com/v1', group: 'international' , website: 'https://anthropic.com/', apiUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'gemini', name: 'Gemini', type: 'google', baseURL: 'https://generativelanguage.googleapis.com/v1', group: 'international' , website: 'https://gemini.google.com/', apiUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'vertexai', name: 'VertexAI', type: 'google', baseURL: 'https://<region>-aiplatform.googleapis.com', group: 'international' , website: 'https://cloud.google.com/vertex-ai', apiUrl: 'https://console.cloud.google.com/apis/credentials' },
  { id: 'openrouter', name: 'OpenRouter', type: 'openai-compatible', baseURL: 'https://openrouter.ai/api/v1', group: 'international' , website: 'https://openrouter.ai/', apiUrl: 'https://openrouter.ai/settings/keys' },
  { id: 'opencode', name: 'OpenCode Go', type: 'openai-compatible', baseURL: 'https://opencode.ai/zen/go/v1', group: 'international' , website: 'https://opencode.ai', apiUrl: 'https://opencode.ai/auth' },
  { id: 'azure-openai', name: 'Azure OpenAI', type: 'azure', baseURL: 'https://<resource>.openai.azure.com', group: 'international' , website: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service', apiUrl: 'https://portal.azure.com/' },
  { id: 'copilot', name: 'GitHub Copilot', type: 'openai-compatible', baseURL: 'https://api.githubcopilot.com', group: 'international' , website: 'https://github.com/features/copilot' },
  { id: 'groq', name: 'Groq', type: 'openai-compatible', baseURL: 'https://api.groq.com/openai', group: 'international' , website: 'https://groq.com/', apiUrl: 'https://console.groq.com/keys' },
  { id: 'together', name: 'Together', type: 'openai-compatible', baseURL: 'https://api.together.ai', group: 'international' , website: 'https://www.together.ai', apiUrl: 'https://api.together.ai/settings/projects/~current/api-keys' },
  { id: 'fireworks', name: 'Fireworks', type: 'openai-compatible', baseURL: 'https://api.fireworks.ai/inference', group: 'international' , website: 'https://fireworks.ai/', apiUrl: 'https://fireworks.ai/account/api-keys' },
  { id: 'nvidia', name: 'NVIDIA', type: 'openai-compatible', baseURL: 'https://integrate.api.nvidia.com', group: 'international' , website: 'https://build.nvidia.com/explore/discover', apiUrl: 'https://build.nvidia.com/meta/llama-3_1-405b-instruct' },
  { id: 'grok', name: 'Grok', type: 'openai-compatible', baseURL: 'https://api.x.ai', group: 'international' , website: 'https://x.ai/' },
  { id: 'mistral', name: 'Mistral', type: 'openai-compatible', baseURL: 'https://api.mistral.ai', group: 'international' , website: 'https://mistral.ai', apiUrl: 'https://console.mistral.ai/api-keys/' },
  { id: 'jina', name: 'Jina', type: 'openai-compatible', baseURL: 'https://api.jina.ai', group: 'international' , website: 'https://jina.ai', apiUrl: 'https://jina.ai/' },
  { id: 'perplexity', name: 'Perplexity', type: 'openai-compatible', baseURL: 'https://api.perplexity.ai', group: 'international' , website: 'https://perplexity.ai/', apiUrl: 'https://www.perplexity.ai/settings/api' },
  { id: 'poe', name: 'Poe', type: 'openai-compatible', baseURL: 'https://api.poe.com/v1', group: 'international' , website: 'https://poe.com/', apiUrl: 'https://poe.com/api/keys' },
  { id: 'huggingface', name: 'Hugging Face', type: 'openai-compatible', baseURL: 'https://router.huggingface.co/v1', group: 'international' , website: 'https://huggingface.co/', apiUrl: 'https://huggingface.co/settings/tokens' },
  { id: 'gateway', name: 'Vercel AI Gateway', type: 'openai-compatible', baseURL: 'https://ai-gateway.vercel.sh/v1/ai', group: 'international' , website: 'https://vercel.com/ai-gateway', apiUrl: 'https://vercel.com/' },
  { id: 'cerebras', name: 'Cerebras AI', type: 'openai-compatible', baseURL: 'https://api.cerebras.ai/v1', group: 'international' , website: 'https://www.cerebras.ai', apiUrl: 'https://cloud.cerebras.ai' },
  { id: 'voyageai', name: 'Voyage AI', type: 'openai-compatible', baseURL: 'https://api.voyageai.com', group: 'international' , website: 'https://www.voyageai.com/', apiUrl: 'https://dashboard.voyageai.com/organization/api-keys' },
  { id: 'cherryin', name: 'CherryIN', type: 'openai-compatible', baseURL: 'https://open.cherryin.net', group: 'international' , website: 'https://open.cherryin.ai', apiUrl: 'https://open.cherryin.ai/console/token' },
  { id: 'claude-code', name: 'Claude Code', type: 'anthropic', baseURL: 'https://api.anthropic.com/v1', group: 'international' , website: 'https://www.anthropic.com/claude-code' },
  { id: 'openai-codex', name: 'OpenAI Codex', type: 'openai', baseURL: 'https://chatgpt.com/backend-api/codex', group: 'international' , website: 'https://openai.com/codex' },
  { id: 'grok-cli', name: 'Grok CLI', type: 'openai-compatible', baseURL: 'https://cli-chat-proxy.grok.com/v1', group: 'international' , website: 'https://x.ai' },
  { id: 'minimax-global', name: 'MiniMax Global', type: 'openai-compatible', baseURL: 'https://api.minimax.io/v1', group: 'international' , website: 'https://platform.minimax.io/', apiUrl: 'https://platform.minimax.io/user-center/basic-information/interface-key' },
  { id: 'aws-bedrock', name: 'AWS Bedrock', type: 'openai-compatible', baseURL: '', group: 'international' , website: 'https://aws.amazon.com/bedrock/', apiUrl: 'https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html' },

  // ----- 本地服务 (Local) ----- 5 providers
  { id: 'ollama', name: 'Ollama', type: 'ollama', baseURL: 'http://localhost:11434', group: 'local' , website: 'https://ollama.com/' },
  { id: 'new-api', name: 'New API', type: 'openai-compatible', baseURL: 'http://localhost:3000', group: 'local' , website: 'https://docs.newapi.pro/' },
  { id: 'lmstudio', name: 'LM Studio', type: 'openai-compatible', baseURL: 'http://localhost:1234/v1', group: 'local' , website: 'https://lmstudio.ai/' },
  { id: 'gpustack', name: 'GPUStack', type: 'openai-compatible', baseURL: '', group: 'local' , website: 'https://gpustack.ai/' },
  { id: 'ovms', name: 'Intel OVMS', type: 'openai-compatible', baseURL: 'http://localhost:8000/v3', group: 'local' , website: 'https://www.intel.com/content/www/us/en/developer/tools/openvino-toolkit/overview.html' },
]

export const PROVIDER_PRESET_GROUPS: ReadonlyArray<{ id: ProviderPreset['group']; label: string }> = [
  { id: 'domestic', label: '国内平台' },
  { id: 'international', label: '国际平台' },
  { id: 'local', label: '本地服务' },
]

/**
 * Preset ids the harness's pi-ai adapter ships as installed catalog routes. A
 * fresh pick of one of these routes is served by pi-ai's own catalog entry
 * (its base URL, protocol, and models), so the editor treats it as a shipped
 * route rather than a hand-declared one. This is a client-side UI heuristic
 * mirroring the adapter's installed catalog; once a route is configured the
 * authoritative answer comes from `llm.providers()`'s `declared` field.
 */
export const PI_AI_SHIPPED_PRESET_IDS: ReadonlySet<string> = new Set([
  'deepseek', 'openai', 'anthropic', 'openrouter', 'groq', 'together',
  'fireworks', 'nvidia', 'mistral', 'huggingface', 'cerebras',
  'openai-codex', 'zai', 'minimax', 'opencode',
])

export const PROVIDER_TYPES: ReadonlyArray<{ value: ProviderType; label: string }> = [
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'custom', label: 'Custom' },
]

export const DEFAULT_BASE_URLS: Record<ProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1',
  azure: 'https://<resource>.openai.azure.com',
  deepseek: 'https://api.deepseek.com/v1',
  'openai-compatible': '',
  ollama: 'http://localhost:11434',
  custom: '',
}

/**
 * The wire protocol a preset's endpoint most plausibly speaks, pre-filled into
 * the profile when a user configures the preset through the UI. The harness's
 * pi-ai adapter accepts only `openai-completions`, `openai-responses`, and
 * `anthropic-messages` for a hand-declared route, so every preset maps to the
 * closest of the three: OpenAI-compatible families default to chat
 * completions, Anthropic to Messages. The remaining types (Google, Azure,
 * Ollama) are OpenAI-compatible in name only — their native endpoints are not
 * — so the default is an honest best-effort the user must adjust (or use the
 * adapter's own catalog route for the same provider), surfaced by the UI as a
 * capability note rather than silently claimed to work.
 * @param type - the preset's declared API shape.
 * @returns the wire protocol to pre-fill, or `openai-completions` as the
 *   honest fallback.
 */
export function presetApiOf(type: ProviderType): string {
  if (type === 'anthropic') return 'anthropic-messages'
  return 'openai-completions'
}
