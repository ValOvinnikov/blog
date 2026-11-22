import { faker } from '@faker-js/faker';
import { METER_TONE } from '@platform/constants/meter';
import { ARIA_VALUEMAX, ARIA_VALUENOW } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';

import { UsageMeter } from './usage-meter';

faker.seed(7164);

const MOCK_LABEL = faker.lorem.words(3);
const MOCK_MAX = 1000;
const MOCK_VALUE = 400;

const setup = customRender(UsageMeter, {
  value: MOCK_VALUE,
  max: MOCK_MAX,
  aria: { label: MOCK_LABEL },
  tone: METER_TONE.BRAND,
});

describe(`<${UsageMeter.name}/>`, () => {
  it('is a meter named by its label with its value and maximum', () => {
    setup();

    const meter = screen.getByRole('meter', { name: MOCK_LABEL });

    expect(meter).toHaveAttribute(ARIA_VALUENOW, String(MOCK_VALUE));
    expect(meter).toHaveAttribute(ARIA_VALUEMAX, String(MOCK_MAX));
  });

  it('caps a value over the maximum at the maximum', () => {
    setup({ value: MOCK_MAX + MOCK_VALUE, tone: METER_TONE.BAD });

    const meter = screen.getByRole('meter', { name: MOCK_LABEL });

    expect(meter).toHaveAttribute(ARIA_VALUENOW, String(MOCK_MAX));
  });
});
