/**
 * File Processing / OCR settings section.
 *
 * One page per feature (document_to_markdown / image_to_text) over the
 * controlCenterFileProcessing Remote service, composed like Cherry's
 * ProcessorPanel: default-processor select + per-processor config cards.
 */
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol';
import type { FileProcessorFeature } from '../file-processing-types.ts';
export interface ProcessorSectionProps {
    feature: FileProcessorFeature;
    title: string;
    description: string;
    service: NonNullable<TypertClientRemote['controlCenterFileProcessing']>;
}
export declare function ProcessorSection({ feature, title, description, service }: ProcessorSectionProps): import("react").JSX.Element;
//# sourceMappingURL=ProcessorSection.d.ts.map