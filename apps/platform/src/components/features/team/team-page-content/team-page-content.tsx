import { TeamView } from '@platform/components/features/team/team-view';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { teamViewModel } from '@platform/utils/team-view-model/team-view-model';
import { queries } from '@shinefold/db';

export type TTeamPageContentProps = {
  tenant: TPlatformTenant;
  viewer: TPlatformViewer;
  currentUserId?: string;
};

export const TeamPageContent = async ({
  tenant,
  viewer,
  currentUserId,
}: TTeamPageContentProps) => {
  const [members, invites] = await Promise.all([
    queries.memberships.listTenantMembers(tenant.id),
    queries.membershipInvites.listPendingMembershipInvites(tenant.id),
  ]);

  return (
    <TeamView
      tenantId={tenant.id}
      plan={tenant.plan}
      team={teamViewModel({ tenant, viewer, currentUserId, members, invites })}
    />
  );
};
