import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';
import type { TSectionDocumentType } from '@blog/service/shared/types/page/section-document-type';

import { sectionDocumentPageQuery } from './query';
import { toSectionDocumentDetail } from './transformer';
import type { TSectionDocumentDetail } from './types';

export async function getSectionDocument(
  type: TSectionDocumentType,
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TSectionDocumentDetail>> {
  const raw = await runQuery(sectionDocumentPageQuery, {
    parameters: { type, slug },
    tenant,
    ...isr(['topic', ...LINK_TARGET_CACHE_TAGS], tenant.projectId),
  });
  if (!raw) return undefined;

  return toSectionDocumentDetail(raw);
}
