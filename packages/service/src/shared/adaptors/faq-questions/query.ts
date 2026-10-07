import { q } from '@blog/service/sanity/query/query';
import { blockFaqFragment } from '@blog/service/shared/fragments/faq/block-faq';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const faqQuestionsQuery = q
  .parameters<{ ids: string[] } & TLocaleQueryParams>()
  .star.filterByType('module_faq')
  // groqd's typed filterBy has no `in` operator
  .filterRaw('_id in $ids')
  .project((sub) => ({
    _id: true,
    questions: sub
      .field('questions[]')
      .deref()
      .project((questionSub) => blockFaqFragment(questionSub))
      .nullable(true),
  }));
