import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { faqQuestionsQuery } from './query';
import { toFaqModuleQuestions } from './transformer';
import type { TFaqModuleQuestions } from './types';

export async function getFaqQuestions(
  ids: string[],
  tenant: TTenantSanityContext,
): Promise<TFaqModuleQuestions[]> {
  const raw = await runQuery(faqQuestionsQuery, {
    parameters: { ids },
    tenant,
    ...isr(['modules:faq', 'block_faq', 'link'], tenant.projectId),
  });

  return toFaqModuleQuestions(raw, ids);
}
