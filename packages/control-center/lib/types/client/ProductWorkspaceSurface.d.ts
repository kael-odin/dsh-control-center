import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ProductWorkspaceId } from './product-workspace-contract.ts';
export interface ProductWorkspaceSurfaceProps extends PropsRuntime<'application.surface', ProductWorkspaceId> {
    id: ProductWorkspaceId;
    title: string;
    description: string;
    closeLabel: string;
}
/** Render the capability-owned product workspace frame. */
export declare function ProductWorkspaceSurface({ id, title, description, closeLabel, close }: ProductWorkspaceSurfaceProps): import("react").JSX.Element;
//# sourceMappingURL=ProductWorkspaceSurface.d.ts.map