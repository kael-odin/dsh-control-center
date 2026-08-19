/**
 * File Processing Host service: document → markdown and OCR (image → text)
 * processor catalog + configuration + conversion.
 *
 * Config lives in the `control-center-file-processing` settings namespace.
 * Conversion is capability-gated: processors without configured credentials
 * report a clear error instead of pretending (spec: unsupported integrations
 * are presented accurately through capability detection).
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { FileProcessorEntry, FileProcessorFeature, FileProcessorId, FileProcessorOverride, FileConvertRequest, FileConvertResult } from './file-processing-types.ts';
interface FileProcessingSettings {
    defaultDocumentProcessor: FileProcessorId;
    defaultImageProcessor: FileProcessorId;
    overrides: Partial<Record<FileProcessorId, FileProcessorOverride>>;
}
export declare class FileProcessingService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    listProcessors(): Promise<FileProcessorEntry[]>;
    getConfig(): Promise<FileProcessingSettings>;
    setDefault(feature: FileProcessorFeature, processor: FileProcessorId): Promise<{
        absent: true;
    }>;
    setOverride(processor: FileProcessorId, override: FileProcessorOverride): Promise<{
        absent: true;
    }>;
    /**
     * Convert a file with the configured processor. Capability-gated: local
     * text extraction and OpenAI-compatible vision work now; cloud processors
     * require their own credentials and report a precise error otherwise.
     */
    convert(request: FileConvertRequest): Promise<FileConvertResult>;
    /** Conversion is confined to the DSH home (attachments, knowledge files). */
    private confine;
    /** Plain-text extraction for text documents (txt/md/code). */
    private extractText;
    /** OCR through an OpenAI-compatible vision model (chat/completions). */
    private ocrViaVision;
    [Symbol.dispose](): void;
}
export {};
//# sourceMappingURL=file-processing.d.ts.map