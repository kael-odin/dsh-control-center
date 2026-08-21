export declare const SUPPORTED_DSH_VERSION = "0.1.1-rc.2";
export declare const DSH_SOURCE_BASELINE = "b150a551b8";
/**
 * Resolve DSH contract packages from the profile dependency root.
 *
 * When the bundle is installed into a profile, the plugin resolves DSH
 * packages from its own node_modules. The linked-repo dev layout breaks that:
 * pnpm `link:` resolves from the link target's real path, so the plugin
 * cannot see the profile's node_modules. Fall back to the framework's flat
 * module fallback (`$DSH_HOME/profiles/node_modules`), which symlinks every
 * DSH package and is the shared dependency root for all plugins.
 */
export declare function profileRequire(): NodeJS.Require;
/** Reject a DSH installation whose resolved contract packages differ from 0.1.1-rc.2. */
export declare function assertCompatibleDsh(requireFrom?: NodeJS.Require): void;
//# sourceMappingURL=compatibility.d.ts.map