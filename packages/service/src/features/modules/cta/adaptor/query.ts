import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { localizedHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/localized-heading-block';
import { localizedSanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { moduleLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { listedTextBlockFragment } from '@blog/service/shared/fragments/portable-text/listed-text-block';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params';
import {
  localizedField,
  localizedProjectedField,
} from '@blog/service/shared/localization/localized-value';

export const ctaModuleQuery = q
  .parameters<TModuleQueryParams & TLocaleParams>()
  .star.filterByType('module_cta')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    brandVariant: sub.field('brandVariant').notNull(),
    bandTone: sub.field('bandTone').nullable(true),
    eyebrow: localizedField(sub, 'eyebrow'),
    headingBlock: sub
      .field('headingBlock')
      .project(localizedHeadingBlockFragment)
      .notNull(),
    content: localizedProjectedField(sub, (condition) =>
      sub
        .field('content[]')
        .filterBy(condition)
        .slice(0)
        .field('value[]')
        .project(listedTextBlockFragment)
        .nullable(true),
    ),
    image: sub
      .field('image')
      .project(localizedSanityImageFragment)
      .nullable(true),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    ...moduleContentAlignmentFragment,
    mobileMediaOrder: sub.field('mobileMediaOrder').nullable(true),
    ...ctaButtonsFragment,
    footnote: localizedField(sub, 'footnote'),
    ...moduleLayoutFragment,
  }))
  .notNull();
