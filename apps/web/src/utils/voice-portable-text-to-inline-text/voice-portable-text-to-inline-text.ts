import type { InlineText, TVoicePortableText } from '@blog/config';

/**
 * Adapts a Voice rich-text value for `InlineTextRenderer` by renaming each
 * link markDef's `href` (the field Voice stores) to `url` (the field
 * `InlineTextRenderer`'s link handler reads) — the two names otherwise leave
 * a voice link type-checking but rendering as plain text.
 */
export const voicePortableTextToInlineText = (
  value: TVoicePortableText,
): InlineText =>
  value.map((block) => ({
    ...block,
    markDefs: block.markDefs?.map(({ href, ...markDef }) => ({
      ...markDef,
      url: href,
    })),
  }));
