import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { hasLength } from '@shinefold/utils/primitives';

export type TPendingInviteTenant = Pick<TTenant, 'name' | 'locale'>;

export async function findPendingInviteTenants(
  email: string,
): Promise<TPendingInviteTenant[]> {
  const invites =
    await queries.membershipInvites.findPendingInviteByEmail(email);
  if (!hasLength(invites)) return [];

  const tenants = await queries.tenants.listTenantsByIds(
    invites.map((invite) => invite.tenantId),
  );

  return tenants.map(({ name, locale }) => ({ name, locale }));
}

export async function findPendingInviteTenantsOrNone(
  email: string,
): Promise<TPendingInviteTenant[]> {
  try {
    return await findPendingInviteTenants(email);
  } catch {
    // A failed lookup must not block delivery: it degrades to the generic copy.
    return [];
  }
}
