import type { TVoicePortableText } from '@blog/config';

/**
 * Keeps only the string-valued entries of a stored voice-overrides map — a
 * rich (Portable Text) value has no plain-text editor to render it in yet,
 * so it is dropped here rather than handed to a component typed for strings.
 */
export const stringVoiceOverrides = (
  overrides: Record<string, string | TVoicePortableText>,
): Record<string, string> => {
  const stringEntries = Object.entries(overrides).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return Object.fromEntries(stringEntries);
};
