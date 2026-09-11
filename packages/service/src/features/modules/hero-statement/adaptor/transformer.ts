import type { TMaybeUndefined } from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import {
  toCtaAction,
  type TCtaAction,
} from '@blog/service/shared/transformers/to-cta-action';
import { toRequiredHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import { toHeroPresentation } from '@blog/service/shared/transformers/to-hero-presentation';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { heroStatementModuleQuery } from './query';
import type { THeroStatementModule } from './types';

export type TRawHeroStatementModule = InferResultType<
  typeof heroStatementModuleQuery
>;

function toActions(
  raw: TRawHeroStatementModule['actions'],
): TMaybeUndefined<readonly TCtaAction[]> {
  const items = raw?.actions;
  if (!items || items.length === 0) return undefined;

  const actions = items
    .map(toCtaAction)
    .filter((action): action is TCtaAction => action !== undefined);

  return actions.length > 0 ? actions : undefined;
}

export function toHeroStatementModule(
  raw: TRawHeroStatementModule,
  tenant: TImageTenant,
): THeroStatementModule {
  const { contentPosition, mediaOrder } = toHeroPresentation(raw);
  const headingBlock = toRequiredHeadingBlock(raw.headingBlock);

  return {
    brandVariant: raw.brandVariant,
    variant: raw.variant,
    heading: headingBlock.heading,
    eyebrow: raw.eyebrow ?? undefined,
    supportingText: headingBlock.supportingText,
    sanityImage: toSanityImage(raw.image, tenant),
    actions: toActions(raw.actions),
    contentPosition,
    contentAlignment: raw.contentAlignment ?? undefined,
    mediaOrder,
    layout: toLayout(raw.layout),
  };
}
