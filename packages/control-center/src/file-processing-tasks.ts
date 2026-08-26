/** Durable public state for remote document-processing tasks. */

import type { Context } from '@deepseek-ai/cordis'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { Domain, DomainFacility, KvTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'
import type {
  FileProcessingTaskStatus,
  FileProcessingTaskView,
  FileProcessorId,
} from './file-processing-types.ts'

const processorSchema = z.enum(['paddleocr', 'mineru', 'doc2x'])
const statusSchema = z.enum(['queued', 'running', 'completed', 'failed', 'cancelled', 'interrupted'])

const taskSchema = z.object({
  id: z.string().min(1),
  processor: processorSchema,
  feature: z.literal('document_to_markdown'),
  sourcePath: z.string().min(1),
  sourceName: z.string().min(1),
  sourceBytes: z.number().int().nonnegative(),
  apiHost: z.string().min(1),
  modelId: z.string().default(''),
  credentialRef: z.string().min(1).optional(),
  providerTaskId: z.string().min(1).optional(),
  stage: z.string().min(1),
  status: statusSchema,
  progress: z.number().int().min(0).max(100),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  deadlineAt: z.string().min(1),
  attempts: z.number().int().nonnegative(),
  artifactPath: z.string().min(1).optional(),
  error: z.string().min(1).max(500).optional(),
}).strict()

export type FileProcessingTaskRecord = z.infer<typeof taskSchema>

const taskDomain = defineDomain({
  name: 'control_center_file_processing_tasks',
  version: 1,
  tables: { tasks: domainTable<string, FileProcessingTaskRecord>(taskSchema) },
})

/** Convert one internal record to the wire-safe task view. */
export function taskView(record: FileProcessingTaskRecord): FileProcessingTaskView {
  return {
    taskId: record.id,
    processor: record.processor,
    feature: record.feature,
    status: record.status,
    progress: record.progress,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(record.error === undefined ? {} : { detail: record.error }),
    resultAvailable: record.artifactPath !== undefined,
  }
}

/** Small durable task table over the DSH storage-domain seam. */
export class FileProcessingTaskStore {
  private constructor(
    private readonly domain: Domain<typeof taskDomain>,
    private readonly tasks: KvTable<string, FileProcessingTaskRecord>,
  ) {}

  static async open(ctx: Context): Promise<FileProcessingTaskStore> {
    const facility = ctx.get('storageDomain') as DomainFacility | undefined
    if (facility === undefined) {
      throw new Error('Remote document processing requires the DSH storage-domain runtime')
    }
    const domain = await facility.open(taskDomain)
    return new FileProcessingTaskStore(domain, domain.table('tasks'))
  }

  list(): FileProcessingTaskRecord[] {
    return [...this.tasks.entries()].map(([, record]) => record)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }

  get(taskId: string): FileProcessingTaskRecord | undefined {
    return this.tasks.get(taskId)
  }

  async put(record: FileProcessingTaskRecord): Promise<void> {
    await this.tasks.put(record.id, record)
  }

  async update(taskId: string, mutate: (current: FileProcessingTaskRecord) => FileProcessingTaskRecord): Promise<FileProcessingTaskRecord> {
    return this.tasks.update(taskId, mutate)
  }

  close(): Promise<void> {
    return this.domain.close()
  }
}

/** Whether a record has a remote provider task that can safely be polled again. */
export function canResumeRemoteTask(record: FileProcessingTaskRecord): boolean {
  return record.status === 'running' && record.providerTaskId !== undefined
}

/** Constrain one record to remote-document processors. */
export function isRemoteDocumentProcessor(id: FileProcessorId): id is Extract<FileProcessorId, 'paddleocr' | 'mineru' | 'doc2x'> {
  return id === 'paddleocr' || id === 'mineru' || id === 'doc2x'
}

export type { FileProcessingTaskStatus }
