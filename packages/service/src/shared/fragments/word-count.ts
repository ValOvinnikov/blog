import { z } from 'zod';

/**
 * GROQ has no native word-split, so this approximates a word count by
 * splitting the plain text extracted via `pt::text()` on single spaces and
 * dropping empty entries left behind by consecutive whitespace (double
 * spaces, the blank line `pt::text()` inserts between blocks). Computed
 * server-side (via `q.raw`/`sub.raw`, groqd's escape hatch for unsupported
 * GROQ features) so cards that don't render body content never fetch it.
 */
export const WORD_COUNT_EXPRESSION =
  'coalesce(count(string::split(pt::text(body), " ")[@ != ""]), 0)';

export const wordCountParser = z.number();
