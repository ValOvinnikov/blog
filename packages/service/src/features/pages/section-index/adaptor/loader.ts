import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { buildLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

import { sectionIndexPageQuery } from './query';
import { toSectionIndexPage } from './transformer';
import type { TSectionIndexPageDocument, TSectionIndexType } from './types';

const SECTION_INDEX_CACHE: Record<
  TSectionIndexType,
  (projectId: string) => ReturnType<typeof isr>
> = {
  page_privacyIndex: (projectId) =>
    isr(['page_privacyIndex', 'template_privacyIndex'], projectId),
  page_legalIndex: (projectId) =>
    isr(['page_legalIndex', 'template_legalIndex'], projectId),
};

export async function getSectionIndexPageDocument(
  type: TSectionIndexType,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TSectionIndexPageDocument>> {
  const raw = await runQuery(sectionIndexPageQuery(type), {
    tenant,
    ...SECTION_INDEX_CACHE[type](tenant.projectId),
  });
  if (!raw) return undefined;

  return toSectionIndexPage(raw, buildLocaleQueryParams(tenant).defaultLocale);
}
