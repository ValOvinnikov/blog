import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { localizedHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/localized-heading-block';
import { moduleLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@blog/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';

export const faqModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_faq')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(localizedHeadingBlockFragment)
      .notNull(),
    questions: sub
      .field('questions[]')
      .deref()
      .project((questionSub) => ({
        _id: true,
        question: getLocalizedField(questionSub, 'question').notNull(),
        answer: getLocalizedPortableTextBlock(questionSub, 'answer').notNull(),
      }))
      .notNull(),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleLayoutFragment,
  }))
  .notNull();
