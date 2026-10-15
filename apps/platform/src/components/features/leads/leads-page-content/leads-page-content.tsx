import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import { LeadsView } from '@platform/components/features/leads/leads-view';
import { toLeadRow } from '@platform/utils/lead-row/lead-row';
import {
  countLeadsPages,
  LEADS_PAGE_SIZE,
} from '@platform/utils/leads-pagination/leads-pagination';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

export type TLeadsPageContentProps = {
  tenant: TTenant;
  page: number;
};

export const LeadsPageContent = async ({
  tenant,
  page,
}: TLeadsPageContentProps) => {
  const { leads, total } = await queries.leads.listLeads({
    tenantId: tenant.id,
    page,
    pageSize: LEADS_PAGE_SIZE,
  });
  const totalPages = countLeadsPages(total);

  if (page > totalPages) redirect(adminRoutes.dashboardLeads(totalPages));

  return (
    <LeadsTenantProvider tenantId={tenant.id}>
      <LeadsView
        leads={leads.map(toLeadRow)}
        page={page}
        totalPages={totalPages}
      />
    </LeadsTenantProvider>
  );
};
