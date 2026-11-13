import { HUE_MIN, PRESET_ID, RADIUS_SCALE } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { toEffectiveLook } from '@blog/db/utils/effective-look/effective-look';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import { listRefusedLookFields } from './refused-look-fields';

const STORED = { ...defaultLookFormValues(), radiusScale: RADIUS_SCALE.LG };
const SMALLER_RADIUS = { ...STORED, radiusScale: RADIUS_SCALE.SM };

describe(listRefusedLookFields, () => {
  it('lists a Growth-only field changed from its stored value on Free', () => {
    expect(
      listRefusedLookFields(SMALLER_RADIUS, STORED, TENANT_PLAN.FREE),
    ).toEqual(['radiusScale']);
  });

  it('passes a Growth-only field still holding its stored value on Free', () => {
    expect(listRefusedLookFields(STORED, STORED, TENANT_PLAN.FREE)).toEqual([]);
  });

  it('passes the preset values a Free page shows for its locked fields', () => {
    const submitted = toEffectiveLook(
      { ...STORED, preset: PRESET_ID.EDITORIAL },
      TENANT_PLAN.FREE,
    );

    expect(listRefusedLookFields(submitted, STORED, TENANT_PLAN.FREE)).toEqual(
      [],
    );
  });

  it('passes a Free field changed on Free', () => {
    const submitted = { ...STORED, accentHue: HUE_MIN };

    expect(listRefusedLookFields(submitted, STORED, TENANT_PLAN.FREE)).toEqual(
      [],
    );
  });

  it('passes every change on Growth', () => {
    expect(
      listRefusedLookFields(SMALLER_RADIUS, STORED, TENANT_PLAN.GROWTH),
    ).toEqual([]);
  });
});
