import { AUDIT_ACTION, type TAuditAction } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import { Card } from '@platform/components/shared/card';
import { Text } from '@platform/components/shared/text';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { useTranslations } from 'next-intl';

import { recentActivityCardVariants } from './recent-activity-card-variants';

export type TRecentActivityCardProps = {
  events: TAuditEvent[];
};

const ACTIVITY_GLYPH: Record<TAuditAction, string> = {
  [AUDIT_ACTION.CREATED]: '+',
  [AUDIT_ACTION.DEPROVISION_REQUESTED]: '⏻',
  [AUDIT_ACTION.DEPROVISIONED]: '⏸',
  [AUDIT_ACTION.PROVISIONED]: '✓',
  [AUDIT_ACTION.PROVISIONING_FAILED]: '⚠',
  [AUDIT_ACTION.SETTINGS_UPDATED]: '⚙',
  [AUDIT_ACTION.DELETED]: '✕',
};

export const RecentActivityCard = ({ events }: TRecentActivityCardProps) => {
  const t = useTranslations('tenantOverviewPage');
  const {
    activityList,
    activityRow,
    activityIcon,
    activityBody,
    activityMessage,
    activitySub,
    activityTime,
    activityEmpty,
  } = recentActivityCardVariants();

  return (
    <Card>
      <Card.Header
        title={t('recentActivityCardTitle')}
        headingLevel={2}
        actions={
          <Text variant="hint" as="span">
            {t('recentActivitySourceLabel')}
          </Text>
        }
      />
      <Card.Body>
        {events.length === 0 ? (
          <p className={activityEmpty()}>{t('activityEmpty')}</p>
        ) : (
          <div className={activityList()}>
            {events.map((event) => (
              <div className={activityRow()} key={event.id}>
                <span className={activityIcon()} aria-hidden="true">
                  {ACTIVITY_GLYPH[event.action]}
                </span>
                <div className={activityBody()}>
                  <span className={activityMessage()}>
                    {t(`activityAction.${event.action}`)}
                  </span>
                  <span className={activitySub()}>{event.actorEmail}</span>
                </div>
                <time
                  dateTime={event.createdAt.toISOString()}
                  className={activityTime()}
                >
                  {formatRelativeTime(event.createdAt, t)}
                </time>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
