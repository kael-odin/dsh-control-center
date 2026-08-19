/**
 * File Processing (document → markdown) and OCR (image → text) types.
 *
 * AGPL-3.0-only – processor catalog adapted from Cherry Studio's
 * fileProcessingMeta (system/paddleocr/tesseract/mistral/ovocr for OCR;
 * local-document/mineru/doc2x/mistral/open-mineru for documents).
 */
export type FileProcessorFeature = 'document_to_markdown' | 'image_to_text';
export type FileProcessorId = 'system' | 'tesseract' | 'paddleocr' | 'local-paddleocr' | 'ovocr' | 'local-document' | 'mineru' | 'doc2x' | 'mistral' | 'open-mineru';
/** One processor entry in the catalog. */
export interface FileProcessorEntry {
    id: FileProcessorId;
    name: string;
    description: string;
    apiKeyWebsite: string | null;
    features: FileProcessorFeature[];
    requiresApiKey: boolean;
    /** Language code options for OCR processors. */
    languageOptions: string[];
}
/** Persisted override for one processor. */
export interface FileProcessorOverride {
    apiKeys?: string[];
    languages?: string[];
    /** Vision/model endpoints for API processors (mistral etc.). */
    apiHost?: string;
    model?: string;
}
/** Conversion request: file path confined to registered repos/attachments. */
export interface FileConvertRequest {
    processor: FileProcessorId;
    /** Absolute path to the source file (must be inside a registered repo or
     *  the DSH attachments directory). */
    path: string;
    /** Target language for OCR processors (defaults to the override). */
    language?: string;
}
/** Conversion result: extracted text or markdown. */
export interface FileConvertResult {
    processor: FileProcessorId;
    text: string;
    bytes: number;
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterFileProcessing: {
            listProcessors(): Promise<{
                ok: true;
                value: FileProcessorEntry[];
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            getConfig(): Promise<{
                ok: true;
                value: {
                    defaultDocumentProcessor: FileProcessorId;
                    defaultImageProcessor: FileProcessorId;
                    overrides: Partial<Record<FileProcessorId, FileProcessorOverride>>;
                };
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            setDefault(feature: FileProcessorFeature, processor: FileProcessorId): Promise<{
                ok: true;
                value: {
                    absent: true;
                };
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            setOverride(processor: FileProcessorId, override: FileProcessorOverride): Promise<{
                ok: true;
                value: {
                    absent: true;
                };
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            convert(request: FileConvertRequest): Promise<{
                ok: true;
                value: FileConvertResult;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
        };
    }
}
export {};
//# sourceMappingURL=file-processing-types.d.ts.map