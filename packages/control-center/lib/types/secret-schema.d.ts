/** Fail-closed audit for settings schemas that contain secret-role nodes. */
export interface SecretSchemaViolation {
    path: string[];
    type: string;
}
/** Return unsupported wrapper locations that can hide secret-role descendants. */
export declare function auditSecretSchema(schema: unknown): SecretSchemaViolation[];
/** Throw before a namespace with an unsafe secret schema is exposed by Control Center. */
export declare function assertSecretSchemaSafe(namespace: string, schema: unknown): void;
//# sourceMappingURL=secret-schema.d.ts.map