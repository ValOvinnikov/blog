import { BRAND_VARIANT, HERO_VARIANT } from '@shinefold/config/constants';
import type { Module_heroStatement } from '@shinefold/config/sanity/generated/types';

import type { TStarterModule } from './starter-document';
import { localizedString, moduleHeadingBlock } from './starter-fields';
import { ctaButton } from './starter-links';
import type { TModuleInput } from './starter-modules';

export function buildStatementHero({
  id,
  locale,
  hero: { eyebrow, heading, supportingText },
  linkId,
}: Omit<TModuleInput, 'title'> & {
  hero: { eyebrow: string; heading: string; supportingText: string };
  linkId: string;
}): TStarterModule<Module_heroStatement> {
  return {
    _id: id,
    _type: 'module_heroStatement',
    title: 'Statement Hero',
    brandVariant: BRAND_VARIANT.PRIMARY,
    variant: HERO_VARIANT.STACKED,
    headingBlock: moduleHeadingBlock(locale, heading, supportingText),
    eyebrow: localizedString(locale, eyebrow),
    ctaButtons: [ctaButton(linkId)],
  };
}
