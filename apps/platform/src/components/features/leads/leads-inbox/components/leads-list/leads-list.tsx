import type { TLeadsLoading } from '@platform/components/features/leads/leads-inbox/use-leads-pages';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Spinner } from '@platform/components/shared/spinner';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { SIZE, type TMaybeUndefined } from '@shinefold/config';
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
  const { groups, sentinel, footer } = leadsListVariants();
  const hasEarlier = hasArrayGotItems(earlierLeads);

  if (!hasArrayGotItems(unreadLeads) && !hasEarlier) {
    return (
      <Card>
        <Card.Body>
          <Text variant="supporting">{t('empty')}</Text>
        </Card.Body>
      </Card>
    );
  }

  const loadFooter = (isLoading || hasLoadFailed) && (
    <div className={footer()}>
      {isLoading ? (
        <Spinner label={t('loadingMore')} hasLabel={true} />
      ) : (
        <Button
          size={SIZE.SM}
          variant={BUTTON_VARIANT.SECONDARY}
          onClick={loadMore}
        >
          {t('loadMoreFailed')}
        </Button>
      )}
    </div>
  );

  const groupProps = { selectedId, rowRef, onOpen };

  return (
    <>
      <div className={groups()}>
        {hasArrayGotItems(unreadLeads) && (
          <LeadGroup
            title={t('unreadGroup', { count: unreadLeads.length })}
            leads={unreadLeads}
            footer={hasEarlier ? undefined : loadFooter}
            {...groupProps}
          />
        )}
        {hasEarlier && (
          <LeadGroup
            title={t('earlierGroup')}
            leads={earlierLeads}
            footer={loadFooter}
            {...groupProps}
          />
        )}
      </div>
      <div ref={sentinelRef} className={sentinel()} aria-hidden="true" />
    </>
  );
};
