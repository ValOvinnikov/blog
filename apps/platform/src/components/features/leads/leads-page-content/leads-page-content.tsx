import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import { LeadsView } from '@platform/components/features/leads/leads-view';
import { Pagination } from '@platform/components/shared/pagination';
import { countPages, PAGE_SIZE } from '@platform/utils/pagination/pagination';
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
    pageSize: PAGE_SIZE,
  });
  const totalPages = countPages(total);

  if (page > totalPages) redirect(pageHref(totalPages));

  return (
    <LeadsTenantProvider tenantId={tenant.id}>
      <LeadsView
        leads={leads}
        isContactFormIncluded={planPageAccess(tenant.plan).leads}
        pagination={
          <Pagination page={page} totalPages={totalPages} pageHref={pageHref} />
        }
      />
    </LeadsTenantProvider>
  );
};
