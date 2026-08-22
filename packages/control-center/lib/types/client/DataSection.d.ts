/**
 * 数据 (Data management) section — Cherry DataSettings parity.
 *
 * - 本地备份（桌面桥）: save dialog → host writes the full snapshot to the
 *   granted path; restore reads a picked file back through the same confined
 *   bridge. The bridge cannot touch any file the user did not just pick.
 * - 快照导出/导入（浏览器下载/上传）: the web fallback, same snapshot format.
 * - WebDAV / S3 / 第三方笔记同步: honestly labeled unsupported on this
 *   platform rather than rendered as dead switches (Cherry offers them; DSH
 *   has no such service yet).
 *
 * The snapshot covers every Control Center settings namespace; API keys stay
 * in the DSH credentials store and never leave it.
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface DataSectionInjected {
    getData: () => NonNullable<ClientRemote['controlCenterData']>;
    getDesktop: () => NonNullable<ClientRemote['controlCenterDesktop']>;
    hooks: {
        dataReady: HostObservable<boolean>;
        desktopReady: HostObservable<boolean>;
    };
}
export type DataSectionProps = PropsRuntime<'settings.section'> & InjectFace<DataSectionInjected>;
export declare function DataSection({ getData, getDesktop, useDataReady, useDesktopReady }: DataSectionProps): import("react").JSX.Element;
//# sourceMappingURL=DataSection.d.ts.map