/** Durable public state for remote document-processing tasks. */
import type { Context } from '@deepseek-ai/cordis';
import { z } from 'zod';
import type { FileProcessingTaskStatus, FileProcessingTaskView, FileProcessorId } from './file-processing-types.ts';
declare const taskSchema: z.ZodObject<{
    id: z.ZodString;
    processor: z.ZodEnum<{
        paddleocr: "paddleocr";
        mineru: "mineru";
        doc2x: "doc2x";
    }>;
    feature: z.ZodLiteral<"document_to_markdown">;
    sourcePath: z.ZodString;
    sourceName: z.ZodString;
    sourceBytes: z.ZodNumber;
    apiHost: z.ZodString;
    modelId: z.ZodDefault<z.ZodString>;
    credentialRef: z.ZodOptional<z.ZodString>;
    providerTaskId: z.ZodOptional<z.ZodString>;
    stage: z.ZodString;
    status: z.ZodEnum<{
        cancelled: "cancelled";
        completed: "completed";
        interrupted: "interrupted";
        queued: "queued";
        running: "running";
        failed: "failed";
    }>;
    progress: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    deadlineAt: z.ZodString;
    attempts: z.ZodNumber;
    artifactPath: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type FileProcessingTaskRecord = z.infer<typeof taskSchema>;
/** Convert one internal record to the wire-safe task view. */
export declare function taskView(record: FileProcessingTaskRecord): FileProcessingTaskView;
/** Small durable task table over the DSH storage-domain seam. */
export declare class FileProcessingTaskStore {
    private readonly domain;
    private readonly tasks;
    private constructor();
    static open(ctx: Context): Promise<FileProcessingTaskStore>;
    list(): FileProcessingTaskRecord[];
    get(taskId: string): FileProcessingTaskRecord | undefined;
    put(record: FileProcessingTaskRecord): Promise<void>;
    update(taskId: string, mutate: (current: FileProcessingTaskRecord) => FileProcessingTaskRecord): Promise<FileProcessingTaskRecord>;
    close(): Promise<void>;
}
/** Whether a record has a remote provider task that can safely be polled again. */
export declare function canResumeRemoteTask(record: FileProcessingTaskRecord): boolean;
/** Constrain one record to remote-document processors. */
export declare function isRemoteDocumentProcessor(id: FileProcessorId): id is Extract<FileProcessorId, 'paddleocr' | 'mineru' | 'doc2x'>;
export type { FileProcessingTaskStatus };
//# sourceMappingURL=file-processing-tasks.d.ts.map