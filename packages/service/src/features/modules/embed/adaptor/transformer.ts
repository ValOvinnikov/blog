import { parseEmbedUrl, type TMaybeUndefined } from '@blog/config';
import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { embedModuleQuery } from './query';
import type { TEmbed, TEmbedModule } from './types';

export type TRawEmbedModule = InferResultType<typeof embedModuleQuery>;

function toEmbed(raw: TRawEmbedModule['embed']): TMaybeUndefined<TEmbed> {
  const parsed = parseEmbedUrl(raw.url);

  if (!parsed) return undefined;

  return {
    ...parsed,
    title: raw.title,
    caption: raw.caption ?? undefined,
  };
}

export function toEmbedModule(raw: TRawEmbedModule): TEmbedModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    embed: toEmbed(raw.embed),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
