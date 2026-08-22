/**
 * Model Services section — the Cherry-parity two-pane provider directory.
 *
 * Left pane: the static 61-preset Cherry catalog (grouped 国内/国际/本地) plus
 * every provider the host `llm` directory already knows (pi-ai catalog routes
 * and user-declared ones, grouped 自定义), with search and a persisted
 * selection. Right pane: the selected provider's editor, seeded from the
 * preset so a fresh pick is one key away from a complete profile.
 *
 * The catalog is deliberately client-side, not registered into the host
 * directory: the harness's `llm-pi-ai` adapter already owns ~37 routes and
 * re-declares any profile written to its namespace, so a control-center
 * registration would collide with it. A preset is shown as configurable, and
 * configuring it writes the same `llm-pi-ai.providers.<id>` profile a
 * `settings.yaml` `llm-pi-ai:` section writes — the DSH preset method and this
 * surface are the same storage, so they cannot conflict. Configured state is
 * joined from `llm.providers()` and is always real.
 */
import type { ReactNode } from 'react';
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import { type ProviderPreset } from './provider-presets.ts';
import { type ProviderIdentity } from './ModelsSection.tsx';
import type { ModelsSettingsState, ModelsSettingsStore, ProviderRow } from './store.ts';
import type { SettingsSchemaOperations } from './schema-operations.ts';
import type { en } from './locales.ts';
/** One left-pane entry: a Cherry preset or a host-known provider. */
interface DirectoryEntry {
    /** Provider route id. */
    provider: string;
    /** Human-facing name (Cherry name for presets, the directory's otherwise). */
    displayName: string;
    /** Left-pane grouping. */
    group: 'domestic' | 'international' | 'local' | 'custom';
    /** The preset behind this entry, when it is a Cherry preset. */
    preset?: ProviderPreset;
    /** The host directory row for this route, when it is configured. */
    row?: ProviderRow;
}
/** Injected dependencies of {@link ProviderDirectorySection}. */
export interface ProviderDirectorySectionInjected {
    controller: ModelsSettingsStore;
    useSnapshot: SnapshotSelectorHook<ModelsSettingsState>;
    api: Pick<IApiClient, 'settings' | 'credentials' | 'llm'>;
    schema: SettingsSchemaOperations;
    t: (key: keyof typeof en) => string;
}
/** Props delivered by the slot outlet (partial until injected). */
export type ProviderDirectorySectionProps = Partial<ProviderDirectorySectionInjected>;
/** A stable selection identity for notices and editor targets. */
interface SelectedIdentity extends ProviderIdentity {
    settingsNs: string;
    settingsPath: readonly string[];
    declared?: boolean;
    defaults?: {
        baseURL?: string;
        api?: string;
    };
}
export declare function identityOf(entry: DirectoryEntry): SelectedIdentity;
/** Build the left-pane directory: the 61 presets joined with host rows, then
 * every host row whose route is not a preset (custom/pi-ai extras). */
export declare function buildDirectory(rows: readonly ProviderRow[]): readonly DirectoryEntry[];
/**
 * Render the Model Services section.
 * @param props - slot-delivered injected dependencies.
 * @returns the section, or null while the shell has not injected yet.
 */
export declare function ProviderDirectorySection(props: ProviderDirectorySectionProps): ReactNode;
export {};
//# sourceMappingURL=ProviderDirectorySection.d.ts.map