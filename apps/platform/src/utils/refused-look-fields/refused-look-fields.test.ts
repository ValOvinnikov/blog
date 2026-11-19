import { mockTenantEntitlements } from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { HUE_MIN, PRESET_ID, RADIUS_SCALE } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND, LOOK_FIELD } from '@shinefold/db/constants';
import { mockEntitlementGrant } from '@shinefold/db/testing/tenant-entitlement-grants/mock-entitlement-grant';
import { toEffectiveLookWithin } from '@shinefold/db/utils/effective-look/effective-look';

import { listRefusedLookFields } from './refused-look-fields';

const STORED = { ...defaultLookFormValues(), radiusScale: RADIUS_SCALE.LG };
const MOCK_SMALLER_RADIUS = { ...STORED, radiusScale: RADIUS_SCALE.SM };
const FREE = mockTenantEntitlements(TENANT_PLAN.FREE);
const GROWTH = mockTenantEntitlements(TENANT_PLAN.GROWTH);

describe(listRefusedLookFields, () => {
  it('lists a Growth-only field changed from its stored value on Free', () => {
    expect(listRefusedLookFields(MOCK_SMALLER_RADIUS, STORED, FREE)).toEqual([
      'radiusScale',
    ]);
  });

  it('passes a Growth-only field still holding its stored value on Free', () => {
    expect(listRefusedLookFields(STORED, STORED, FREE)).toEqual([]);
  });

  it('passes the preset values a Free page shows for its locked fields', () => {
    const submitted = toEffectiveLookWithin(
      { ...STORED, preset: PRESET_ID.EDITORIAL },
      FREE,
    );

    expect(listRefusedLookFields(submitted, STORED, FREE)).toEqual([]);
  });

  it('passes a Free field changed on Free', () => {
    const submitted = { ...STORED, accentHue: HUE_MIN };

    expect(listRefusedLookFields(submitted, STORED, FREE)).toEqual([]);
  });

  it('passes a Growth-only field granted on Free', () => {
    const granted = mockTenantEntitlements(TENANT_PLAN.FREE, [
      mockEntitlementGrant({
        kind: ENTITLEMENT_KIND.LOOK_FIELD,
        key: LOOK_FIELD.RADIUS_SCALE,
      }),
    ]);

    expect(listRefusedLookFields(MOCK_SMALLER_RADIUS, STORED, granted)).toEqual(
      [],
    );
  });

  it('passes every change on Growth', () => {
    expect(listRefusedLookFields(MOCK_SMALLER_RADIUS, STORED, GROWTH)).toEqual(
      [],
    );
  });
});
