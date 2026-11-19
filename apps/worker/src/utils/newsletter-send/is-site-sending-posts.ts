import { CAPABILITY } from '@shinefold/config/constants';
import { WRITABLE_TENANT_STATUSES } from '@shinefold/db/constants';
import { getEmailNewPosts } from '@shinefold/db/queries/email-config';
import { getSettingsFeatures } from '@shinefold/db/queries/settings-features';
import { listResolvableEntitlementGrants } from '@shinefold/db/queries/tenant-entitlement-grants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { resolveTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { isOneOf } from '@shinefold/utils/primitives';

export async function isSiteSendingPosts(tenant: TTenant): Promise<boolean> {
  const { id, status, plan } = tenant;
  if (!isOneOf(WRITABLE_TENANT_STATUSES, status)) return false;

  const [grants, features, isEmailNewPostsOn] = await Promise.all([
    listResolvableEntitlementGrants(id),
    getSettingsFeatures(id),
    getEmailNewPosts(id),
  ]);
  const { capabilities } = resolveTenantEntitlements(plan, grants, new Date());
  return (
    capabilities.includes(CAPABILITY.NEWSLETTER) &&
    features?.newsletterEnabled === true &&
    isEmailNewPostsOn
  );
}
