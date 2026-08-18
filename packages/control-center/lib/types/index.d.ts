/** Host half of DSH Control Center: compatibility gate and onboarding settings. */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name. */
export declare const name = "dsh-control-center";
/** Reject incompatible DSH packages, then restore the onboarding namespace. */
export declare function apply(ctx: Context): void;
export { assertCompatibleDsh } from './compatibility.ts';
export { assertSecretSchemaSafe, auditSecretSchema } from './secret-schema.ts';
export type { SecretSchemaViolation } from './secret-schema.ts';
//# sourceMappingURL=index.d.ts.map