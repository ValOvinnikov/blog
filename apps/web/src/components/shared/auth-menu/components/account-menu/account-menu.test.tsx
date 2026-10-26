import userEvent, { type UserEvent } from '@testing-library/user-event';
import { usePopover } from '@web/hooks/use-popover';
import {
  customRender,
  fireEvent,
  type RenderResult,
  screen,
  within,
} from '@web/testing/custom-render';
import { useId } from 'react';

import { AccountMenu, type TAccountMenuProps } from './account-menu';

const ACCOUNT_MENU_LABEL = 'Account menu';
const JANE_NAME = 'Jane Doe';
const JANE_EMAIL = 'jane@example.com';
const JANE_INITIALS = 'JD';

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
    const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
    const triggerImage = within(trigger).getByRole('presentation');
    expect(triggerImage).toBeVisible();

    fireEvent.error(triggerImage);

    const failedImage = within(trigger).queryByRole('presentation');
    const triggerInitials = within(trigger).getByText(JANE_INITIALS);
    expect(failedImage).not.toBeInTheDocument();
    expect(triggerInitials).toBeVisible();
  });

  it('also falls back to initials in the panel body avatar, since it shares the same failure state as the trigger', async () => {
    const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
    const triggerImage = within(trigger).getByRole('presentation');
    fireEvent.error(triggerImage);

    await user.click(trigger);

    const panel = screen.getByRole('menu');
    const panelImage = within(panel).queryByRole('presentation');
    const panelInitials = within(panel).getByText(JANE_INITIALS);
    expect(panelImage).not.toBeInTheDocument();
    expect(panelInitials).toBeVisible();
  });

  it('does not carry a stale failure forward once a different image URL is supplied', () => {
    const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
    const triggerImage = within(trigger).getByRole('presentation');
    fireEvent.error(triggerImage);

    rerender(
      <Wrapper
        name={JANE_NAME}
        email={JANE_EMAIL}
        image="https://example.com/a-different-avatar.png"
      />,
    );

    const newImage = within(trigger).getByRole('presentation');
    expect(newImage).toBeVisible();
  });

  it('renders a plain "Account" label — not a heading — and the session name/email', async () => {
    const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
    await user.click(trigger);

    const panel = screen.getByRole('menu');
    const heading = within(panel).queryByRole('heading');
    const accountLabel = within(panel).getByText('Account');
    const name = within(panel).getByText(JANE_NAME);
    const email = within(panel).getByText(JANE_EMAIL);
    const bookmarksItem = within(panel).getByRole('menuitem', {
      name: 'My bookmarks',
    });
    const signOutItem = within(panel).getByRole('menuitem', {
      name: 'Sign out',
    });
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

    const panel = screen.getByRole('menu');
    const handle = within(panel).getByText('jane');
    const emails = within(panel).getAllByText(JANE_EMAIL);
    expect(handle).toBeVisible();
    expect(emails).toHaveLength(1);
  });
});
