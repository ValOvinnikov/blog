import { TENANT_OWNER_EMAIL, type TTenantOwnerEmail } from '@blog/db/constants';
import {
  buildOwnerInviteHeadsUpEmail,
  buildOwnerInviteNudgeEmail,
  buildOwnerSiteReadyEmail,
  PLATFORM_EMAIL_BRAND_NAME,
} from '@blog/email';
import {
  OWNER_DASHBOARD_PATH,
  OWNER_STUDIO_PATH,
} from '@worker/constants/owner-email';
import type { TOwnerAccessTarget } from '@worker/utils/owner-access/owner-access-target';

import { OWNER_EMAIL_COPY } from './owner-email-copy';

function adminUrl(env: TOwnerAccessTarget['env'], path: string): string {
  return new URL(path, env.adminAppBaseUrl).toString();
}

export function buildOwnerEmailMessage(
  target: TOwnerAccessTarget,
  email: TTenantOwnerEmail,
): { subject: string; html: string } {
  const { tenant, ownerEmail, env } = target;
  const copy = OWNER_EMAIL_COPY[tenant.locale];
  const input = {
    siteName: tenant.name,
    siteUrl: `https://${tenant.primaryDomain}`,
    ownerEmail,
  };
  const brandName = PLATFORM_EMAIL_BRAND_NAME;

  switch (email) {
    case TENANT_OWNER_EMAIL.INVITE_HEADS_UP:
      return buildOwnerInviteHeadsUpEmail({
        brandName,
        ...copy.inviteHeadsUp(input),
      });
    case TENANT_OWNER_EMAIL.INVITE_NUDGE: {
      const { actionLabel, ...text } = copy.inviteNudge(input);
      return buildOwnerInviteNudgeEmail({
        brandName,
        ...text,
        action: {
          label: actionLabel,
          url: adminUrl(env, OWNER_DASHBOARD_PATH),
        },
      });
    }
    case TENANT_OWNER_EMAIL.SITE_READY: {
      const { actionLabel, ...text } = copy.siteReady(input);
      return buildOwnerSiteReadyEmail({
        brandName,
        ...text,
        action: { label: actionLabel, url: adminUrl(env, OWNER_STUDIO_PATH) },
      });
    }
  }
}
