import { q } from '@blog/service/sanity/query';
import { blockFaqFragment } from '@blog/service/shared/fragments/faq/block-faq';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

export const faqQuestionsQuery = q
  .parameters<{ ids: string[] } & TLocaleParams>()
  .star.filterByType('module_faq')
  .filterRaw('_id in $ids')
  .project((sub) => ({
    _id: true,
    questions: sub
      .field('questions[]')
      .deref()
      .project((questionSub) => blockFaqFragment(questionSub))
      .nullable(true),
  }));
