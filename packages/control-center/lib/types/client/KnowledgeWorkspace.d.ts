import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
import type { ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client';
export interface KnowledgeWorkspaceInjected {
    getKnowledge: () => NonNullable<ClientRemote['controlCenterKnowledge']>;
    hooks: {
        knowledgeReady: HostObservable<boolean>;
    };
    listModels: () => Promise<readonly ModelProviderGroup[]>;
}
export type KnowledgeWorkspaceProps = PropsRuntime<'application.surface', 'knowledge'> & InjectFace<KnowledgeWorkspaceInjected>;
/** Full Knowledge Base workspace over the real Control Center knowledge service. */
export declare function KnowledgeWorkspace({ getKnowledge, useKnowledgeReady, listModels, close }: KnowledgeWorkspaceProps): import("react").JSX.Element;
//# sourceMappingURL=KnowledgeWorkspace.d.ts.map