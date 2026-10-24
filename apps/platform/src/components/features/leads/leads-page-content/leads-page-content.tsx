import type { TTenant } from '@blog/db/schema/tenants';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import { LeadsView } from '@platform/components/features/leads/leads-view';
import { listInboxLeads } from '@platform/server/leads/list-inbox-leads';
import { planPageAccess } from '@platform/utils/plan-page-access/plan-page-access';

export type TLeadsPageContentProps = {
  tenant: TTenant;
};

export const LeadsPageContent = async ({ tenant }: TLeadsPageContentProps) => {
  const initialPage = await listInboxLeads(tenant.id);

  return (
    <LeadsTenantProvider tenantId={tenant.id}>
      <LeadsView
        initialPage={initialPage}
        isContactFormIncluded={planPageAccess(tenant.plan).leads}
      />
    </LeadsTenantProvider>
  );
};
