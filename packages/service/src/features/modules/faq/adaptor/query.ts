import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { blockFaqFragment } from '@blog/service/shared/fragments/faq/block-faq';
import { localizedHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/localized-heading-block';
import { moduleLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';

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
      .project((questionSub) => {
        const { _id, question, answer } = blockFaqFragment(questionSub);

        return { _id, question: question.notNull(), answer: answer.notNull() };
      })
      .notNull(),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleLayoutFragment,
  }))
  .notNull();
