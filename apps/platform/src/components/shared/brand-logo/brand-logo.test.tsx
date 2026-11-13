import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { BrandLogo } from './brand-logo';

faker.seed(7306);

const MOCK_LABEL = faker.company.name();

const setup = customRender(BrandLogo, { ariaLabel: MOCK_LABEL });

describe(`<${BrandLogo.name}/>`, () => {
  it.each([false, true])(
    'exposes one image named by its label when on a dark ground is %s',
    (isOnDark) => {
      setup({ isOnDark });

      const logo = screen.getByRole('img', { name: MOCK_LABEL });

      expect(logo).toBeVisible();
    },
  );
});
