import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { ModelCheckResult } from './model-check.ts';
/** Client descriptor contribution for the Control Center model-check service. */
declare const modelCheckRemote: TypertRemoteContribution;
export default modelCheckRemote;
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterModelCheck: {
            check(provider: string, model: string): Promise<{
                ok: true;
                value: ModelCheckResult;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
        };
    }
}
//# sourceMappingURL=model-check-remote-client.d.ts.map