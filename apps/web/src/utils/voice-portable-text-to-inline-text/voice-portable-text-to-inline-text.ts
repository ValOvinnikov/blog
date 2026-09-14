import type { TVoicePortableText } from '@blog/config';
import type { TCtaContent } from '@blog/service';

/**
 * Adapts a Voice rich-text value for `InlineTextRenderer`. Voice stores an
 * inline link as a raw `href`, with no way to reference a `shared_link`
 * library document — and `inlineText` (CTA copy) now resolves only the
 * library's `sharedLinkAnnotation` mark — so a Voice-authored link has
 * nothing to resolve to and is stripped to its plain text instead of
 * rendering a dead anchor.
 */
export const voicePortableTextToInlineText = (
  value: TVoicePortableText,
): TCtaContent =>
  value.map((block) => {
    const linkKeys = new Set(
      (block.markDefs ?? []).map((markDef) => markDef._key),
    );

    return {
      ...block,
      children: block.children.map((span) => ({
        ...span,
        marks: span.marks?.filter((mark) => !linkKeys.has(mark)),
      })),
      markDefs: undefined,
    };
  });
