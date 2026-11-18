import {
  MOCK_TENANT_CREATED_AT,
  mockEntitlementGrant,
} from '@platform/testing/tenants/fixtures';
import {
  CAPABILITY,
  MODULE_PACK,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import {
  DAY_MS,
  ENTITLEMENT_KIND,
  LOOK_FIELD,
  PLAN_LOCALE_LIMIT,
} from '@shinefold/db/constants';

import { grantedEntitlements } from './granted-entitlements';

const NOW = MOCK_TENANT_CREATED_AT;
const IN_A_DAY = new Date(NOW.getTime() + DAY_MS);
const IN_TWO_DAYS = new Date(NOW.getTime() + 2 * DAY_MS);
const A_DAY_AGO = new Date(NOW.getTime() - DAY_MS);
const STARTER_LOCALE_LIMIT = PLAN_LOCALE_LIMIT[TENANT_PLAN.STARTER];

const grantedOnStarter = (
  ...grants: Parameters<typeof mockEntitlementGrant>[0][]
) =>
  grantedEntitlements(
    TENANT_PLAN.STARTER,
    grants.map((grant) => mockEntitlementGrant(grant)),
    NOW,
  );

describe(grantedEntitlements, () => {
  it('lists a capability the plan lacks with the end of its grant', () => {
    const { capabilities } = grantedOnStarter({
      key: CAPABILITY.READER_ACCOUNTS,
      expiresAt: IN_A_DAY,
    });

    expect(capabilities).toEqual({
      [CAPABILITY.READER_ACCOUNTS]: { expiresAt: IN_A_DAY },
    });
  });

  it('lists nothing for a capability the plan already includes', () => {
    const { capabilities } = grantedOnStarter({
      key: CAPABILITY.CONTACT_FORM,
    });

    expect(capabilities).toEqual({});
  });

  it('lists the Reader accounts a granted Bookmarks needs', () => {
    const { capabilities } = grantedOnStarter({ key: CAPABILITY.BOOKMARKS });

    expect(capabilities).toEqual({
      [CAPABILITY.BOOKMARKS]: { expiresAt: null },
      [CAPABILITY.READER_ACCOUNTS]: { expiresAt: null },
    });
  });

  it('keeps the longest-lived grant when two reach the same capability', () => {
    const { capabilities } = grantedOnStarter(
      { key: CAPABILITY.BOOKMARKS, expiresAt: IN_A_DAY },
      { key: CAPABILITY.READER_ACCOUNTS, expiresAt: IN_TWO_DAYS },
    );

    expect(capabilities[CAPABILITY.READER_ACCOUNTS]).toEqual({
      expiresAt: IN_TWO_DAYS,
    });
  });

  it('lets a grant that never expires outlast one that does', () => {
    const { capabilities } = grantedOnStarter(
      { key: CAPABILITY.BOOKMARKS, expiresAt: IN_A_DAY },
      { key: CAPABILITY.READER_ACCOUNTS, expiresAt: null },
    );

    expect(capabilities[CAPABILITY.READER_ACCOUNTS]).toEqual({
      expiresAt: null,
    });
  });

  it.each([
    { reason: 'revoked', grant: { revokedAt: A_DAY_AGO } },
    { reason: 'expired', grant: { expiresAt: A_DAY_AGO } },
  ])('ignores a $reason grant', ({ grant }) => {
    const { capabilities } = grantedOnStarter({
      key: CAPABILITY.READER_ACCOUNTS,
      ...grant,
    });

    expect(capabilities).toEqual({});
  });

  it('lists a look field and a module pack the plan lacks', () => {
    const { lookFields, modulePacks } = grantedOnStarter(
      {
        kind: ENTITLEMENT_KIND.LOOK_FIELD,
        key: LOOK_FIELD.RADIUS_SCALE,
        expiresAt: IN_A_DAY,
      },
      { kind: ENTITLEMENT_KIND.MODULE_PACK, key: MODULE_PACK.GROWTH },
    );

    expect(lookFields).toEqual({
      [LOOK_FIELD.RADIUS_SCALE]: { expiresAt: IN_A_DAY },
    });
    expect(modulePacks).toEqual({ [MODULE_PACK.GROWTH]: { expiresAt: null } });
  });

  it('lists nothing for a pack or look field the plan already includes', () => {
    const { lookFields, modulePacks } = grantedOnStarter(
      { kind: ENTITLEMENT_KIND.LOOK_FIELD, key: LOOK_FIELD.PRESET },
      { kind: ENTITLEMENT_KIND.MODULE_PACK, key: MODULE_PACK.STARTER },
    );

    expect(lookFields).toEqual({});
    expect(modulePacks).toEqual({});
  });

  it('lists a language grant above the plan limit', () => {
    const { localeLimit } = grantedOnStarter({
      kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
      key: ENTITLEMENT_KIND.LOCALE_LIMIT,
      value: STARTER_LOCALE_LIMIT + 2,
      expiresAt: IN_A_DAY,
    });

    expect(localeLimit).toEqual({ expiresAt: IN_A_DAY });
  });

  it('lists no language grant the plan limit already covers', () => {
    const { localeLimit } = grantedOnStarter({
      kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
      key: ENTITLEMENT_KIND.LOCALE_LIMIT,
      value: STARTER_LOCALE_LIMIT,
    });

    expect(localeLimit).toBeUndefined();
  });
});
