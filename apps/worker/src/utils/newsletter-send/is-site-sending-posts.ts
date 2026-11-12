import { CAPABILITY } from '@blog/config/constants';
import { PLAN_REGISTRY, WRITABLE_TENANT_STATUSES } from '@blog/db/constants';
import { getEmailNewPosts } from '@blog/db/queries/email-config';
import { getSettingsFeatures } from '@blog/db/queries/settings-features';
import type { TTenant } from '@blog/db/schema/tenants';
import { isOneOf } from '@blog/utils/primitives';

export async function isSiteSendingPosts(tenant: TTenant): Promise<boolean> {
  const { id, status, plan } = tenant;
  if (!isOneOf(WRITABLE_TENANT_STATUSES, status)) return false;
  if (!PLAN_REGISTRY[plan].includes(CAPABILITY.NEWSLETTER)) return false;

  const [features, isEmailNewPostsOn] = await Promise.all([
    getSettingsFeatures(id),
    getEmailNewPosts(id),
  ]);
  return features?.newsletterEnabled === true && isEmailNewPostsOn;
}
