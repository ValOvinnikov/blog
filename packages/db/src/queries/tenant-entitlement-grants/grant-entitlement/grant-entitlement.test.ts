import type { TMaybeNull } from '@shinefold/config';
import { CAPABILITY, ERROR_CODE } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TTenantEntitlementGrant } from '@shinefold/db/schema/tenant-entitlement-grants';
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
import { toStoredEntitlementItem } from '@shinefold/db/utils/stored-entitlement-item/stored-entitlement-item';
import { errorResult, okResult } from '@shinefold/utils';
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
const MOCK_CONTACT_FORM = {
  kind: ENTITLEMENT_KIND.CAPABILITY,
  key: CAPABILITY.CONTACT_FORM,
} as const;
const MOCK_LOCALE_LIMIT = {
  kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
  value: MOCK_GRANTED_LOCALE_LIMIT,
} as const;
const MOCK_LOWER_LOCALE_LIMIT = {
  kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
  value: MOCK_GRANTED_LOCALE_LIMIT - 1,
} as const;

const admin = useEntitlementGrantAdmin(db);

type TGrantItem = TGrantEntitlementInput['item'];

function grant(
  item: TGrantItem,
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

async function granted(
  item: TGrantItem,
  expiresAt?: TMaybeNull<Date>,
): Promise<TTenantEntitlementGrant> {
  const result = await grant(item, expiresAt);
  if (!result.ok) throw new Error(result.error);
  return result.data.grant;
}

function expectedGrant(
  item: TGrantItem,
  overrides: Partial<TTenantEntitlementGrant> = {},
): TTenantEntitlementGrant {
  return {
    id: expect.any(String),
    tenantId: tenant().id,
    ...toStoredEntitlementItem(item),
    note: MOCK_GRANT_NOTE,
    grantedBy: admin(),
    grantedAt: MOCK_NOW,
    expiresAt: MOCK_GRANT_FUTURE,
    revokedAt: null,
    revokedBy: null,
    ...overrides,
  };
}

function rowsFor(tenantId: string) {
  return db()
    .select()
    .from(schema.tenantEntitlementGrants)
    .where(eq(schema.tenantEntitlementGrants.tenantId, tenantId));
}

describe(grantEntitlement, () => {
  it('records the grant with who, when and why', async () => {
    expect(await grant(MOCK_CONTACT_FORM)).toEqual(
      okResult({
        grant: expectedGrant(MOCK_CONTACT_FORM),
        closedGrantId: null,
      }),
    );
  });

  it('stores a language limit under its kind, with its value', async () => {
    expect(await grant(MOCK_LOCALE_LIMIT)).toEqual(
      okResult({
        grant: expectedGrant(MOCK_LOCALE_LIMIT),
        closedGrantId: null,
      }),
    );
  });

  it('binds a raised expiry as UTC text, never as a local date', async () => {
    const query = vi.spyOn(db().$client, 'query');

    await grant(MOCK_LOCALE_LIMIT);

    const bound = query.mock.calls.flatMap(([, params]) => params ?? []);
    expect(bound.filter((param) => param instanceof Date)).toEqual([]);
  });

  it.each([
    ['a capability', MOCK_CONTACT_FORM],
    ['the language limit', MOCK_LOCALE_LIMIT],
  ] as const)('refuses a second open grant of %s', async (_, item) => {
    await grant(item);

    expect(await grant(item)).toEqual(
      errorResult(ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED),
    );
  });

  describe('with an open language grant', () => {
    it('replaces it with a higher one, closing it as the granting admin', async () => {
      const lower = await granted(MOCK_LOWER_LOCALE_LIMIT);

      const raised = await grant(MOCK_LOCALE_LIMIT);

      expect(raised).toEqual(
        okResult({
          grant: expectedGrant(MOCK_LOCALE_LIMIT),
          closedGrantId: lower.id,
        }),
      );
      expect(await rowsFor(tenant().id)).toEqual(
        expect.arrayContaining([
          { ...lower, revokedAt: MOCK_NOW, revokedBy: admin() },
          expectedGrant(MOCK_LOCALE_LIMIT),
        ]),
      );
    });

    it.each([
      ['a later expiry', MOCK_GRANT_FUTURE, MOCK_GRANT_LATER],
      ['no expiry', MOCK_GRANT_FUTURE, null],
      ['no expiry over no expiry', null, null],
    ] as const)('raises with %s', async (_, openExpiry, raisedExpiry) => {
      const open = await granted(MOCK_LOWER_LOCALE_LIMIT, openExpiry);

      expect(await grant(MOCK_LOCALE_LIMIT, raisedExpiry)).toEqual(
        okResult({
          grant: expectedGrant(MOCK_LOCALE_LIMIT, { expiresAt: raisedExpiry }),
          closedGrantId: open.id,
        }),
      );
    });

    it.each([
      ['an earlier expiry', MOCK_GRANT_LATER, MOCK_GRANT_FUTURE],
      ['an expiry over no expiry', null, MOCK_GRANT_FUTURE],
    ] as const)(
      'refuses a raise with %s and keeps the open grant',
      async (_, openExpiry, raisedExpiry) => {
        const open = await granted(MOCK_LOWER_LOCALE_LIMIT, openExpiry);

        const shortened = await grant(MOCK_LOCALE_LIMIT, raisedExpiry);

        expect(shortened).toEqual(
          errorResult(ERROR_CODE.DB_ENTITLEMENT_EXPIRY_SHORTENED),
        );
        expect(await rowsFor(tenant().id)).toEqual([open]);
      },
    );

    it('refuses a lower one and keeps the open grant', async () => {
      const open = await granted(MOCK_LOCALE_LIMIT);

      const lowered = await grant(MOCK_LOWER_LOCALE_LIMIT);

      expect(lowered).toEqual(
        errorResult(ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED),
      );
      expect(await rowsFor(tenant().id)).toEqual([open]);
    });
  });

  it('grants again once the earlier grant is revoked', async () => {
    await insertTestEntitlementGrant(db(), tenant().id, {
      revokedAt: MOCK_GRANT_PAST,
    });

    expect(await grant(MOCK_CONTACT_FORM)).toMatchObject({ ok: true });
  });

  it('closes an expired grant at its expiry and grants again', async () => {
    const expired = await insertTestEntitlementGrant(db(), tenant().id, {
      expiresAt: MOCK_GRANT_PAST,
    });

    expect(await grant(MOCK_CONTACT_FORM)).toMatchObject({ ok: true });
    expect(await rowsFor(tenant().id)).toContainEqual({
      ...expired,
      revokedAt: MOCK_GRANT_PAST,
    });
  });
});
