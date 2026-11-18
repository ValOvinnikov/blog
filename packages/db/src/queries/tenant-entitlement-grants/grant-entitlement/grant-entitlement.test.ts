import { CAPABILITY, ERROR_CODE } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertTestEntitlementGrant,
  MOCK_GRANT_FUTURE,
  MOCK_GRANT_NOTE,
  MOCK_GRANT_PAST,
  useEntitlementGrantAdmin,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { eq } from 'drizzle-orm';

import {
  grantEntitlement,
  type TGrantEntitlementInput,
} from './grant-entitlement';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

const MOCK_GRANTED_LOCALE_LIMIT = 5;
const CONTACT_FORM = {
  kind: ENTITLEMENT_KIND.CAPABILITY,
  key: CAPABILITY.CONTACT_FORM,
} as const;
const LOCALE_LIMIT = {
  kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
  value: MOCK_GRANTED_LOCALE_LIMIT,
} as const;

const admin = useEntitlementGrantAdmin(db);

function grant(item: TGrantEntitlementInput['item']) {
  return grantEntitlement({
    tenantId: tenant().id,
    item,
    grantedBy: admin(),
    expiresAt: MOCK_GRANT_FUTURE,
    note: MOCK_GRANT_NOTE,
  });
}

function rowsFor(tenantId: string) {
  return db()
    .select()
    .from(schema.tenantEntitlementGrants)
    .where(eq(schema.tenantEntitlementGrants.tenantId, tenantId));
}

describe(grantEntitlement, () => {
  it('records the grant with who, when and why', async () => {
    expect(await grant(CONTACT_FORM)).toEqual({
      ok: true,
      data: expect.objectContaining({
        ...CONTACT_FORM,
        value: null,
        grantedBy: admin(),
        grantedAt: MOCK_NOW,
        expiresAt: MOCK_GRANT_FUTURE,
        note: MOCK_GRANT_NOTE,
        revokedAt: null,
      }),
    });
  });

  it('stores a language limit under its kind, with its value', async () => {
    expect(await grant(LOCALE_LIMIT)).toMatchObject({
      data: { ...LOCALE_LIMIT, key: ENTITLEMENT_KIND.LOCALE_LIMIT },
    });
  });

  it.each([
    ['a capability', CONTACT_FORM],
    ['the language limit', LOCALE_LIMIT],
  ] as const)('refuses a second open grant of %s', async (_, item) => {
    await grant(item);

    expect(await grant(item)).toEqual({
      ok: false,
      error: ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED,
    });
  });

  it('grants again once the earlier grant is revoked', async () => {
    await insertTestEntitlementGrant(db(), tenant().id, {
      revokedAt: MOCK_GRANT_PAST,
    });

    expect(await grant(CONTACT_FORM)).toMatchObject({ ok: true });
  });

  it('closes an expired grant at its expiry and grants again', async () => {
    const expired = await insertTestEntitlementGrant(db(), tenant().id, {
      expiresAt: MOCK_GRANT_PAST,
    });

    expect(await grant(CONTACT_FORM)).toMatchObject({ ok: true });
    expect(await rowsFor(tenant().id)).toContainEqual({
      ...expired,
      revokedAt: MOCK_GRANT_PAST,
    });
  });
});
