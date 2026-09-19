import type { ILink, TMaybeUndefined } from '@blog/config';
import type { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text-mark-def';
import { toLinkDocument } from '@blog/service/shared/transformers/to-link-document';
import type { InferFragmentType } from 'groqd';

export type TRawPortableTextMarkDef = InferFragmentType<
  typeof portableTextMarkDefFragment
>;

/** An inline mark's anchor text comes from its span children, so the resolved link carries only the destination, not a label. */
export type TPortableTextLink = Pick<ILink, 'href' | 'target'>;

/** A Portable Text `linkRef` mark with its `link` document resolved; an absent `link` means a dangling reference, which the renderer degrades to plain text. */
export interface IPortableTextLinkMark {
  _key: string;
  _type: 'linkRef';
  link: TMaybeUndefined<TPortableTextLink>;
}

export type TPortableTextBlockWithResolvedLinks<
  TBlock extends { markDefs?: unknown },
> = Omit<TBlock, 'markDefs'> & {
  markDefs: TMaybeUndefined<IPortableTextLinkMark[]>;
};

function toPortableTextMarkDef(
  raw: TRawPortableTextMarkDef,
): IPortableTextLinkMark {
  const link = toLinkDocument(raw.link);

  return {
    _key: raw._key,
    _type: 'linkRef',
    link: link && { href: link.href, target: link.target },
  };
}

export function toPortableTextBlockWithResolvedLinks<
  TBlock extends { markDefs?: TRawPortableTextMarkDef[] | null },
>(raw: TBlock): TPortableTextBlockWithResolvedLinks<TBlock> {
  return {
    ...raw,
    markDefs: raw.markDefs?.map(toPortableTextMarkDef) ?? undefined,
  };
}
