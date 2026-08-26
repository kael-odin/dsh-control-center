/**
 * File processing Host service.
 *
 * The service owns the safe settings projection, credential references, host
 * capability checks, and the single dispatch path used by both RPC and the
 * model-facing `read_document` tool.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { FileConvertRequest, FileConvertResult, FileProcessingConfigView, FileProcessingTaskResult, FileProcessingTaskView, FileProcessorEntry, FileProcessorFeature, FileProcessorId, FileProcessorOverrideInput } from './file-processing-types.ts';
/** File processing service mounted by the Control Center host plugin. */
export declare class FileProcessingService extends Service {
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly scope;
    private taskStore;
    private readonly taskControllers;
    private readonly taskRuns;
    private readonly taskSubmissions;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    private stopTaskRuns;
    private startTaskStore;
    private requireTaskStore;
    private taskArtifactPath;
    private readTaskArtifact;
    private credentials;
    private fileSystem;
    private subprocess;
    private credentialRef;
    private refsFor;
    private migrateLegacySecrets;
    private credentialViews;
    private resolveApiKeyRef;
    private resolveApiKey;
    private resolveTaskApiKey;
    private statusFor;
    private catalogView;
    private registerTool;
    listProcessors(): Promise<FileProcessorEntry[]>;
    getConfig(): Promise<FileProcessingConfigView>;
    setDefault(feature: FileProcessorFeature, processor: FileProcessorId): Promise<{
        absent: true;
    }>;
    setOverride(processor: FileProcessorId, override: FileProcessorOverrideInput): Promise<{
        absent: true;
    }>;
    setApiKey(processor: FileProcessorId, slot: number, value: string): Promise<{
        absent: true;
    }>;
    clearApiKey(processor: FileProcessorId, slot: number): Promise<{
        absent: true;
    }>;
    convert(request: FileConvertRequest): Promise<FileConvertResult>;
    listTasks(): Promise<FileProcessingTaskView[]>;
    getTask(taskId: string): Promise<FileProcessingTaskView>;
    getTaskResult(taskId: string): Promise<FileProcessingTaskResult>;
    cancelTask(taskId: string): Promise<FileProcessingTaskView>;
    private convertPath;
    private resolveInput;
    private dispatch;
    private startRemoteDocumentTask;
    private submitAndRunTask;
    private startTaskRun;
    private resumeRemoteTask;
    private markTaskFailed;
    private completeTask;
    private runRemoteTask;
    private submitRemoteTask;
    private pollRemoteTask;
    private pollPaddleDocument;
    private pollMineruDocument;
    private pollDoc2xDocument;
    private downloadMarkdownArchive;
    private localDocument;
    private tesseract;
    private mistral;
    private paddleOcr;
    private openMineru;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=file-processing.d.ts.map