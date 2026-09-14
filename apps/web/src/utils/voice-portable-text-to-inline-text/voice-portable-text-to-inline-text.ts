import type { InlineText, TVoicePortableText } from '@blog/config';

/**
 * Adapts a Voice rich-text value for `InlineTextRenderer` by converting each
 * `link` markDef to the `inlineLink` shape it expects — renaming `href` (the
 * field Voice stores) to `url` (the field `InlineTextRenderer`'s link
 * handler reads).
 */
export const voicePortableTextToInlineText = (
  value: TVoicePortableText,
): InlineText =>
  value.map((block) => ({
    ...block,
    markDefs: block.markDefs?.map(({ href, _key }) => ({
      _key,
      _type: 'inlineLink' as const,
      url: href,
    })),
  }));
