import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { sectionPagesQuery } from './query';
import { toSectionPageCards } from './transformer';
import type { TSectionPageCard } from './types';

export async function getSectionPages(
  parentId: string,
  parentPath: string,
  tenant: TTenantSanityContext,
): Promise<TSectionPageCard[]> {
  const raw = await runQuery(sectionPagesQuery, {
    parameters: { parentId },
    tenant,
    ...isr(['page_landing'], tenant.projectId),
  });

  return toSectionPageCards(raw, parentPath);
}
