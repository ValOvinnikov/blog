import { z } from 'zod';

// GROQ has no word-split, so this approximates by splitting each paragraph on spaces.
export const WORD_COUNT_EXPRESSION =
  'coalesce(math::sum(content[_type == "block"]{"n": count(string::split(pt::text(@), " ")[@ != ""])}.n), 0)';

export const wordCountParser = z.number();
