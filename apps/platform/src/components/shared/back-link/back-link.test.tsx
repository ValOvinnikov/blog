import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent from '@testing-library/user-event';

import { BackLink } from './back-link';

vi.mock('@platform/i18n/navigation');

faker.seed(6536);

const MOCK_LABEL = faker.lorem.word();
const MOCK_ON_BACK = vi.fn();

const setup = customRender(BackLink, {
  href: adminRoutes.tenants(),
  children: MOCK_LABEL,
});

const setupWithAction = customRender(BackLink, {
  onClick: MOCK_ON_BACK,
  children: MOCK_LABEL,
});

describe(`<${BackLink.name}/>`, () => {
  it('links back to the given href, named by its label alone', () => {
    setup();

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('href', adminRoutes.tenants());
  });

  it('runs the back action from a button, named by its label alone', async () => {
    const user = userEvent.setup();
    setupWithAction();

    const backButton = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(backButton);

    expect(MOCK_ON_BACK).toHaveBeenCalledOnce();
  });
});
