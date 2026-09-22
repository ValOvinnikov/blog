import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type IPortableTextLinkMark,
  type TPortableTextBlock,
} from '@blog/config';
import type { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text/portable-text-mark-def';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import type { InferFragmentType } from 'groqd';

export type TRawPortableTextMarkDef = InferFragmentType<
  typeof portableTextMarkDefFragment
>;

type TRawPortableTextSpan = {
  _type: 'span';
  _key: string;
  text?: string;
  marks?: string[];
};

function toPortableTextMarkDef(
  raw: TRawPortableTextMarkDef,
): IPortableTextLinkMark {
  const link = toLinkDocument(raw.link);

  return {
    _key: raw._key,
    _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
    link: link && { href: link.href, target: link.target },
  };
}

export function toPortableText<
  TBlock extends {
    _type: 'block';
    _key: string;
    children?: TRawPortableTextSpan[] | null;
    markDefs?: TRawPortableTextMarkDef[] | null;
  },
>(raw: TBlock): TPortableTextBlock {
  return {
    ...raw,
    _type: 'block',
    children: (raw.children ?? []).map((span) => ({
      ...span,
      text: span.text ?? '',
    })),
    markDefs: raw.markDefs?.map(toPortableTextMarkDef) ?? undefined,
  };
}
