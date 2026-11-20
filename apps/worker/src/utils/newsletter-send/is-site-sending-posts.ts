import { CAPABILITY } from '@shinefold/config/constants';
import { WRITABLE_TENANT_STATUSES } from '@shinefold/db/constants';
import { getEmailNewPosts } from '@shinefold/db/queries/email-config';
import { getSettingsFeatures } from '@shinefold/db/queries/settings-features';
import { getTenantEntitlements } from '@shinefold/db/queries/tenant-entitlement-grants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isOneOf } from '@shinefold/utils/primitives';

export async function isSiteSendingPosts(tenant: TTenant): Promise<boolean> {
  const { id, status } = tenant;
  if (!isOneOf(WRITABLE_TENANT_STATUSES, status)) return false;

  const [{ capabilities }, features, isEmailNewPostsOn] = await Promise.all([
    getTenantEntitlements(tenant),
    getSettingsFeatures(id),
    getEmailNewPosts(id),
  ]);
  return (
    capabilities.includes(CAPABILITY.NEWSLETTER) &&
    features?.newsletterEnabled === true &&
    isEmailNewPostsOn
  );
}
