import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { GuardedLink } from './guarded-link';

vi.mock('@platform/i18n/base-navigation');

faker.seed(5995);

const MOCK_LINK_TEXT = faker.lorem.word();

const setup = customRender(GuardedLink, {
  href: adminRoutes.tenants(),
  children: MOCK_LINK_TEXT,
});

describe(`<${GuardedLink.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('links to its href', () => {
    setup();

    const link = screen.getByRole('link', { name: MOCK_LINK_TEXT });

    expect(link).toHaveAttribute('href', adminRoutes.tenants());
  });

  it("calls the caller's onNavigate outside an unsaved-changes guard", async () => {
    const onNavigate = vi.fn();
    setup({ onNavigate });

    const link = screen.getByRole('link', { name: MOCK_LINK_TEXT });
    await user.click(link);

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
