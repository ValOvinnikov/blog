import type { ILink, RichText, TMaybeUndefined } from '@blog/config';
import {
  type TRawSharedLink,
  toLink,
} from '@blog/service/shared/transformers/to-link';

export type TRawSharedLinkAnnotation = {
  _key: string;
  _type: 'sharedLinkAnnotation';
  link: TRawSharedLink | null;
};

/**
 * The resolved view-model for a `sharedLinkAnnotation` mark — the one shape
 * every Portable Text field that can hold that mark (post body, author bio,
 * CTA content, …) resolves it to.
 */
export type TSharedLinkAnnotation = {
  _key: string;
  _type: 'sharedLinkAnnotation';
  link: TMaybeUndefined<ILink>;
};

export function toSharedLinkAnnotation(
  raw: TRawSharedLinkAnnotation,
): TSharedLinkAnnotation {
  return {
    _key: raw._key,
    _type: 'sharedLinkAnnotation',
    link: toLink(raw),
  };
}

type TGeneratedTextBlock = Extract<RichText[number], { _type: 'block' }>;

/** The `href`-based `link` mark — kept exactly as authored, no resolution needed. */
export type THrefLinkAnnotation = Extract<
  NonNullable<TGeneratedTextBlock['markDefs']>[number],
  { _type: 'link' }
>;

/** Either mark a `richText`/`proseText`/`inlineText` field's markDefs can resolve to. */
export type TPortableTextMarkDef = TSharedLinkAnnotation | THrefLinkAnnotation;
