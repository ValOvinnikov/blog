import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/module-heading-block';
import { localizedImageWithAltFragment } from '@blog/service/shared/fragments/image/localized-image-with-alt';
import { optionalImage } from '@blog/service/shared/fragments/image/optional-image';
import { moduleHeroLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { personDetailFragment } from '@blog/service/shared/fragments/person/person';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import { z } from 'zod';

export const heroProfileModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_heroProfile')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    variant: sub.field('variant').notNull(),
    eyebrow: getLocalizedField(sub, 'eyebrow'),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    image: optionalImage(sub, 'image', localizedImageWithAltFragment),
    showSocialLinks: sub.raw('coalesce(showSocialLinks, true)', z.boolean()),
    showRole: sub.raw('coalesce(showRole, true)', z.boolean()),
    showBio: sub.raw('coalesce(showBio, true)', z.boolean()),
    author: sub.field('author').deref().project(personDetailFragment).notNull(),
    ...ctaButtonsFragment,
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    ...moduleContentAlignmentFragment,
    mediaOrderSplit: sub.field('mediaOrderSplit').nullable(true),
    ...moduleHeroLayoutFragment,
  }))
  .notNull();
