import { GRANT_STATUS } from '@platform/constants/entitlement-grant';
import {
  MOCK_GRANT_ID,
  MOCK_GRANT_NOTE,
  MOCK_GRANTED_BY_EMAIL,
  MOCK_TENANT_CREATED_AT,
  mockListedEntitlementGrant,
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

import { toGrantRows } from './to-grant-rows';

const NOW = MOCK_TENANT_CREATED_AT;
const IN_A_DAY = new Date(NOW.getTime() + DAY_MS);
const A_DAY_AGO = new Date(NOW.getTime() - DAY_MS);
const GROWTH_LOCALE_LIMIT = PLAN_LOCALE_LIMIT[TENANT_PLAN.GROWTH];

const statusOn = (
  plan: Parameters<typeof toGrantRows>[1],
  overrides: Parameters<typeof mockListedEntitlementGrant>[0],
) => toGrantRows([mockListedEntitlementGrant(overrides)], plan, NOW)[0]?.status;

describe(toGrantRows, () => {
  it('carries what the grants card shows for each grant', () => {
    const rows = toGrantRows(
      [
        mockListedEntitlementGrant({
          key: CAPABILITY.READER_ACCOUNTS,
          note: MOCK_GRANT_NOTE,
        }),
      ],
      TENANT_PLAN.STARTER,
      NOW,
    );

    expect(rows).toEqual([
      {
        id: MOCK_GRANT_ID,
        kind: ENTITLEMENT_KIND.CAPABILITY,
        key: CAPABILITY.READER_ACCOUNTS,
        value: null,
        note: MOCK_GRANT_NOTE,
        grantedByEmail: MOCK_GRANTED_BY_EMAIL,
        grantedAt: NOW,
        expiresAt: null,
        status: GRANT_STATUS.ACTIVE,
      },
    ]);
  });

  it('marks a grant past its end expired, even when the plan covers it', () => {
    const status = statusOn(TENANT_PLAN.GROWTH, {
      key: CAPABILITY.READER_ACCOUNTS,
      expiresAt: A_DAY_AGO,
    });

    expect(status).toBe(GRANT_STATUS.EXPIRED);
  });

  it('keeps a grant that ends later active', () => {
    const status = statusOn(TENANT_PLAN.STARTER, {
      key: CAPABILITY.READER_ACCOUNTS,
      expiresAt: IN_A_DAY,
    });

    expect(status).toBe(GRANT_STATUS.ACTIVE);
  });

  it.each([
    {
      item: 'a capability',
      overrides: { key: CAPABILITY.READER_ACCOUNTS },
    },
    {
      item: 'a look field',
      overrides: {
        kind: ENTITLEMENT_KIND.LOOK_FIELD,
        key: LOOK_FIELD.RADIUS_SCALE,
      },
    },
    {
      item: 'a module pack',
      overrides: {
        kind: ENTITLEMENT_KIND.MODULE_PACK,
        key: MODULE_PACK.GROWTH,
      },
    },
    {
      item: 'a language count the new limit covers',
      overrides: {
        kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
        key: ENTITLEMENT_KIND.LOCALE_LIMIT,
        value: GROWTH_LOCALE_LIMIT,
      },
    },
  ])('marks $item the plan now covers as included', ({ overrides }) => {
    expect(statusOn(TENANT_PLAN.GROWTH, overrides)).toBe(GRANT_STATUS.INCLUDED);
  });

  it('keeps a language grant above the new plan limit active', () => {
    const status = statusOn(TENANT_PLAN.GROWTH, {
      kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
      key: ENTITLEMENT_KIND.LOCALE_LIMIT,
      value: GROWTH_LOCALE_LIMIT + 1,
    });

    expect(status).toBe(GRANT_STATUS.ACTIVE);
  });
});
