import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { BrandMark } from './brand-mark';

faker.seed(5995);

const MOCK_LABEL = faker.company.name();

const setup = customRender(BrandMark, { ariaLabel: MOCK_LABEL });

describe(`<${BrandMark.name}/>`, () => {
  it('exposes one image named by its label', () => {
    setup();

    const mark = screen.getByRole('img', { name: MOCK_LABEL });

    expect(mark).toBeVisible();
  });
});
