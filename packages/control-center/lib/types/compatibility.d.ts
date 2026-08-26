export declare const SUPPORTED_DSH_VERSION = "0.1.1-rc.2";
export declare const DSH_SOURCE_BASELINE = "b150a551b8";
/** Whether a resolved DSH package version falls inside the support window. */
export declare function isSupportedDshVersion(version: string): boolean;
/**
 * Resolve DSH contract packages from the profile dependency root.
 *
 * Prefers a root that can resolve the host framework contract (dsh-settings).
 * The linked-repo dev layout breaks resolution from the plugin's own
 * node_modules: pnpm `link:` resolves from the link target's real path, so the
 * plugin cannot see the profile's node_modules. The framework's flat module
 * fallback (`$DSH_HOME/profiles/node_modules`) symlinks every DSH package and
 * is the shared dependency root for all plugins.
 */
export declare function profileRequire(): NodeJS.Require;
/**
 * Reject a DSH installation whose resolved contract packages differ from
 * 0.1.1-rc.2.
 *
 * Each package resolves independently, best root first. The host framework
 * contract must always resolve; client contract packages that a bundled
 * deployment inlines into the client bundle are verified only when they are on
 * the host's module graph.
 */
export declare function assertCompatibleDsh(requireFrom?: NodeJS.Require): void;
//# sourceMappingURL=compatibility.d.ts.map