import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { IApiClient } from '@deepseek-ai/dsh-client-connection/client';
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client';
export interface AppearanceSectionInjected {
    api: IApiClient;
    locale?: LocaleRuntime;
}
export type AppearanceSectionProps = PropsRuntime<'settings.section'> & InjectFace<AppearanceSectionInjected>;
export declare function AppearanceSection({ api, locale }: AppearanceSectionProps): import("react").JSX.Element;
//# sourceMappingURL=AppearanceSection.d.ts.map