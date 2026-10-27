import { SIZE, type TMaybeUndefined } from '@blog/config';
import { hasArrayGotItems } from '@blog/utils/primitives';
import type { TLeadsLoading } from '@platform/components/features/leads/leads-inbox/use-leads-pages';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Spinner } from '@platform/components/shared/spinner';
import { Text } from '@platform/components/shared/text';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import { LeadRow } from './components/lead-row';
import { leadsListVariants } from './leads-list-variants';
import { useLoadMoreSentinel } from './use-load-more-sentinel';

export type TLeadsListProps = {
  leads: TInboxLead[];
  selectedId: TMaybeUndefined<string>;
  rowRef: (leadId: string) => Ref<HTMLButtonElement>;
  onOpen: (lead: TInboxLead) => void;
  loading: TLeadsLoading;
};

export const LeadsList = ({
  leads,
  selectedId,
  rowRef,
  onOpen,
  loading,
}: TLeadsListProps) => {
  const t = useTranslations('leadsInbox');
  const { hasMore, isLoading, hasLoadFailed, loadMore } = loading;
  const sentinelRef = useLoadMoreSentinel({
    isEnabled: hasMore && !isLoading && !hasLoadFailed,
    loadedCount: leads.length,
    onReach: loadMore,
  });
  const { list, sentinel, footer } = leadsListVariants();

  if (!hasArrayGotItems(leads)) {
    return (
      <Card>
        <Card.Body>
          <Text variant="supporting">{t('empty')}</Text>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <ul className={list()} aria-label={t('listLabel')}>
        {leads.map((lead) => (
          <li key={lead.id}>
            <LeadRow
              ref={rowRef(lead.id)}
              lead={lead}
              isSelected={lead.id === selectedId}
              onOpen={onOpen}
            />
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} className={sentinel()} aria-hidden="true" />
      {(isLoading || hasLoadFailed) && (
        <div className={footer()}>
          {isLoading ? (
            <Spinner label={t('loadingMore')} hasLabel={true} />
          ) : (
            <Button size={SIZE.SM} variant="secondary" onClick={loadMore}>
              {t('loadMoreFailed')}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
