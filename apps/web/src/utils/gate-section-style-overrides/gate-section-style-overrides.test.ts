import { TENANT_PLAN } from '@blog/config/constants';
import {
  MOCK_NO_SECTION_STYLE_OVERRIDES,
  MOCK_SECTION_STYLE_OVERRIDES,
} from '@web/testing/shared/section-appearance/fixtures';

import { gateSectionStyleOverrides } from './gate-section-style-overrides';

describe(gateSectionStyleOverrides, () => {
  it('keeps every override on Growth', () => {
    const gated = gateSectionStyleOverrides(
      MOCK_SECTION_STYLE_OVERRIDES,
      TENANT_PLAN.GROWTH,
    );

    expect(gated).toEqual(MOCK_SECTION_STYLE_OVERRIDES);
  });

  it.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])(
    'drops every override on %s',
    (plan) => {
      const gated = gateSectionStyleOverrides(
        MOCK_SECTION_STYLE_OVERRIDES,
        plan,
      );

      expect(gated).toEqual(MOCK_NO_SECTION_STYLE_OVERRIDES);
    },
  );
});
