import { LOCALE_BCP47_TAGS, TENANT_PLAN } from '@shinefold/config/constants';
import { PLAN_ENTITLEMENTS, type TGraceEmail } from '@shinefold/db/constants';
import {
  listTenantMembers,
  type TTenantMember,
} from '@shinefold/db/queries/memberships';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { hasArrayGotItems, isUndefined } from '@shinefold/utils/primitives';
import { OWNER_TEAM_PATH } from '@worker/constants/owner-email';
import { OWNER_GRACE_EMAIL_COPY } from '@worker/utils/owner-email/owner-grace-email-copy/owner-grace-email-copy';

import type { TGraceEmailBody } from './grace-email-body';

export function isFewerSeatsGrace({ plan }: Pick<TTenant, 'plan'>): boolean {
  return plan !== TENANT_PLAN.FREE;
}

// listTenantMembers orders members in seat order, the same ranking lockMembershipsOverSeats locks by.
function emailsOverSeats(members: TTenantMember[], seats: number): string[] {
  return members
    .slice(seats)
    .flatMap(({ email, lockedAt }) =>
      isUndefined(lockedAt) && !isUndefined(email) ? [email] : [],
    );
}

export async function fewerSeatsGraceBody(
  email: TGraceEmail,
  { id, name, locale, plan }: TTenant,
  date: string,
): Promise<TGraceEmailBody> {
  const { teamActionLabel, memberLock, closing, emails } =
    OWNER_GRACE_EMAIL_COPY[locale].fewerSeats;
  const members = emailsOverSeats(
    await listTenantMembers(id),
    PLAN_ENTITLEMENTS[plan].seats,
  );
  const lock = hasArrayGotItems(members)
    ? [
        memberLock({
          members: new Intl.ListFormat(LOCALE_BCP47_TAGS[locale], {
            type: 'conjunction',
          }).format(members),
          date,
        }),
      ]
    : [];
  const { paragraphs, ...text } = emails[email]({ siteName: name, date });

  return {
    ...text,
    paragraphs: [...paragraphs, ...lock, closing(date)],
    action: { label: teamActionLabel, path: OWNER_TEAM_PATH },
  };
}
