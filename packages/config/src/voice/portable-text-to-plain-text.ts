import type { TVoicePortableText } from './voice-portable-text';

/** Flattens a Voice rich-text value into plain text, for use where a `<meta>` description or `<title>` needs a string derived from the same visible copy an admin edited. */
export function portableTextToPlainText(
  value: TVoicePortableText | undefined,
): string {
  if (!value || value.length === 0) return '';

  return value
    .map((block) =>
      (block.children ?? []).map((span) => span.text ?? '').join(''),
    )
    .join(' ')
    .trim();
}
