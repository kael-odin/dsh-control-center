import type { PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Full component props: section owner share plus item render share. */
export type GeneralSectionComponentProps = PropsRuntime<'settings.section'> & PropsRenderSlots<'settings.general.item'>;
/** Render the General section content column. */
export declare function GeneralSection({ renderSlot }: GeneralSectionComponentProps): import("react").JSX.Element;
//# sourceMappingURL=GeneralSection.d.ts.map