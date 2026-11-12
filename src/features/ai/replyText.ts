/**
 * The online guide is told to write plain text, but models slip into Markdown now and then. The
 * chat shows plain text, so the common marks are taken out: bold and italic markers go, list
 * markers become "•", headings lose their hashes.
 */
export function plainReply(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^[ \t]*[*\-+][ \t]+/gm, '• ')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/(^|[\s(])\*(\S[^*\n]*?\S|\S)\*(?=[\s).,;:!?]|$)/gm, '$1$2')
    .trim();
}
