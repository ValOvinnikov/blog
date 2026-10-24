import { SIZE } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import { ActivityList } from '@platform/components/features/tenants/activity-list';
import { Card } from '@platform/components/shared/card';
import { LinkButton } from '@platform/components/shared/link-button';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

export type TRecentActivityCardProps = {
  events: TAuditEvent[];
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
            {events.length > 0 && (
              <LinkButton
                href={viewAllHref}
                variant="ghost"
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
