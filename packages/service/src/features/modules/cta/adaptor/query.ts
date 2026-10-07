import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/module-heading-block';
import { localizedImageWithAltFragment } from '@blog/service/shared/fragments/image/localized-image-with-alt';
import { moduleCtaLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@blog/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';

export const ctaModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_cta')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    brandVariant: sub.field('brandVariant').notNull(),
    bandTone: sub.field('bandTone').nullable(true),
    eyebrow: getLocalizedField(sub, 'eyebrow'),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    content: getLocalizedPortableTextBlock(sub, 'content'),
    image: sub
      .field('image')
      .project(localizedImageWithAltFragment)
      .nullable(true),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    ...moduleContentAlignmentFragment,
    mobileMediaOrder: sub.field('mobileMediaOrder').nullable(true),
    ...ctaButtonsFragment,
    footnote: getLocalizedField(sub, 'footnote'),
    ...moduleCtaLayoutFragment,
  }))
  .notNull();
