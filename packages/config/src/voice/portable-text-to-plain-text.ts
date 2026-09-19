import type { TVoicePortableText } from './voice-portable-text';

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
