/**
 * Local Models Host service: manage local model servers (Ollama,
 * llama.cpp, any OpenAI-compatible localhost endpoint) and discover their
 * models. Configuration persists in the control-center-local-models
 * namespace; models can be adopted into the provider catalog with one click.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
export interface LocalModelServer {
    id: string;
    name: string;
    /** Base URL, e.g. http://127.0.0.1:11434/v1 (Ollama) */
    baseUrl: string;
    kind: 'ollama' | 'llamacpp' | 'openai-compatible';
    addedAt: string;
}
export interface LocalModelEntry {
    id: string;
    name: string;
}
export declare class LocalModelsService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    listServers(): Promise<LocalModelServer[]>;
    addServer(input: {
        name: string;
        kind: LocalModelServer['kind'];
        baseUrl?: string;
    }): Promise<LocalModelServer>;
    removeServer(serverId: string): Promise<{
        absent: true;
    }>;
    /** Probe a local server: GET {baseUrl}/models, return reachable models. */
    discoverModels(serverId: string): Promise<LocalModelEntry[]>;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=local-models.d.ts.map