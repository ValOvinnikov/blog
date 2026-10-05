import { z } from 'zod';

// GROQ has no word-split, so this approximates by splitting on spaces.
export const WORD_COUNT_EXPRESSION =
  'coalesce(count(string::split(pt::text(content), " ")[@ != ""]), 0)';

export const wordCountParser = z.number();
