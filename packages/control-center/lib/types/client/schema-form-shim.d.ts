/**
 * Inline schema-form helpers to avoid bundler path issues.
 * Copied from apps/desktop/.materialized/harness/packages/client/schema-form/lib/index.js
 */
/** Rehydrate a serialized schema envelope. */
export declare function rehydrateSchema(serialized: unknown): unknown;
/** Validate a draft against a rehydrated schema. */
export declare function validateDraft(schema: unknown, draft: unknown): string | undefined;
/** Resolve the schema node at a settings path. */
export declare function nodeAtPath(root: unknown, path: string[]): unknown;
/** Read a nested value by path. */
export declare function getPath(value: unknown, path: string[]): unknown;
/** Whether a draft explicitly carries the path. */
export declare function hasPath(value: unknown, path: string[]): boolean;
/** Immutably set a nested value. */
export declare function setPath(root: Record<string, unknown>, path: string[], value: unknown): unknown;
/** Immutably remove a nested key. */
export declare function deletePath(root: Record<string, unknown>, path: string[]): unknown;
//# sourceMappingURL=schema-form-shim.d.ts.map