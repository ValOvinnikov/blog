import { CAPABILITY } from '@shinefold/config/constants';
import {
  PLAN_REGISTRY,
  WRITABLE_TENANT_STATUSES,
} from '@shinefold/db/constants';
import { getEmailNewPosts } from '@shinefold/db/queries/email-config';
import { getSettingsFeatures } from '@shinefold/db/queries/settings-features';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isOneOf } from '@shinefold/utils/primitives';

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
