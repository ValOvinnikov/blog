import type { TVoicePortableText } from '@blog/config';
import type { TResolvedCtaContentBlock } from '@blog/service';

/**
 * Adapts a Voice rich-text value for `InlineTextRenderer` by wrapping each
 * `link` markDef's stored `href` as a resolved `linkRef` mark.
 */
export const voicePortableTextToInlineText = (
  value: TVoicePortableText,
): TResolvedCtaContentBlock[] =>
  value.map((block) => ({
    ...block,
    markDefs: block.markDefs?.map(({ href, _key }) => ({
      _key,
      _type: 'linkRef' as const,
      link: { href, target: undefined },
    })),
  }));
