import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { localizedHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/localized-heading-block';
import { localizedSanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { moduleLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { listedTextBlockFragment } from '@blog/service/shared/fragments/portable-text/listed-text-block';
import {
  localizedEntries,
  localizedProjectedEntries,
} from '@blog/service/shared/localization/localized-entries';

export const ctaModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_cta')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    brandVariant: sub.field('brandVariant').notNull(),
    bandTone: sub.field('bandTone').nullable(true),
    eyebrow: localizedEntries(sub, 'eyebrow'),
    headingBlock: sub
      .field('headingBlock')
      .project(localizedHeadingBlockFragment)
      .notNull(),
    content: localizedProjectedEntries(sub, 'content', listedTextBlockFragment),
    image: sub
      .field('image')
      .project(localizedSanityImageFragment)
      .nullable(true),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    ...moduleContentAlignmentFragment,
    mobileMediaOrder: sub.field('mobileMediaOrder').nullable(true),
    ...ctaButtonsFragment,
    footnote: localizedEntries(sub, 'footnote'),
    ...moduleLayoutFragment,
  }))
  .notNull();
