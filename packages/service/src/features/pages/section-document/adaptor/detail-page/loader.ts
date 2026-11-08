import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
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
    ...isr(
      [
        'page_privacyDocument',
        'page_legalDocument',
        'link',
        'page_post',
        'topic',
        'homePage',
        'page_landing',
        'page_postIndex',
        'page_topic',
        'page_topicIndex',
        'page_tag',
        'page_tagIndex',
      ],
      tenant.projectId,
    ),
  });
  if (!raw) return undefined;

  return toSectionDocumentDetail(raw);
}
