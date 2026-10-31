import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { OwnerStudioAccessView } from '@platform/components/features/studio/owner-studio-access-view';
import { StudioMountView } from '@platform/components/features/studio/studio-mount-view';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import { ownerStudioAccessFor } from '@platform/utils/owner-studio-access/owner-studio-access';
import { adminRoutes } from '@platform/utils/routes/routes';

import { ShellStudioAccessSync } from './components/shell-studio-access-sync/shell-studio-access-sync';

export type TDashboardStudioViewProps = {
  tenant: TTenant;
  membership: TMembership;
};

export const DashboardStudioView = async ({
  tenant,
  membership,
}: TDashboardStudioViewProps) => {
  const studioAccess = ownerStudioAccessFor(tenant, membership);

  const view =
    studioAccess && studioAccess !== OWNER_STUDIO_ACCESS.READY ? (
      <OwnerStudioAccessView tenantId={tenant.id} studioAccess={studioAccess} />
    ) : (
      await StudioMountView({
        tenant,
        basePath: adminRoutes.dashboardStudio(),
        loginProvider: studioAccess
          ? (tenant.ownerLoginProvider ?? undefined)
          : undefined,
      })
    );

  return (
    <>
      <ShellStudioAccessSync studioAccess={studioAccess} />
      {view}
    </>
  );
};
