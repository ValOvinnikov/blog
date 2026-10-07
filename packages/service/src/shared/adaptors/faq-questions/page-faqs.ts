import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import {
  resolveFaqs,
  type TFaqPageQuestion,
} from '@blog/service/shared/transformers/faq/resolve-faqs';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';

import { getFaqQuestions } from './loader';

export async function getPageFaqs(
  modules: TModule[],
  tenant: TTenantSanityContext,
): Promise<TFaqPageQuestion[]> {
  const faqModuleIds = modules
    .filter((module) => module.type === 'module_faq')
    .map((module) => module.id);
  if (faqModuleIds.length === 0) return [];

  return resolveFaqs(await getFaqQuestions(faqModuleIds, tenant));
}
