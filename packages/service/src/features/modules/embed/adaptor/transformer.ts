import { parseEmbedUrl, type TMaybeUndefined } from '@shinefold/config';
import { toCtaButtons } from '@shinefold/service/shared/transformers/cta/to-cta-buttons';
import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
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
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    embed: toEmbed(raw.embed),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
