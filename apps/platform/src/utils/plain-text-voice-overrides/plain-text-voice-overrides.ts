import { portableTextToPlainText, type TVoicePortableText } from '@blog/config';

/** Projects a stored voice-overrides map to the plain-text form the admin form's inputs edit. */
export const plainTextVoiceOverrides = (
  overrides: Record<string, string | TVoicePortableText>,
): Record<string, string> => {
  const entries = Object.entries(overrides).map(
    ([key, value]): [string, string] => [
      key,
      typeof value === 'string' ? value : portableTextToPlainText(value),
    ],
  );
  return Object.fromEntries(entries);
};
