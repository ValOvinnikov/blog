import type { Aside, IBodyImageBlock, RichText } from '@blog/config';
import type { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text-body';
import {
  toProseTextBody,
  type TProseTextBody,
} from '@blog/service/shared/transformers/to-prose-text-body';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import {
  toSharedLinkAnnotation,
  type TPortableTextMarkDef,
} from '@blog/service/shared/transformers/to-shared-link-annotation';
import type { InferFragmentType } from 'groqd';

export type TRawPortableTextBody = Array<
  InferFragmentType<typeof portableTextBodyItemFragment>
>;

type TRawBodyImageBlock = Extract<
  TRawPortableTextBody[number],
  { _type: 'bodyImage' }
>;
type TRawTextBlock = Extract<TRawPortableTextBody[number], { _type: 'block' }>;
type TRawAsideBlock = Extract<TRawPortableTextBody[number], { _type: 'aside' }>;
type TRawMarkDef = NonNullable<TRawTextBlock['markDefs']>[number];

type TGeneratedTextBlock = Extract<RichText[number], { _type: 'block' }>;

export type TPortableTextTextBlock = Omit<TGeneratedTextBlock, 'markDefs'> & {
  markDefs: TPortableTextMarkDef[] | undefined;
};

export type TPortableTextAsideBlock = Omit<Aside, 'body'> & {
  _key: string;
  body: TProseTextBody | undefined;
};

export type TPortableTextBody = Array<
  | TPortableTextTextBlock
  | TPortableTextAsideBlock
  | IBodyImageBlock
  | Exclude<RichText[number], { _type: 'bodyImage' | 'block' | 'aside' }>
>;

function toBodyImageBlock(raw: TRawBodyImageBlock): IBodyImageBlock {
  return {
    _type: 'bodyImage',
    _key: raw._key,
    layout: raw.layout ?? undefined,
    image: toSanityImage(raw),
  };
}

function toMarkDef(raw: TRawMarkDef): TPortableTextMarkDef {
  if (raw._type === 'sharedLinkAnnotation') {
    return toSharedLinkAnnotation(raw);
  }

  return raw;
}

function toTextBlock(raw: TRawTextBlock): TPortableTextTextBlock {
  return {
    ...raw,
    markDefs: raw.markDefs?.map(toMarkDef) ?? undefined,
  };
}

function toAsideBlock(raw: TRawAsideBlock): TPortableTextAsideBlock {
  return {
    ...raw,
    body: raw.body ? toProseTextBody(raw.body) : undefined,
  };
}

export function toPortableTextBody(
  raw: TRawPortableTextBody,
): TPortableTextBody {
  return raw.map((block) => {
    if (block._type === 'bodyImage') {
      return toBodyImageBlock(block);
    }

    if (block._type === 'block') {
      return toTextBlock(block);
    }

    if (block._type === 'aside') {
      return toAsideBlock(block);
    }

    // `conditionalByType`'s `'...'` spread on this heterogeneous array
    // narrows a `code` member to `{ _key, _type }` in the static type, even
    // though the query returns every original field — safe to assert back
    // to its real shape.
    return block as Exclude<
      RichText[number],
      { _type: 'bodyImage' | 'block' | 'aside' }
    >;
  });
}
