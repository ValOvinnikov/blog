import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { childPagesQuery } from './query';
import { toChildPageCards } from './transformer';
import type { TChildPageCard } from './types';

export async function getChildPages(
  parentId: string,
  parentPath: string,
  tenant: TTenantSanityContext,
): Promise<TChildPageCard[]> {
  const raw = await runQuery(childPagesQuery, {
    parameters: { parentId },
    tenant,
    ...isr(['page_landing'], tenant.projectId),
  });

  return toChildPageCards(raw, parentPath);
}
