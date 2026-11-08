import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

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
    ...isr(
      ['modules:faq', 'block_faq', ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toFaqModuleQuestions(raw, ids);
}
