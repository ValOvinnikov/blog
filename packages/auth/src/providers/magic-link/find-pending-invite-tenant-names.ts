import { queries } from '@blog/db';

/**
 * Resolves the tenant names of every still-pending `membershipInvites` row
 * for `email`, for `magic-link-provider.ts`'s invite-vs-generic copy
 * branch. Empty when the address has no pending invite.
 */
export async function findPendingInviteTenantNames(
  email: string,
): Promise<string[]> {
  const invites =
    await queries.membershipInvites.findPendingInviteByEmail(email);
  if (invites.length === 0) return [];

  const tenants = await queries.tenants.listTenantsByIds(
    invites.map((invite) => invite.tenantId),
  );

  return tenants.map((tenant) => tenant.name);
}
