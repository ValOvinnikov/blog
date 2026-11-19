import { ERROR_CODE } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { isOpenGrantOf } from '@shinefold/db/queries/tenant-entitlement-grants/open-grant-condition';
import { tenantEntitlementGrants } from '@shinefold/db/schema/tenant-entitlement-grants';
import { isNull } from '@shinefold/utils/primitives';
import { and, eq } from 'drizzle-orm';

export async function localeLimitRaiseRefusal(tenantId: string, value: number) {
  const [open] = await getDb()
    .select({ value: tenantEntitlementGrants.value })
    .from(tenantEntitlementGrants)
    .where(
      and(
        isOpenGrantOf(tenantId),
        eq(tenantEntitlementGrants.kind, ENTITLEMENT_KIND.LOCALE_LIMIT),
      ),
    );

  const openValue = open?.value ?? null;

  return !isNull(openValue) && openValue < value
    ? ERROR_CODE.DB_ENTITLEMENT_EXPIRY_SHORTENED
    : ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED;
}
