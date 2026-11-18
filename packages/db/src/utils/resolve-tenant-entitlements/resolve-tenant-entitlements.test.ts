import {
  CAPABILITY,
  MODULE_PACK,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import {
  ENTITLEMENT_KIND,
  LOOK_FIELD,
  type TEntitlementGrantKey,
  type TEntitlementKind,
} from '@shinefold/db/constants';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import {
  MOCK_GRANT_FUTURE,
  MOCK_GRANT_PAST,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';

import {
  resolveTenantEntitlements,
  type TResolvableGrant,
} from './resolve-tenant-entitlements';

const MOCK_GRANTED_LOCALE_LIMIT = 5;

function grant(
  kind: TEntitlementKind,
  key: TEntitlementGrantKey,
  overrides: Partial<TResolvableGrant> = {},
): TResolvableGrant {
  return {
    kind,
    key,
    value: null,
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

const CONTACT_FORM_GRANT = grant(
  ENTITLEMENT_KIND.CAPABILITY,
  CAPABILITY.CONTACT_FORM,
);

function resolveFree(grants: TResolvableGrant[]) {
  return resolveTenantEntitlements(TENANT_PLAN.FREE, grants, MOCK_NOW);
}

describe(resolveTenantEntitlements, () => {
  it("adds a granted capability to the plan's", () => {
    expect(resolveFree([]).capabilities).not.toContain(CAPABILITY.CONTACT_FORM);
    expect(resolveFree([CONTACT_FORM_GRANT]).capabilities).toEqual(
      expect.arrayContaining([
        ...resolveFree([]).capabilities,
        CAPABILITY.CONTACT_FORM,
      ]),
    );
  });

  it.each([
    ['revoked', { revokedAt: MOCK_GRANT_PAST }],
    ['expired', { expiresAt: MOCK_GRANT_PAST }],
  ])('ignores a %s grant', (_, overrides) => {
    expect(
      resolveFree([{ ...CONTACT_FORM_GRANT, ...overrides }]).capabilities,
    ).not.toContain(CAPABILITY.CONTACT_FORM);
  });

  it('applies a grant that expires later', () => {
    expect(
      resolveFree([{ ...CONTACT_FORM_GRANT, expiresAt: MOCK_GRANT_FUTURE }])
        .capabilities,
    ).toContain(CAPABILITY.CONTACT_FORM);
  });

  it('resolves Reader accounts with a granted sub-feature, once', () => {
    const { capabilities } = resolveFree([
      grant(ENTITLEMENT_KIND.CAPABILITY, CAPABILITY.BOOKMARKS),
      grant(ENTITLEMENT_KIND.CAPABILITY, CAPABILITY.COMMENTS),
    ]);

    expect(
      capabilities.filter((c) => c === CAPABILITY.READER_ACCOUNTS),
    ).toEqual([CAPABILITY.READER_ACCOUNTS]);
  });

  it('adds a granted Look field and module pack', () => {
    const { lookFields, modulePacks } = resolveFree([
      grant(ENTITLEMENT_KIND.LOOK_FIELD, LOOK_FIELD.HEADING_FONT),
      grant(ENTITLEMENT_KIND.MODULE_PACK, MODULE_PACK.GROWTH),
    ]);

    expect(lookFields).toContain(LOOK_FIELD.HEADING_FONT);
    expect(modulePacks).toContain(MODULE_PACK.GROWTH);
  });

  it("takes the larger of the plan's and the granted language limit", () => {
    const localeGrant = grant(
      ENTITLEMENT_KIND.LOCALE_LIMIT,
      ENTITLEMENT_KIND.LOCALE_LIMIT,
      { value: MOCK_GRANTED_LOCALE_LIMIT },
    );
    const growth = resolveTenantEntitlements(TENANT_PLAN.GROWTH, [], MOCK_NOW);

    expect(resolveFree([localeGrant]).localeLimit).toBe(
      MOCK_GRANTED_LOCALE_LIMIT,
    );
    expect(
      resolveTenantEntitlements(
        TENANT_PLAN.GROWTH,
        [{ ...localeGrant, value: growth.localeLimit - 1 }],
        MOCK_NOW,
      ).localeLimit,
    ).toBe(growth.localeLimit);
  });
});
