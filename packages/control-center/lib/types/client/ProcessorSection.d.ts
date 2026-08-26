/** Cherry-style document processing and OCR provider settings. */
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