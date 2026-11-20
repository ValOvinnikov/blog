import {
  CAPABILITY,
  NEWSLETTER_SENDING_OFF_CAUSES,
  NEWSLETTER_SKIP_REASON,
  type TCapability,
  type TNewsletterSendingOffCause,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isTenantWritable } from '@shinefold/db/utils/is-tenant-writable/is-tenant-writable';

export type TNewsletterSendingSettings = {
  capabilities: readonly TCapability[];
  newsletterEnabled: boolean;
  emailNewPosts: boolean;
};

export function newsletterSendingOffCause(
  tenant: Pick<TTenant, 'status' | 'deprovisionedAt'>,
  {
    capabilities,
    newsletterEnabled,
    emailNewPosts,
  }: TNewsletterSendingSettings,
): TMaybeUndefined<TNewsletterSendingOffCause> {
  const isOff: Record<TNewsletterSendingOffCause, boolean> = {
    [NEWSLETTER_SKIP_REASON.NOT_IN_PLAN]: !capabilities.includes(
      CAPABILITY.NEWSLETTER,
    ),
    [NEWSLETTER_SKIP_REASON.SITE_INACTIVE]: !isTenantWritable(tenant),
    [NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF]: !newsletterEnabled,
    [NEWSLETTER_SKIP_REASON.SENDING_OFF]: !emailNewPosts,
  };
  return NEWSLETTER_SENDING_OFF_CAUSES.find((cause) => isOff[cause]);
}
