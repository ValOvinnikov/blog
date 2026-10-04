import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { localizedHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/localized-heading-block';
import { localizedImageWithAltFragment } from '@blog/service/shared/fragments/image/localized-image-with-alt';
import { moduleLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextField } from '@blog/service/shared/localization/get-localized-portable-text-field/get-localized-portable-text-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

export const ctaModuleQuery = q
  .parameters<TModuleQueryParams & TLocaleParams>()
  .star.filterByType('module_cta')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    brandVariant: sub.field('brandVariant').notNull(),
    bandTone: sub.field('bandTone').nullable(true),
    eyebrow: getLocalizedField(sub, (filter) =>
      sub.field('eyebrow[]').filterBy(filter).slice(0).field('value'),
    ),
    headingBlock: sub
      .field('headingBlock')
      .project(localizedHeadingBlockFragment)
      .notNull(),
    content: getLocalizedPortableTextField(sub, (filter) =>
      sub.field('content[]').filterBy(filter).slice(0).field('value[]'),
    ),
    image: sub
      .field('image')
      .project(localizedImageWithAltFragment)
      .nullable(true),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    ...moduleContentAlignmentFragment,
    mobileMediaOrder: sub.field('mobileMediaOrder').nullable(true),
    ...ctaButtonsFragment,
    footnote: getLocalizedField(sub, (filter) =>
      sub.field('footnote[]').filterBy(filter).slice(0).field('value'),
    ),
    ...moduleLayoutFragment,
  }))
  .notNull();
