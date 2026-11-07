import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { BackLink } from './back-link';

vi.mock('@platform/i18n/navigation');

faker.seed(6536);

const MOCK_LABEL = faker.lorem.word();

const setup = customRender(BackLink, {
  href: adminRoutes.tenants(),
  children: MOCK_LABEL,
});

describe(`<${BackLink.name}/>`, () => {
  it('links back to the given href, named by its label alone', () => {
    setup();

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('href', adminRoutes.tenants());
  });
});
