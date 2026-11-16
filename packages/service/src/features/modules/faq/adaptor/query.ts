import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { ctaButtonsFragment } from '@shinefold/service/shared/fragments/cta/cta-buttons';
import { blockFaqFragment } from '@shinefold/service/shared/fragments/faq/block-faq';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleAppearanceFragment } from '@shinefold/service/shared/fragments/module/module-appearance';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';

export const faqModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_faq')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    questions: sub
      .field('questions[]')
      .deref()
      .project((questionSub) => {
        const { _id, question, answer } = blockFaqFragment(questionSub);

        return { _id, question: question.notNull(), answer: answer.notNull() };
      })
      .notNull(),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleLayoutFragment,
    ...moduleAppearanceFragment,
  }))
  .notNull();
