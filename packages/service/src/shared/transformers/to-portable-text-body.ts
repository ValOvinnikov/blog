import type {
  IBodyImageBlock,
  RichText,
  TPortableTextBody,
} from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import type { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text-body';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferFragmentType } from 'groqd';

export type TRawPortableTextBody = Array<
  InferFragmentType<typeof portableTextBodyItemFragment>
>;

type TRawBodyImageBlock = Extract<
  TRawPortableTextBody[number],
  { _type: 'bodyImage' }
>;

function toBodyImageBlock(
  raw: TRawBodyImageBlock,
  tenant: TImageTenant,
): IBodyImageBlock {
  return {
    _type: 'bodyImage',
    _key: raw._key,
    layout: raw.layout ?? undefined,
    image: toSanityImage(raw, tenant),
  };
}

export function toPortableTextBody(
  raw: TRawPortableTextBody,
  tenant: TImageTenant,
): TPortableTextBody {
  return raw.map((block) => {
    if (block._type === 'bodyImage') {
      return toBodyImageBlock(block, tenant);
    }

    // `conditionalByType`'s `'...'` spread on this heterogeneous array
    // narrows every non-`bodyImage` member to `{ _key, _type }` in the
    // static type, even though the query returns every original field —
    // safe to assert back to its real shape.
    return block as Exclude<RichText[number], { _type: 'bodyImage' }>;
  });
}
