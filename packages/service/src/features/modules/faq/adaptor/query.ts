import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { listedTextBlockFragment } from '@blog/service/shared/fragments/portable-text/listed-text-block';

export const faqModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_faq')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    questions: sub
      .field('questions[]')
      .deref()
      .project((questionSub) => ({
        _id: true,
        question: questionSub.field('question').notNull(),
        answer: questionSub
          .field('answer[]')
          .project(listedTextBlockFragment)
          .notNull(),
      }))
      .notNull(),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
