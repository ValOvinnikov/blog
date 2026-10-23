import { AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { TenantActivityView } from '@platform/components/features/tenants/tenant-activity-view';
import { Pagination } from '@platform/components/shared/pagination';
import { countPages, PAGE_SIZE } from '@platform/utils/pagination/pagination';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

export type TTenantActivityPageContentProps = {
  tenant: TTenant;
  page: number;
};

export const TenantActivityPageContent = async ({
  tenant,
  page,
}: TTenantActivityPageContentProps) => {
  const { id } = tenant;
  const [events, total] = await Promise.all([
    queries.auditEvents.listAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, id, {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    queries.auditEvents.countAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, id),
  ]);
  const totalPages = countPages(total);
  const pageHref = (nextPage: number) =>
    adminRoutes.tenantActivity(id, nextPage);

  if (page > totalPages) redirect(pageHref(totalPages));

  return (
    <TenantActivityView
      events={events}
      pagination={
        <Pagination page={page} totalPages={totalPages} pageHref={pageHref} />
      }
    />
  );
};
