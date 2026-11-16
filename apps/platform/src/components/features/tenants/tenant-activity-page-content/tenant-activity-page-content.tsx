import { TenantActivityView } from '@platform/components/features/tenants/tenant-activity-view';
import { Pagination } from '@platform/components/shared/pagination';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { resolveTotalPages } from '@platform/utils/pagination/pagination';
import { adminRoutes } from '@platform/utils/routes/routes';
import { AUDIT_TARGET_TYPE } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { AUDIT_EVENTS_PAGE_SIZE } from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';

export type TTenantActivityPageContentProps = {
  tenant: TTenant;
  page: number;
};

export const TenantActivityPageContent = async ({
  tenant,
  page,
}: TTenantActivityPageContentProps) => {
  const { id } = tenant;
  const pageHref = (nextPage: number) =>
    adminRoutes.tenantActivity(id, nextPage);
  const total = await queries.auditEvents.countAuditEventsForTarget(
    AUDIT_TARGET_TYPE.TENANT,
    id,
  );
  const totalPages = resolveTotalPages({
    page,
    total,
    pageSize: AUDIT_EVENTS_PAGE_SIZE,
    pageHref,
  });
  const events = await queries.auditEvents.listAuditEventsForTarget(
    AUDIT_TARGET_TYPE.TENANT,
    id,
    {
      limit: AUDIT_EVENTS_PAGE_SIZE,
      offset: (page - 1) * AUDIT_EVENTS_PAGE_SIZE,
    },
  );

  return (
    <TenantActivityView
      events={events}
      backHref={adminRoutes.tenantOverview(id)}
      pagination={
        <Pagination
          page={page}
          totalPages={totalPages}
          pageHref={pageHref}
          focusGround={FOCUS_RING_GROUND.BG}
        />
      }
    />
  );
};
