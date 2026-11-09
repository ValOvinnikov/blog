import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { sectionDocumentByKindQuery } from './query';
import { toSectionDocumentLink } from './transformer';
import type { TSectionDocumentKind, TSectionDocumentLink } from './types';

export async function getSectionDocumentByKind(
  kind: TSectionDocumentKind,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TSectionDocumentLink>> {
  const raw = await runQuery(sectionDocumentByKindQuery, {
    parameters: { kind },
    tenant,
    ...isr(
      ['page_privacyDocument', 'page_legalDocument', 'page_cookieStatement'],
      tenant.projectId,
    ),
  });
  if (!raw) return undefined;

  return toSectionDocumentLink(raw);
}
