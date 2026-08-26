/** Narrow network policy for provider-issued document upload and result URLs. */
export type RemoteDocumentProvider = 'mineru' | 'doc2x';
export type RemoteStorageUrlKind = 'upload' | 'download';
interface RemoteStorageUrlOptions {
    provider: RemoteDocumentProvider;
    apiHost: string;
    kind: RemoteStorageUrlKind;
}
/**
 * Validate a URL returned by MinerU or Doc2X before the host sends data to it.
 * Self-hosted providers may use their configured origin; cloud providers may use
 * only the documented object-storage/CDN hosts for the operation.
 */
export declare function sanitizeRemoteStorageUrl(rawUrl: string, options: RemoteStorageUrlOptions): URL;
/** Restrict provider-returned signed headers to storage-request-safe fields. */
export declare function sanitizeSignedUploadHeaders(rawHeaders: unknown): Record<string, string> | undefined;
/** Read a response without allowing an unbounded body into memory. */
export declare function readBoundedResponseBytes(response: Response, maxBytes: number, signal?: AbortSignal): Promise<Uint8Array>;
/** Parse a provider JSON body only after enforcing the same response budget. */
export declare function readBoundedResponseJson<T>(response: Response, maxBytes: number, signal?: AbortSignal): Promise<T>;
/** A ZIP response may carry parameters, but not a different media type. */
export declare function isZipContentType(contentType: string | null): boolean;
export {};
//# sourceMappingURL=file-processing-url-policy.d.ts.map