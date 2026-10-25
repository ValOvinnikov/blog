import type { TListedAuditEvent } from '@blog/db/queries/audit-events';
import { ActivityList } from '@platform/components/features/tenants/activity-list';
import { Card } from '@platform/components/shared/card';
import { PageHeader } from '@platform/components/shared/page-header';
import { PageStack } from '@platform/components/shared/page-stack';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export type TTenantActivityViewProps = {
  events: TListedAuditEvent[];
  pagination: ReactNode;
};

export const TenantActivityView = ({
  events,
  pagination,
}: TTenantActivityViewProps) => {
  const t = useTranslations('tenantActivityPage');

  return (
    <PageStack>
      <PageHeader title={t('title')} description={t('description')} />
      <Card>
        <Card.Body>
          <ActivityList events={events} />
        </Card.Body>
      </Card>
      {pagination}
    </PageStack>
  );
};
