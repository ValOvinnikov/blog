import { HUE_MAX, HUE_MIN } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_LOGO_URL } from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import { toUpdateLookInput } from './to-update-look-input';

faker.seed(7016);

const MOCK_LOGO_HUE = faker.number.int({ min: HUE_MIN, max: HUE_MAX });

describe(toUpdateLookInput, () => {
  it('sends an unset logo hue as null', () => {
    const input = toUpdateLookInput(defaultLookFormValues());

    expect(input.logoHue).toBeNull();
  });

  it('keeps a set logo hue', () => {
    const input = toUpdateLookInput({
      ...defaultLookFormValues(),
      logoHue: MOCK_LOGO_HUE,
    });

    expect(input.logoHue).toBe(MOCK_LOGO_HUE);
  });

  it('leaves the staged brand images out of the look save', () => {
    const input = toUpdateLookInput({
      ...defaultLookFormValues(),
      logo: { url: MOCK_LOGO_URL },
    });

    expect(input).not.toHaveProperty('logo');
    expect(input).not.toHaveProperty('favicon');
  });
});
