import type { IApiClient } from '@deepseek-ai/dsh-client-connection/client';
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
export interface NotificationSectionInjected {
    api: IApiClient;
}
export type NotificationSectionProps = PropsRuntime<'settings.section'> & InjectFace<NotificationSectionInjected>;
export declare function NotificationSection({ api }: NotificationSectionProps): import("react").JSX.Element;
//# sourceMappingURL=NotificationSection.d.ts.map