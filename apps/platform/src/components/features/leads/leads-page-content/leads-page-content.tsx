import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { LeadsPagination } from '@platform/components/features/leads/leads-pagination';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import { LeadsView } from '@platform/components/features/leads/leads-view';
import { toLeadRow } from '@platform/utils/lead-row/lead-row';
import {
  countLeadsPages,
  LEADS_PAGE_SIZE,
} from '@platform/utils/leads-pagination/leads-pagination';
import { planPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import { redirect } from 'next/navigation';

export type TLeadsPageContentProps = {
  tenant: TTenant;
  page: number;
  pageHref: (page: number) => string;
};

export const LeadsPageContent = async ({
  tenant,
  page,
  pageHref,
}: TLeadsPageContentProps) => {
  const { leads, total } = await queries.leads.listLeads({
    tenantId: tenant.id,
    page,
    pageSize: LEADS_PAGE_SIZE,
  });
  const totalPages = countLeadsPages(total);

  if (page > totalPages) redirect(pageHref(totalPages));

  return (
    <LeadsTenantProvider tenantId={tenant.id}>
      <LeadsView
        leads={leads.map(toLeadRow)}
        isContactFormIncluded={planPageAccess(tenant.plan).leads}
        pagination={
          <LeadsPagination
            page={page}
            totalPages={totalPages}
            pageHref={pageHref}
          />
        }
      />
    </LeadsTenantProvider>
  );
};
