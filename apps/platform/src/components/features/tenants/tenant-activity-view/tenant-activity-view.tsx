import type { TAuditEvent } from '@blog/db/schema/audit-events';
import { ActivityList } from '@platform/components/features/tenants/activity-list';
import { Card } from '@platform/components/shared/card';
import { PageHeader } from '@platform/components/shared/page-header';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { tenantActivityViewVariants } from './tenant-activity-view-variants';

export type TTenantActivityViewProps = {
  events: TAuditEvent[];
  pagination: ReactNode;
};

export const TenantActivityView = ({
  events,
  pagination,
}: TTenantActivityViewProps) => {
  const t = useTranslations('tenantActivityPage');
  const { root } = tenantActivityViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      <Card>
        <Card.Body>
          <ActivityList events={events} />
        </Card.Body>
      </Card>
      {pagination}
    </div>
  );
};
