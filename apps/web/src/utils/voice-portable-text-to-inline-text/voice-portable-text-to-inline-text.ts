import type { TPortableText, TVoicePortableText } from '@blog/config';

/**
 * Adapts a Voice rich-text value for `PortableText` by wrapping each `link`
 * markDef's stored `href` as a resolved `linkRef` mark.
 */
export const voicePortableTextToInlineText = (
  value: TVoicePortableText,
): TPortableText[] =>
  value.map((block) => ({
    ...block,
    markDefs: block.markDefs?.map(({ href, _key }) => ({
      _key,
      _type: 'linkRef' as const,
      link: { href, target: undefined },
    })),
  }));
