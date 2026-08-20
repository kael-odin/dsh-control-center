import type { Context } from '@deepseek-ai/cordis';
/** Cordis companion plugin name. */
export declare const name = "dsh-control-center-invariant";
/** Service required before package ownership can be reserved. */
export declare const inject: string[];
/** Register Control Center ownership with the DSH invariant registry. */
export declare const apply: (ctx: Context) => Promise<() => void>;
//# sourceMappingURL=invariant.d.ts.map