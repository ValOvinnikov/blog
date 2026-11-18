import { TENANT_PLAN } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND, LOOK_FIELD } from '@shinefold/db/constants';
import {
  mockEntitlementGrant,
  mockTenantEntitlements,
} from '@web/testing/server/settings-features/fixtures';
import {
  MOCK_NO_SECTION_STYLE_OVERRIDES,
  MOCK_SECTION_STYLE_OVERRIDES,
} from '@web/testing/shared/section-appearance/fixtures';

import { gateSectionStyleOverrides } from './gate-section-style-overrides';

describe(gateSectionStyleOverrides, () => {
  it('keeps every override on Growth', () => {
    const gated = gateSectionStyleOverrides(
      MOCK_SECTION_STYLE_OVERRIDES,
      mockTenantEntitlements(TENANT_PLAN.GROWTH),
    );

    expect(gated).toEqual(MOCK_SECTION_STYLE_OVERRIDES);
  });

  it.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])(
    'drops every override on %s',
    (plan) => {
      const gated = gateSectionStyleOverrides(
        MOCK_SECTION_STYLE_OVERRIDES,
        mockTenantEntitlements(plan),
      );

      expect(gated).toEqual(MOCK_NO_SECTION_STYLE_OVERRIDES);
    },
  );

  it('keeps only the override whose Look field is granted', () => {
    const gated = gateSectionStyleOverrides(
      MOCK_SECTION_STYLE_OVERRIDES,
      mockTenantEntitlements(TENANT_PLAN.FREE, [
        mockEntitlementGrant({
          kind: ENTITLEMENT_KIND.LOOK_FIELD,
          key: LOOK_FIELD.CARD_STYLE,
        }),
      ]),
    );

    expect(gated).toEqual({
      ...MOCK_NO_SECTION_STYLE_OVERRIDES,
      cardStyle: MOCK_SECTION_STYLE_OVERRIDES.cardStyle,
    });
  });
});
