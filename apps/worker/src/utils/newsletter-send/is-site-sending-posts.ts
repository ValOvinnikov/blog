import { CAPABILITY } from '@shinefold/config/constants';
import { WRITABLE_TENANT_STATUSES } from '@shinefold/db/constants';
import { getEmailNewPosts } from '@shinefold/db/queries/email-config';
import { getSettingsFeatures } from '@shinefold/db/queries/settings-features';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isOneOf } from '@shinefold/utils/primitives';
import { readTenantEntitlements } from '@worker/utils/tenant-entitlements/read-tenant-entitlements';

export async function isSiteSendingPosts(tenant: TTenant): Promise<boolean> {
  const { id, status } = tenant;
  if (!isOneOf(WRITABLE_TENANT_STATUSES, status)) return false;

  const [{ capabilities }, features, isEmailNewPostsOn] = await Promise.all([
    readTenantEntitlements(tenant),
    getSettingsFeatures(id),
    getEmailNewPosts(id),
  ]);
  return (
    capabilities.includes(CAPABILITY.NEWSLETTER) &&
    features?.newsletterEnabled === true &&
    isEmailNewPostsOn
  );
}
