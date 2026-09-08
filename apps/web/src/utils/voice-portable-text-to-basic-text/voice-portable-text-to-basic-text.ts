import type { BasicText, TVoicePortableText } from '@blog/config';

/**
 * Adapts a Voice rich-text value for `BasicTextRenderer` by renaming each
 * link markDef's `href` (the field Voice stores) to `url` (the field
 * `BasicTextRenderer`'s link handler reads) — the two names otherwise leave
 * a voice link type-checking but rendering as plain text.
 */
export const voicePortableTextToBasicText = (
  value: TVoicePortableText,
): BasicText =>
  value.map((block) => ({
    ...block,
    markDefs: block.markDefs?.map(({ href, ...markDef }) => ({
      ...markDef,
      url: href,
    })),
  }));
