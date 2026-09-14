import type { ProseText } from '@blog/config';
import type { proseTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text-body';
import {
  toSharedLinkAnnotation,
  type TPortableTextMarkDef,
} from '@blog/service/shared/transformers/to-shared-link-annotation';
import type { InferFragmentType } from 'groqd';

export type TRawProseTextBody = Array<
  InferFragmentType<typeof proseTextBodyItemFragment>
>;

type TRawMarkDef = NonNullable<TRawProseTextBody[number]['markDefs']>[number];

export type TProseTextBlock = Omit<ProseText[number], 'markDefs'> & {
  markDefs: TPortableTextMarkDef[] | undefined;
};

export type TProseTextBody = TProseTextBlock[];

function toMarkDef(raw: TRawMarkDef): TPortableTextMarkDef {
  if (raw._type === 'sharedLinkAnnotation') {
    return toSharedLinkAnnotation(raw);
  }

  return raw;
}

function toProseTextBlock(raw: TRawProseTextBody[number]): TProseTextBlock {
  return {
    ...raw,
    markDefs: raw.markDefs?.map(toMarkDef) ?? undefined,
  };
}

export function toProseTextBody(raw: TRawProseTextBody): TProseTextBody {
  return raw.map(toProseTextBlock);
}
