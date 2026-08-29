import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toLink } from '@blog/service/shared/transformers/to-link';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import { toRequiredSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { ctaModuleQuery } from './query';
import type { TCtaAction, TCtaModule } from './types';

export type TRawCtaModule = InferResultType<typeof ctaModuleQuery>;

export type TRawCtaAction = NonNullable<
  NonNullable<TRawCtaModule['actions']>['actions']
>[number];

function toCtaAction(raw: TRawCtaAction): TCtaAction | undefined {
  const link = toLink(raw.link);
  if (!link) return undefined;

  return {
    variant: raw.variant,
    appearance: raw.appearance ?? undefined,
    link,
  };
}

function toCtaActions(raw: TRawCtaModule['actions']): TCtaAction[] | undefined {
  const items = raw?.actions;
  if (!items || items.length === 0) return undefined;

  const actions = items
    .map(toCtaAction)
    .filter((action): action is TCtaAction => action !== undefined);

  return actions.length > 0 ? actions : undefined;
}

export function toCtaModule(raw: TRawCtaModule): TCtaModule {
  return {
    variant: raw.variant,
    brandVariant: raw.brandVariant,
    eyebrow: raw.eyebrow ?? undefined,
    sectionHeader: toRequiredSectionHeader(raw.sectionHeader),
    content: raw.content ?? undefined,
    image: toSanityImage(raw.image),
    imageSide: raw.imageSide ?? undefined,
    mobileMediaOrder: raw.mobileMediaOrder ?? undefined,
    actions: toCtaActions(raw.actions),
    footnote: raw.footnote ?? undefined,
    layout: toLayout(raw.layout),
  };
}
