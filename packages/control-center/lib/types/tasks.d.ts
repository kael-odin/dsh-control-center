/**
 * Scheduled Tasks Host service.
 *
 * Persisted cron tasks (settings namespace) with a per-minute host scheduler.
 * Action kinds:
 * - `command`: execute a shell command through the DSH subprocess service
 *   (capability-gated: reports a precise error when subprocess is absent)
 * - `notification`: record a run entry in the task history (self-contained)
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
export type TaskActionKind = 'command' | 'notification';
export interface ScheduledTask {
    id: string;
    name: string;
    /** 5-field cron: minute hour day-of-month month day-of-week. */
    schedule: string;
    action: TaskAction;
    enabled: boolean;
    lastRunAt: string | null;
    createdAt: string;
}
export type TaskAction = {
    kind: 'command';
    command: string;
} | {
    kind: 'notification';
    message: string;
};
export interface TaskRunEntry {
    taskId: string;
    ranAt: string;
    ok: boolean;
    detail: string;
}
export declare class TasksService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    private timer;
    private ranThisMinute;
    private lastTickMinute;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    list(): Promise<ScheduledTask[]>;
    listHistory(): Promise<TaskRunEntry[]>;
    create(input: {
        name: string;
        schedule: string;
        action: TaskAction;
    }): Promise<ScheduledTask>;
    update(taskId: string, patch: {
        name?: string;
        schedule?: string;
        action?: TaskAction;
        enabled?: boolean;
    }): Promise<ScheduledTask>;
    remove(taskId: string): Promise<{
        absent: true;
    }>;
    /** Fire every due enabled task (per-minute scheduler tick). */
    tick(): Promise<void>;
    private runTask;
    [Symbol.dispose](): void;
}
/** Match a 5-field cron (minute hour dom month dow) against a date. */
export declare function cronMatches(cron: string, date: Date): boolean;
//# sourceMappingURL=tasks.d.ts.map