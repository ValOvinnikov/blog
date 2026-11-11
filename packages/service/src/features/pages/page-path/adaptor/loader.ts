import type { TMaybeUndefined } from '@blog/config';
import { SANITY_PERSPECTIVE } from '@blog/config/constants';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { draftPagePathQuery } from './query';
import { toDraftPagePath } from './transformer';
import type { TDraftPagePath } from './types';

export async function getDraftPagePath(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TDraftPagePath>> {
  const raw = await runQuery(draftPagePathQuery, {
    tenant: { ...tenant, perspective: SANITY_PERSPECTIVE.DRAFTS },
    parameters: { id },
  });
  if (!raw) return undefined;

  return toDraftPagePath(raw);
}
