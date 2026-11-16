import type { TMaybeUndefined } from '@shinefold/config';
import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { toPublishedId } from '@shinefold/utils/sanity-document-id';

import { draftPagePathQuery } from './query';
import { toDraftPagePath } from './transformer';
import type { TDraftPagePath } from './types';

export async function getDraftPagePath(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TDraftPagePath>> {
  const raw = await runQuery(draftPagePathQuery, {
    tenant: { ...tenant, perspective: SANITY_PERSPECTIVE.DRAFTS },
    parameters: { id: toPublishedId(id) },
  });
  if (!raw) return undefined;

  return toDraftPagePath(raw);
}
