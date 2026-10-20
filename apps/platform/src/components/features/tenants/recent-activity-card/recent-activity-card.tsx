import { AUDIT_ACTION, ICONS, SIZE, type TAuditAction } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import { Card } from '@platform/components/shared/card';
import { CardList } from '@platform/components/shared/card-list';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { Text } from '@platform/components/shared/text';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { useLocale, useTranslations } from 'next-intl';

import { recentActivityCardVariants } from './recent-activity-card-variants';

export type TRecentActivityCardProps = {
  events: TAuditEvent[];
};

const ACTIVITY_ICON = {
  [AUDIT_ACTION.CREATED]: ICONS.PLUS,
  [AUDIT_ACTION.DEPROVISION_REQUESTED]: ICONS.CLOCK,
  [AUDIT_ACTION.DEPROVISIONED]: ICONS.POWER,
  [AUDIT_ACTION.REACTIVATED]: ICONS.ROCKET,
  [AUDIT_ACTION.SUSPENSION_APPLIED]: ICONS.LOCK,
  [AUDIT_ACTION.SUSPENSION_LIFTED]: ICONS.ZAP,
  [AUDIT_ACTION.PROVISIONED]: ICONS.CHECK,
  [AUDIT_ACTION.PROVISIONING_FAILED]: ICONS.WARNING,
  [AUDIT_ACTION.SETTINGS_UPDATED]: ICONS.SETTINGS,
  [AUDIT_ACTION.DELETED]: ICONS.CLOSE,
  [AUDIT_ACTION.READER_DATA_PURGED]: ICONS.USERS,
  [AUDIT_ACTION.RELEASE_STARTED]: ICONS.ARROW_UP,
  [AUDIT_ACTION.RELEASE_OVERRIDE]: ICONS.SHIELD_CHECK,
  [AUDIT_ACTION.CONTRAST_CHECK_STARTED]: ICONS.PALETTE,
  [AUDIT_ACTION.TENANT_MIGRATIONS_STARTED]: ICONS.LAYERS,
} as const satisfies Record<TAuditAction, TRegisteredIconName>;

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
                <span className={activityIcon()}>
                  <Icon name={ACTIVITY_ICON[event.action]} size={SIZE.SM} />
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
