import { mockTenantEntitlements } from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { toLookFormValuesWithin } from '@platform/utils/look-form-values/look-form-values';
import { HUE_MIN, PRESET_ID, RADIUS_SCALE } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { MOCK_PINK_HEX } from '@shinefold/config/testing/button-colors';
import { ENTITLEMENT_KIND, LOOK_FIELD } from '@shinefold/db/constants';
import {
  MOCK_SHINEFOLD_PRESET_GRANT,
  mockEntitlementGrant,
} from '@shinefold/db/testing/tenant-entitlement-grants/mock-entitlement-grant';

import { listRefusedLookFields } from './refused-look-fields';

const MOCK_STORED = {
  ...defaultLookFormValues(),
  radiusScale: RADIUS_SCALE.LG,
};
const MOCK_SHINEFOLD_STORED = { ...MOCK_STORED, preset: PRESET_ID.SHINEFOLD };
const MOCK_SMALLER_RADIUS = { ...MOCK_STORED, radiusScale: RADIUS_SCALE.SM };
const MOCK_FREE = mockTenantEntitlements(TENANT_PLAN.FREE);
const MOCK_GROWTH = mockTenantEntitlements(TENANT_PLAN.GROWTH);
const MOCK_SHINEFOLD_ON_FREE = mockTenantEntitlements(TENANT_PLAN.FREE, [
  MOCK_SHINEFOLD_PRESET_GRANT,
]);

describe(listRefusedLookFields, () => {
  it('lists a Growth-only field changed from its stored value on Free', () => {
    expect(
      listRefusedLookFields(MOCK_SMALLER_RADIUS, MOCK_STORED, MOCK_FREE),
    ).toEqual(['radiusScale']);
  });

  it('passes a Growth-only field still holding its stored value on Free', () => {
    expect(listRefusedLookFields(MOCK_STORED, MOCK_STORED, MOCK_FREE)).toEqual(
      [],
    );
  });

  it('passes the preset values a Free page shows for its locked fields', () => {
    const submitted = toLookFormValuesWithin(
      { ...MOCK_STORED, preset: PRESET_ID.EDITORIAL },
      MOCK_FREE,
    );

    expect(listRefusedLookFields(submitted, MOCK_STORED, MOCK_FREE)).toEqual(
      [],
    );
  });

  it('passes a Free field changed on Free', () => {
    const submitted = { ...MOCK_STORED, accentHue: HUE_MIN };

    expect(listRefusedLookFields(submitted, MOCK_STORED, MOCK_FREE)).toEqual(
      [],
    );
  });

  it('passes a Growth-only field granted on Free', () => {
    const granted = mockTenantEntitlements(TENANT_PLAN.FREE, [
      mockEntitlementGrant({
        kind: ENTITLEMENT_KIND.LOOK_FIELD,
        key: LOOK_FIELD.RADIUS_SCALE,
      }),
    ]);

    expect(
      listRefusedLookFields(MOCK_SMALLER_RADIUS, MOCK_STORED, granted),
    ).toEqual([]);
  });

  it('passes every change on Growth', () => {
    expect(
      listRefusedLookFields(MOCK_SMALLER_RADIUS, MOCK_STORED, MOCK_GROWTH),
    ).toEqual([]);
  });

  it('lists the Shinefold preset chosen without a grant', () => {
    expect(
      listRefusedLookFields(MOCK_SHINEFOLD_STORED, MOCK_STORED, MOCK_GROWTH),
    ).toEqual([LOOK_FIELD.PRESET]);
  });

  it('passes the Shinefold preset chosen with a grant', () => {
    expect(
      listRefusedLookFields(
        MOCK_SHINEFOLD_STORED,
        MOCK_STORED,
        MOCK_SHINEFOLD_ON_FREE,
      ),
    ).toEqual([]);
  });

  it('passes the Shinefold preset already stored once its grant is gone', () => {
    expect(
      listRefusedLookFields(
        MOCK_SHINEFOLD_STORED,
        MOCK_SHINEFOLD_STORED,
        MOCK_GROWTH,
      ),
    ).toEqual([]);
  });

  it('passes a locked Shinefold button colour left following the preset', () => {
    const stored = { ...MOCK_SHINEFOLD_STORED, buttonColor: MOCK_PINK_HEX };
    const submitted = { ...stored, buttonColor: undefined };

    expect(
      listRefusedLookFields(submitted, stored, MOCK_SHINEFOLD_ON_FREE),
    ).toEqual([]);
  });
});
