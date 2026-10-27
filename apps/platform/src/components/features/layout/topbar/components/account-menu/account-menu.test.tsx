import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { AccountMenu } from './account-menu';

vi.mock('@platform/server/auth/sign-out-action');

faker.seed(5993);

const MOCK_NAME = faker.person.fullName();
const MOCK_LABEL = faker.lorem.words(3);

const setup = customRender(AccountMenu, {
  name: MOCK_NAME,
  label: MOCK_LABEL,
});

describe(`<${AccountMenu.name}/>`, () => {
  let user: UserEvent;
  let signOutItem: HTMLElement;

  beforeEach(async () => {
    user = userEvent.setup();
    setup();

    const trigger = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(trigger);
    signOutItem = await screen.findByRole('menuitem', {
      name: messages.account.signOut,
    });
  });

  it('opens a menu from the role chip that offers sign out', () => {
    expect(signOutItem).toBeVisible();
  });

  it('signs out when the sign out item is chosen', async () => {
    await user.click(signOutItem);

    expect(signOutAction).toHaveBeenCalledOnce();
  });
});
