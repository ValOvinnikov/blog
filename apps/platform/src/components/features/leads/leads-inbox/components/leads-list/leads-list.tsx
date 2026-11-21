import type { TLeadsLoading } from '@platform/components/features/leads/leads-inbox/use-leads-pages';
import { Card } from '@platform/components/shared/card';
import { Text } from '@platform/components/shared/text';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import type { TMaybeUndefined } from '@shinefold/config';
import { hasArrayGotItems } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import { LeadGroup } from './components/lead-group';
import { leadsListVariants } from './leads-list-variants';
import { useLoadMoreSentinel } from './use-load-more-sentinel';

export type TLeadsListProps = {
  unreadLeads: TInboxLead[];
  earlierLeads: TInboxLead[];
  selectedId: TMaybeUndefined<string>;
  rowRef: (leadId: string) => Ref<HTMLButtonElement>;
  onOpen: (lead: TInboxLead) => void;
  loading: TLeadsLoading;
};

export const LeadsList = ({
  unreadLeads,
  earlierLeads,
  selectedId,
  rowRef,
  onOpen,
  loading,
}: TLeadsListProps) => {
  const t = useTranslations('leadsInbox');
  const { hasMore, isLoading, hasLoadFailed, loadMore } = loading;
  const sentinelRef = useLoadMoreSentinel({
    isEnabled: hasMore && !isLoading && !hasLoadFailed,
    loadedCount: unreadLeads.length + earlierLeads.length,
    onReach: loadMore,
  });
  const { groups, sentinel } = leadsListVariants();
  const hasUnread = hasArrayGotItems(unreadLeads);
  const hasEarlier = hasArrayGotItems(earlierLeads);

  if (!hasUnread && !hasEarlier) {
    return (
      <Card>
        <Card.Body>
          <Text variant="supporting">{t('empty')}</Text>
        </Card.Body>
      </Card>
    );
  }

  const groupProps = { selectedId, rowRef, onOpen };

  return (
    <>
      <div className={groups()}>
        {hasUnread && (
          <LeadGroup
            title={t('unreadGroup', { count: unreadLeads.length })}
            leads={unreadLeads}
            loading={hasEarlier ? undefined : loading}
            {...groupProps}
          />
        )}
        {hasEarlier && (
          <LeadGroup
            title={t('earlierGroup')}
            leads={earlierLeads}
            loading={loading}
            {...groupProps}
          />
        )}
      </div>
      <div ref={sentinelRef} className={sentinel()} aria-hidden="true" />
    </>
  );
};
