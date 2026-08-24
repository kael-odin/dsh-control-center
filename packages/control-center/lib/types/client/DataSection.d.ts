/**
 * 数据 (Data management) section — Cherry DataSettings parity.
 *
 * 重新设计为 Cherry 风格的子菜单结构：
 * - 左侧菜单列表（13 项，4 个分隔组）
 * - 右侧面板渲染对应子工具
 *
 * 已实现的面板：基础数据（备份/恢复/导出/导入/清除）、本地目录备份、Markdown 导出
 * 其余面板如实标注能力状态。
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface DataSectionInjected {
    getData: () => NonNullable<ClientRemote['controlCenterData']>;
    getDesktop: () => NonNullable<ClientRemote['controlCenterDesktop']>;
    getSystem?: (() => NonNullable<ClientRemote['controlCenterSystem']>) | undefined;
    hooks: {
        dataReady: HostObservable<boolean>;
        desktopReady: HostObservable<boolean>;
        systemReady: HostObservable<boolean>;
    };
}
export type DataSectionProps = PropsRuntime<'settings.section'> & InjectFace<DataSectionInjected>;
export declare function DataSection({ getData, getDesktop, getSystem, useDataReady, useDesktopReady, useSystemReady }: DataSectionProps): import("react").JSX.Element;
//# sourceMappingURL=DataSection.d.ts.map