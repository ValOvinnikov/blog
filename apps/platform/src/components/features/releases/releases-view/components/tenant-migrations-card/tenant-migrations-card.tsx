import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { CardList } from '@platform/components/shared/card-list';
import type { TFailedMigrationTenant } from '@platform/server/releases/list-failed-migration-tenants';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import { formatDate } from '@platform/utils/format-date/format-date';
import { useLocale, useTranslations } from 'next-intl';

import { RunTenantMigrationsButton } from '../run-tenant-migrations-button/run-tenant-migrations-button';

export type TTenantMigrationsCardProps = {
  failedTenants: TReleaseResult<TFailedMigrationTenant[]>;
};

export const TenantMigrationsCard = ({
  failedTenants,
}: TTenantMigrationsCardProps) => {
  const t = useTranslations('tenantMigrationsCard');
  const locale = useLocale();

  return (
    <Card>
      <Card.Header
        title={t('title')}
        supportingText={t('description')}
        actions={<RunTenantMigrationsButton />}
      />
      <Card.Body>
        {failedTenants.ok ? (
          <CardList
            items={failedTenants.data}
            emptyMessage={t('empty')}
            renderRow={({ id, name, failedAt }) => (
              <CardList.Row key={id}>
                <CardList.Primary>{name}</CardList.Primary>
                <CardList.Secondary>{t('failed')}</CardList.Secondary>
                <CardList.Time date={failedAt}>
                  {formatDate(failedAt, locale)}
                </CardList.Time>
                <RunTenantMigrationsButton retryTenant={{ id, name }} />
              </CardList.Row>
            )}
          />
        ) : (
          <Alert
            type={ALERT_TYPE.WARNING}
            title={t('unavailableTitle')}
            description={t('unavailableDescription')}
          />
        )}
      </Card.Body>
    </Card>
  );
};
