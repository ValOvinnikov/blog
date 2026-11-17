import { HelpView } from '@platform/components/features/support/help-view';
import { loadHelpPage } from '@platform/server/support/load-help-page';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export type THelpPageContentProps = {
  tenant: TPlatformTenant;
  helpPath: string;
};

export const HelpPageContent = async ({
  tenant,
  helpPath,
}: THelpPageContentProps) => {
  const page = await loadHelpPage(helpPath);

  return <HelpView tenantId={tenant.id} {...page} />;
};
