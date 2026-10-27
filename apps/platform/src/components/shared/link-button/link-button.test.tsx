import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { LinkButton } from './link-button';

vi.mock('@platform/i18n/navigation');

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_ARIA_LABEL = faker.lorem.words(3);

const setup = customRender(LinkButton, {
  href: adminRoutes.tenants(),
  children: MOCK_LABEL,
});

describe(`<${LinkButton.name}/>`, () => {
  it('links to the given href', () => {
    setup();

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('href', adminRoutes.tenants());
  });

  it('takes its accessible name from ariaLabel when given', () => {
    setup({ ariaLabel: MOCK_ARIA_LABEL });

    const link = screen.getByRole('link', { name: MOCK_ARIA_LABEL });

    expect(link).toBeVisible();
  });

  it('keeps a decorative arrow out of the accessible name', () => {
    setup({ hasArrow: true });

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toBeVisible();
  });
});
