import { AUDIT_ACTION, type TAuditAction } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import { Card } from '@platform/components/shared/card';
import { CardList } from '@platform/components/shared/card-list';
import { Text } from '@platform/components/shared/text';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { useLocale, useTranslations } from 'next-intl';

import { recentActivityCardVariants } from './recent-activity-card-variants';

export type TRecentActivityCardProps = {
  events: TAuditEvent[];
};

const ACTIVITY_GLYPH: Record<TAuditAction, string> = {
  [AUDIT_ACTION.CREATED]: '+',
  [AUDIT_ACTION.DEPROVISION_REQUESTED]: '⏻',
  [AUDIT_ACTION.DEPROVISIONED]: '⏸',
  [AUDIT_ACTION.REACTIVATED]: '↺',
  [AUDIT_ACTION.PROVISIONED]: '✓',
  [AUDIT_ACTION.PROVISIONING_FAILED]: '⚠',
  [AUDIT_ACTION.SETTINGS_UPDATED]: '⚙',
  [AUDIT_ACTION.DELETED]: '✕',
  [AUDIT_ACTION.READER_DATA_PURGED]: '🗑',
  [AUDIT_ACTION.RELEASE_STARTED]: '⇪',
  [AUDIT_ACTION.RELEASE_OVERRIDE]: '⚑',
  [AUDIT_ACTION.CONTRAST_CHECK_STARTED]: '◐',
  [AUDIT_ACTION.TENANT_MIGRATIONS_STARTED]: '⇄',
};

export const RecentActivityCard = ({ events }: TRecentActivityCardProps) => {
  const t = useTranslations('tenantOverviewPage');
  const locale = useLocale();
  const { activityIcon } = recentActivityCardVariants();

  return (
    <Card>
      <Card.Header
        title={t('recentActivityCardTitle')}
        actions={
          <Text variant="meta" as="span">
            {t('recentActivitySourceLabel')}
          </Text>
        }
      />
      <Card.Body>
        <CardList
          items={events}
          emptyMessage={t('activityEmpty')}
          renderRow={(event) => (
            <CardList.Row key={event.id}>
              <CardList.Lead>
                <span className={activityIcon()} aria-hidden="true">
                  {ACTIVITY_GLYPH[event.action]}
                </span>
              </CardList.Lead>
              <CardList.Primary>
                {t(`activityAction.${event.action}`)}
              </CardList.Primary>
              <CardList.Secondary>{event.actorEmail}</CardList.Secondary>
              <CardList.Time date={event.createdAt}>
                {formatRelativeTime(event.createdAt, t, locale)}
              </CardList.Time>
            </CardList.Row>
          )}
        />
      </Card.Body>
    </Card>
  );
};
