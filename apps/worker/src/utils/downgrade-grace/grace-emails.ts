import type { TMaybeNull } from '@blog/config/types';
import {
  GRACE_EMAIL,
  TENANT_PLAN,
  type TGraceEmail,
  type TTenantPlan,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  buildOwnerDowngradeGraceEmail,
  PLATFORM_EMAIL_BRAND_NAME,
} from '@blog/email';
import { isUndefined } from '@blog/utils/primitives';
import { DOWNGRADE_GRACE_LOG } from '@worker/constants/downgrade-grace';
import { OWNER_DASHBOARD_PATH } from '@worker/constants/owner-email';
import { formatInactivityDate } from '@worker/utils/inactivity-sweep/inactivity-dates';
import type { TInactivitySweepEnv } from '@worker/utils/inactivity-sweep/inactivity-sweep-env';
import { OWNER_DASHBOARD_ACTION_LABEL } from '@worker/utils/owner-email/owner-dashboard-action-label';
import type {
  TDowngradedPlan,
  TOwnerGraceEmailCopy,
} from '@worker/utils/owner-email/owner-email-copy-types';
import { OWNER_GRACE_EMAIL_COPY } from '@worker/utils/owner-email/owner-grace-email-copy/owner-grace-email-copy';
import { sendOwnerMessage } from '@worker/utils/owner-email/send-owner-message';

import { graceEndDate } from './grace-dates';
import { hasGraceLocks, type TGraceLocks } from './grace-locks';

export type TGraceEmailInput = {
  tenant: TTenant;
  graceStartedAt: Date;
  ownerEmail: string;
  locks: TGraceLocks;
  env: TInactivitySweepEnv;
};

function lockParagraphs(
  copy: TOwnerGraceEmailCopy,
  { lockedMemberCount, customDomain, subdomain }: TGraceLocks,
  date: string,
): string[] {
  const members =
    lockedMemberCount > 0
      ? [copy.memberLock({ count: lockedMemberCount, date })]
      : [];
  const domain =
    isUndefined(customDomain) || isUndefined(subdomain)
      ? []
      : [copy.domainLock({ customDomain, subdomain, date })];

  return [...members, ...domain];
}

function downgradedPlanOf(plan: TMaybeNull<TTenantPlan>): TDowngradedPlan {
  return plan === TENANT_PLAN.STARTER
    ? TENANT_PLAN.STARTER
    : TENANT_PLAN.GROWTH;
}

export async function sendOwnerGraceEmail(
  email: TGraceEmail,
  { tenant, graceStartedAt, ownerEmail, locks, env }: TGraceEmailInput,
): Promise<void> {
  const { id: tenantId, name, locale, downgradedFromPlan } = tenant;
  const copy = OWNER_GRACE_EMAIL_COPY[locale];
  const date = formatInactivityDate(graceEndDate(graceStartedAt), locale);
  const { paragraphs, ...text } = copy.emails[email]({ siteName: name, date });
  const closing =
    email === GRACE_EMAIL.STARTED && !hasGraceLocks(locks)
      ? copy.upgradeAnyTime
      : copy.keepAsTheyAre(date);

  await sendOwnerMessage({
    to: ownerEmail,
    message: buildOwnerDowngradeGraceEmail({
      brandName: PLATFORM_EMAIL_BRAND_NAME,
      ...text,
      paragraphs: [
        ...paragraphs,
        ...(email === GRACE_EMAIL.STARTED
          ? [copy.stopped[downgradedPlanOf(downgradedFromPlan)]]
          : []),
        ...lockParagraphs(copy, locks, date),
        closing,
      ],
      action: {
        label: OWNER_DASHBOARD_ACTION_LABEL[locale],
        url: new URL(OWNER_DASHBOARD_PATH, env.platformAppBaseUrl).toString(),
      },
    }),
    failedEvent: DOWNGRADE_GRACE_LOG.EMAIL_SEND_FAILED,
    context: { tenantId, email },
  });
}
