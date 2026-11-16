import { ActivityList } from '@platform/components/features/tenants/activity-list';
import { Card } from '@platform/components/shared/card';
import { LinkButton } from '@platform/components/shared/link-button';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { SIZE } from '@shinefold/config';
import type { TListedAuditEvent } from '@shinefold/db/queries/audit-events';
import { hasArrayGotItems } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

export type TRecentActivityCardProps = {
  events: TListedAuditEvent[];
  viewAllHref: string;
};

export const RecentActivityCard = ({
  events,
  viewAllHref,
}: TRecentActivityCardProps) => {
  const t = useTranslations('tenantOverviewPage');

  return (
    <Card>
      <Card.Header
        title={t('recentActivityCardTitle')}
        actions={
          <>
            <Text variant="meta" as="span">
              {t('recentActivitySourceLabel')}
            </Text>
            {hasArrayGotItems(events) && (
              <LinkButton
                href={viewAllHref}
                variant={BUTTON_VARIANT.GHOST}
                size={SIZE.SM}
                hasArrow={true}
              >
                {t('viewAllActivityLink')}
              </LinkButton>
            )}
          </>
        }
      />
      <Card.Body>
        <ActivityList events={events} />
      </Card.Body>
    </Card>
  );
};
