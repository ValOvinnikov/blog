import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@shinefold/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';

export const contactFormModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_contactForm')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    successMessage: getLocalizedField(sub, 'successMessage').notNull(),
    privacyNote: getLocalizedPortableTextBlock(sub, 'privacyNote'),
    ...moduleLayoutFragment,
    ...moduleContentAlignmentLeftCenterFragment,
  }))
  .notNull();
