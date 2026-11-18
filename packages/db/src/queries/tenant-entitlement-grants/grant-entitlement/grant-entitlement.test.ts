import type { TMaybeNull } from '@shinefold/config';
import { CAPABILITY, ERROR_CODE } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertTestEntitlementGrant,
  MOCK_GRANT_FUTURE,
  MOCK_GRANT_LATER,
  MOCK_GRANT_NOTE,
  MOCK_GRANT_PAST,
  useEntitlementGrantAdmin,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { isNull } from '@shinefold/utils/primitives';
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

function grant(
  item: TGrantEntitlementInput['item'],
  expiresAt: TMaybeNull<Date> = MOCK_GRANT_FUTURE,
) {
  return grantEntitlement({
    tenantId: tenant().id,
    item,
    grantedBy: admin(),
    expiresAt,
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
      data: {
        grant: expect.objectContaining({
          ...CONTACT_FORM,
          value: null,
          grantedBy: admin(),
          grantedAt: MOCK_NOW,
          expiresAt: MOCK_GRANT_FUTURE,
          note: MOCK_GRANT_NOTE,
          revokedAt: null,
        }),
        closedGrantId: null,
      },
    });
  });

  it('stores a language limit under its kind, with its value', async () => {
    expect(await grant(LOCALE_LIMIT)).toMatchObject({
      data: {
        grant: { ...LOCALE_LIMIT, key: ENTITLEMENT_KIND.LOCALE_LIMIT },
        closedGrantId: null,
      },
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

  describe('with an open language grant', () => {
    const LOWER_LOCALE_LIMIT = {
      kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
      value: MOCK_GRANTED_LOCALE_LIMIT - 1,
    } as const;

    it('replaces it with a higher one, closing it as the granting admin', async () => {
      const lower = await grant(LOWER_LOCALE_LIMIT);

      const raised = await grant(LOCALE_LIMIT);

      const rows = await rowsFor(tenant().id);
      expect(raised).toMatchObject({
        ok: true,
        data: {
          grant: {
            ...LOCALE_LIMIT,
            note: MOCK_GRANT_NOTE,
            expiresAt: MOCK_GRANT_FUTURE,
            grantedBy: admin(),
            revokedAt: null,
          },
          closedGrantId: lower.ok && lower.data.grant.id,
        },
      });
      expect(rows).toContainEqual(
        expect.objectContaining({
          value: LOWER_LOCALE_LIMIT.value,
          revokedBy: admin(),
          revokedAt: expect.any(Date),
        }),
      );
      expect(rows.filter(({ revokedAt }) => isNull(revokedAt))).toHaveLength(1);
    });

    it.each([
      ['the same expiry', MOCK_GRANT_FUTURE, MOCK_GRANT_FUTURE],
      ['a later expiry', MOCK_GRANT_FUTURE, MOCK_GRANT_LATER],
      ['no expiry', MOCK_GRANT_FUTURE, null],
      ['no expiry over no expiry', null, null],
    ] as const)('raises with %s', async (_, openExpiry, raisedExpiry) => {
      await grant(LOWER_LOCALE_LIMIT, openExpiry);

      expect(await grant(LOCALE_LIMIT, raisedExpiry)).toMatchObject({
        ok: true,
      });
    });

    it.each([
      ['an earlier expiry', MOCK_GRANT_LATER, MOCK_GRANT_FUTURE],
      ['an expiry over no expiry', null, MOCK_GRANT_FUTURE],
    ] as const)(
      'refuses a raise with %s and keeps the open grant',
      async (_, openExpiry, raisedExpiry) => {
        await grant(LOWER_LOCALE_LIMIT, openExpiry);

        const shortened = await grant(LOCALE_LIMIT, raisedExpiry);

        expect(shortened).toEqual({
          ok: false,
          error: ERROR_CODE.DB_ENTITLEMENT_EXPIRY_SHORTENED,
        });
        expect(await rowsFor(tenant().id)).toEqual([
          expect.objectContaining({
            ...LOWER_LOCALE_LIMIT,
            expiresAt: openExpiry,
            revokedAt: null,
          }),
        ]);
      },
    );

    it('refuses a lower one and keeps the open grant', async () => {
      await grant(LOCALE_LIMIT);

      const lowered = await grant(LOWER_LOCALE_LIMIT);

      const rows = await rowsFor(tenant().id);
      expect(lowered).toEqual({
        ok: false,
        error: ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED,
      });
      expect(rows).toEqual([
        expect.objectContaining({ ...LOCALE_LIMIT, revokedAt: null }),
      ]);
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
