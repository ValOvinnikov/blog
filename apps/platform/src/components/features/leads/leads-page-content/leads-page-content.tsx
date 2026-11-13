import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import { LeadsView } from '@platform/components/features/leads/leads-view';
import { listInboxLeads } from '@platform/server/leads/list-inbox-leads';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export type TLeadsPageContentProps = {
  tenant: TPlatformTenant;
};

export const LeadsPageContent = async ({ tenant }: TLeadsPageContentProps) => {
  const initialPage = await listInboxLeads(tenant.id);

  return (
    <LeadsTenantProvider tenantId={tenant.id}>
      <LeadsView
        initialPage={initialPage}
        isContactFormIncluded={tenant.pageAccess.leads}
      />
    </LeadsTenantProvider>
  );
};
