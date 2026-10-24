import type { TMaybeUndefined } from '@blog/config';
import {
  useLeadPageTitleCache,
  useLeadsTenantId,
} from '@platform/components/features/leads/leads-tenant-provider';
import { getLeadPageTitleAction } from '@platform/server/leads/get-lead-page-title-action';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { useEffect, useState } from 'react';

type TResolvedTitle = { key: string; title: TMaybeUndefined<string> };

export const useLeadPageTitle = ({
  sourceDocumentId,
  sourceLocale,
}: Pick<
  TInboxLead,
  'sourceDocumentId' | 'sourceLocale'
>): TMaybeUndefined<string> => {
  const tenantId = useLeadsTenantId();
  const cache = useLeadPageTitleCache();
  const [resolved, setResolved] = useState<TResolvedTitle>();
  const key =
    sourceDocumentId && sourceLocale
      ? `${sourceDocumentId}:${sourceLocale}`
      : undefined;

  useEffect(() => {
    if (!key || !sourceDocumentId || !sourceLocale) return;

    let pending = cache.get(key);
    if (!pending) {
      pending = getLeadPageTitleAction({
        tenantId,
        documentId: sourceDocumentId,
        locale: sourceLocale,
      }).catch(() => undefined);
      cache.set(key, pending);
    }

    let isCurrent = true;
    void pending.then((title) => {
      if (isCurrent) setResolved({ key, title });
    });
    return () => {
      isCurrent = false;
    };
  }, [cache, key, tenantId, sourceDocumentId, sourceLocale]);

  return resolved?.key === key ? resolved?.title : undefined;
};
