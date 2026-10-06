import type { TMaybeUndefined } from '@blog/config';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import {
  resolveFaqs,
  type TFaqPageQuestion,
} from '@blog/service/shared/transformers/faq/resolve-faqs';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';

import { getFaqQuestions } from './loader';

export type TWithPageFaqs<T> = T & { faqs: TFaqPageQuestion[] };

export async function withPageFaqs<T extends { modules: TModule[] }>(
  page: TMaybeUndefined<T>,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TWithPageFaqs<T>>> {
  if (!page) return undefined;

  const faqModuleIds = page.modules
    .filter((module) => module.type === 'module_faq')
    .map((module) => module.id);
  if (faqModuleIds.length === 0) return { ...page, faqs: [] };

  return {
    ...page,
    faqs: resolveFaqs(await getFaqQuestions(faqModuleIds, tenant)),
  };
}
