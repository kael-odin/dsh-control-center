import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { IApiClient } from '@deepseek-ai/dsh-client-connection/client';
export interface AppearanceSectionInjected {
    api: IApiClient;
}
export type AppearanceSectionProps = PropsRuntime<'settings.section'> & InjectFace<AppearanceSectionInjected>;
export declare function AppearanceSection({ api }: AppearanceSectionProps): import("react").JSX.Element;
//# sourceMappingURL=AppearanceSection.d.ts.map