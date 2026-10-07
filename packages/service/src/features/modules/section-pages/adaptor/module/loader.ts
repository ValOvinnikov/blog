import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { sectionPagesModuleQuery } from './query';
import { toSectionPagesModuleDocument } from './transformer';
import type { TSectionPagesModuleDocument } from './types';

export async function getSectionPagesModuleDocument(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TSectionPagesModuleDocument> {
  const raw = await runQuery(sectionPagesModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:sectionPages', `module:${id}`], tenant.projectId),
  });

  return toSectionPagesModuleDocument(raw);
}
