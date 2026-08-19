/**
 * Scheduled Tasks settings section: cron tasks with a real host scheduler.
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface TasksSectionInjected {
    getTasks: () => NonNullable<ClientRemote['controlCenterTasks']>;
    hooks: {
        tasksReady: HostObservable<boolean>;
    };
}
export type TasksSectionProps = PropsRuntime<'settings.section'> & InjectFace<TasksSectionInjected>;
export declare function TasksSection({ getTasks, useTasksReady }: TasksSectionProps): import("react").JSX.Element;
//# sourceMappingURL=TasksSection.d.ts.map