/** Safe projections for file-processing settings and legacy secret cleanup. */
import type { FileProcessorOverride, FileProcessorOverrideView } from './file-processing-types.ts';
/** Remove legacy API key values from one processor override. */
export declare function stripProcessorSecrets(override: FileProcessorOverride | undefined): FileProcessorOverrideView | undefined;
/** Remove every legacy API key array from a file-processing settings record. */
export declare function stripFileProcessingSecrets(value: unknown): object;
//# sourceMappingURL=file-processing-settings.d.ts.map