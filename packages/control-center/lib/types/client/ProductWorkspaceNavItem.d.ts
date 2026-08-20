import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ProductWorkspaceId } from './product-workspace-contract.ts';
export interface ProductWorkspaceNavItemProps extends PropsRuntime<'application.navigation'> {
    id: ProductWorkspaceId;
    label: string;
}
/** Render one product-workspace navigation action. */
export declare function ProductWorkspaceNavItem({ id, label, wide, activeId, select }: ProductWorkspaceNavItemProps): import("react").JSX.Element;
//# sourceMappingURL=ProductWorkspaceNavItem.d.ts.map