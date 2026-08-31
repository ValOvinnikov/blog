import { ceilDivideAtLeastOne } from '@blog/utils/primitives';

/** Editorial default: average adult silent-reading speed. */
const DEFAULT_WORDS_PER_MINUTE = 200;

/** Estimated reading time in whole minutes for a given word count (never below 1). */
export function toReadingTimeMinutes(
  wordCount: number,
  wordsPerMinute = DEFAULT_WORDS_PER_MINUTE,
): number {
  return ceilDivideAtLeastOne(wordCount, wordsPerMinute);
}
