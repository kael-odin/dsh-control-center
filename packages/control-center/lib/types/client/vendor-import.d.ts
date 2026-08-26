/**
 * ChatGPT / Claude conversation-import parsing (client-side, Data 导入面板).
 *
 * The DSH host exposes no session-import RPC and its session logs are an
 * internal zstd event stream — writing third-party conversations into it
 * would bypass every durability invariant. So the honest import is an
 * ARCHIVE: parse the vendor export, emit one Markdown file per conversation,
 * and hand them back as a downloadable bundle. Readable, searchable, and
 * clearly labeled as archives rather than native sessions.
 */
export interface ParsedConversation {
    title: string;
    lines: string[];
}
/**
 * Parse a vendor export file. Format detection is content-based: both vendors
 * ship a top-level JSON array, distinguished by their element shape.
 */
export declare function parseVendorConversations(fileName: string, text: string): {
    ok: true;
    value: ParsedConversation[];
} | {
    ok: false;
    error: string;
};
/** One Markdown document per conversation, separated by horizontal rules. */
export declare function renderArchiveMarkdown(conversations: ParsedConversation[]): string;
//# sourceMappingURL=vendor-import.d.ts.map