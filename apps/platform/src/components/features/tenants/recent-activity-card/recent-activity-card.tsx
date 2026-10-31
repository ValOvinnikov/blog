import { SIZE } from '@blog/config';
import type { TListedAuditEvent } from '@blog/db/queries/audit-events';
import { hasArrayGotItems } from '@blog/utils/primitives';
import { ActivityList } from '@platform/components/features/tenants/activity-list';
import { Card } from '@platform/components/shared/card';
import { LinkButton } from '@platform/components/shared/link-button';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
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
