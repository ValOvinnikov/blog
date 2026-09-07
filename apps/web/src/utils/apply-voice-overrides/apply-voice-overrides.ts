import { portableTextToPlainText, type TVoicePortableText } from '@blog/config';

// Flat `site_config.voiceOverrides` key -> nested `en.json` message path,
// mirroring `apps/platform`'s curated `TVoiceOverrideKey` field set
// (`apps/platform/src/utils/voice-fields/voice-fields.ts`) one key at a time —
// that's the write side, this is the read side of the same curated fields.
const VOICE_OVERRIDE_PATHS: Record<string, readonly string[]> = {
  notFoundHeading: ['notFound', 'heading'],
  notFoundSupportingText: ['notFound', 'supportingText'],
  notFoundReturnHome: ['notFound', 'returnHome'],
  blogListEmpty: ['blogListPage', 'empty'],
  topicEmpty: ['topicPage', 'empty'],
  tagEmpty: ['tagPage', 'empty'],
  topicsEmpty: ['topicsPage', 'empty'],
  bookmarksEmpty: ['bookmarksPage', 'empty'],
};

const setAtPath = (
  target: Record<string, unknown>,
  path: readonly string[],
  value: string,
): Record<string, unknown> => {
  const [key, ...rest] = path;
  if (key === undefined) return target;

  if (rest.length === 0) {
    return { ...target, [key]: value };
  }

  const child = target[key];
  const childObject =
    typeof child === 'object' && child !== null && !Array.isArray(child)
      ? (child as Record<string, unknown>)
      : {};

  return { ...target, [key]: setAtPath(childObject, rest, value) };
};

/**
 * Applies `site_config.voiceOverrides`' flat curated keys onto the merged
 * message tree, cloning only the objects along each key's path so untouched
 * namespaces keep referencing the cached messages module instead of being
 * mutated in place. A message tree leaf must be a string, so a rich
 * (Portable Text) override is projected to plain text rather than dropped —
 * unformatted still beats falling back to the untouched default copy.
 */
export const applyVoiceOverrides = (
  messages: Record<string, unknown>,
  overrides: Record<string, string | TVoicePortableText>,
): Record<string, unknown> => {
  let result = messages;

  for (const [key, value] of Object.entries(overrides)) {
    const path = VOICE_OVERRIDE_PATHS[key];
    if (!path) continue;
    const text =
      typeof value === 'string' ? value : portableTextToPlainText(value);
    result = setAtPath(result, path, text);
  }

  return result;
};
