/**
 * Plugin-side diagnostic log ring (About 诊断日志包 third source). The DSH
 * host logs to stdout only, so a support bundle cannot read host files; the
 * next best source is the plugin's own view of every logger call it makes.
 * A module-level ring keeps the last N entries; the system page drains it
 * into the downloadable diagnostic bundle.
 */
export interface PluginLogEntry {
    time: string;
    level: string;
    message: string;
}
/** Minimal structural logger — avoids importing cordis types into a leaf module. */
interface LoggerLike {
    debug?: (...parts: unknown[]) => void;
    info?: (...parts: unknown[]) => void;
    warn?: (...parts: unknown[]) => void;
    error?: (...parts: unknown[]) => void;
}
/** Mirror one logger call into the ring. Long payloads are truncated. */
export declare function recordPluginLog(level: string, parts: unknown[]): void;
/** Newest-last copy of the ring for the diagnostic bundle. */
export declare function drainPluginLogs(): PluginLogEntry[];
/**
 * Wrap the context logger so every debug/info/warn/error the plugin emits is
 * mirrored into the ring. The original methods still run first — this is a
 * tap, never a replacement.
 */
export declare function installLogRing(ctx: {
    logger: LoggerLike;
}): void;
export {};
//# sourceMappingURL=log-ring.d.ts.map