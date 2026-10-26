import userEvent, { type UserEvent } from '@testing-library/user-event';
import { usePopover } from '@web/hooks/use-popover';
import {
  customRender,
  fireEvent,
  type RenderResult,
  screen,
} from '@web/testing/custom-render';
import { useId } from 'react';

import { AccountMenu, type TAccountMenuProps } from './account-menu';

const ACCOUNT_MENU_LABEL = 'Account menu';
const JANE_NAME = 'Jane Doe';
const JANE_EMAIL = 'jane@example.com';
const JANE_INITIALS = 'JD';
const TRIGGER_AVATAR_TEST_ID = 'account-menu-trigger-avatar';
const PANEL_AVATAR_TEST_ID = 'account-menu-panel-avatar';

type TWrapperProps = Pick<TAccountMenuProps, 'name' | 'email' | 'image'>;

const Wrapper = ({ name, email, image }: TWrapperProps) => {
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover();

  return (
    <AccountMenu
      panelId={panelId}
      isOpen={open}
      toggle={toggle}
      triggerRef={triggerRef}
      panelRef={panelRef}
      name={name}
      email={email}
      image={image}
    />
  );
};

const setup = customRender(Wrapper, {
  name: JANE_NAME,
  email: JANE_EMAIL,
  image: 'https://example.com/broken-avatar.png',
});

describe(`<${AccountMenu.name}/>`, () => {
  let user: UserEvent;
  let rerender: RenderResult['rerender'];

  beforeEach(() => {
    ({ rerender } = setup());
    user = userEvent.setup();
  });

  it('falls back to initials in the trigger avatar once its image fails to load', () => {
    const triggerImage = screen.getByRole('presentation');
    expect(triggerImage).toBeVisible();

    fireEvent.error(triggerImage);

    const failedImage = screen.queryByRole('presentation');
    const triggerAvatar = screen.getByTestId(TRIGGER_AVATAR_TEST_ID);
    expect(failedImage).not.toBeInTheDocument();
    expect(triggerAvatar).toHaveTextContent(JANE_INITIALS);
  });

  it('also falls back to initials in the panel body avatar, since it shares the same failure state as the trigger', async () => {
    const triggerImage = screen.getByRole('presentation');
    fireEvent.error(triggerImage);

    const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
    await user.click(trigger);

    const avatarImage = screen.queryByRole('presentation');
    const panelAvatar = screen.getByTestId(PANEL_AVATAR_TEST_ID);
    expect(avatarImage).not.toBeInTheDocument();
    expect(panelAvatar).toHaveTextContent(JANE_INITIALS);
  });

  it('does not carry a stale failure forward once a different image URL is supplied', () => {
    const triggerImage = screen.getByRole('presentation');
    fireEvent.error(triggerImage);

    rerender(
      <Wrapper
        name={JANE_NAME}
        email={JANE_EMAIL}
        image="https://example.com/a-different-avatar.png"
      />,
    );

    const newImage = screen.getByRole('presentation');
    expect(newImage).toBeVisible();
  });

  it('renders a plain "Account" label — not a heading — and the session name/email', async () => {
    const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
    await user.click(trigger);

    const heading = screen.queryByRole('heading');
    const accountLabel = screen.getByText('Account');
    const name = screen.getByText(JANE_NAME);
    const email = screen.getByText(JANE_EMAIL);
    const bookmarksItem = screen.getByRole('menuitem', {
      name: 'My bookmarks',
    });
    const signOutItem = screen.getByRole('menuitem', { name: 'Sign out' });
    expect(heading).not.toBeInTheDocument();
    expect(accountLabel).toBeVisible();
    expect(name).toBeVisible();
    expect(email).toBeVisible();
    expect(bookmarksItem).toBeVisible();
    expect(signOutItem).toBeVisible();
  });

  it('shows the handle on the name line and the email once when the reader has no name', async () => {
    rerender(<Wrapper name={null} email={JANE_EMAIL} image={null} />);

    const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
    await user.click(trigger);

    const handle = screen.getByText('jane');
    const emails = screen.getAllByText(JANE_EMAIL);
    expect(handle).toBeVisible();
    expect(emails).toHaveLength(1);
  });
});
