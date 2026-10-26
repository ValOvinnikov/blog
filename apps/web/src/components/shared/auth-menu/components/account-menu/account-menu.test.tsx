import { faker } from '@faker-js/faker';
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

faker.seed(5960);

const ACCOUNT_MENU_LABEL = 'Account menu';
const MOCK_FIRST_NAME = faker.person.firstName();
const MOCK_LAST_NAME = faker.person.lastName();
const MOCK_NAME = `${MOCK_FIRST_NAME} ${MOCK_LAST_NAME}`;
const MOCK_INITIALS = `${MOCK_FIRST_NAME[0]}${MOCK_LAST_NAME[0]}`.toUpperCase();
const MOCK_HANDLE = faker.internet.username();
const MOCK_EMAIL = `${MOCK_HANDLE}@${faker.internet.domainName()}`;
const MOCK_IMAGE_URL = faker.image.url();
const MOCK_OTHER_IMAGE_URL = faker.image.url();

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
  name: MOCK_NAME,
  email: MOCK_EMAIL,
  image: MOCK_IMAGE_URL,
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
    const triggerInitials = within(trigger).getByText(MOCK_INITIALS);
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
    const panelInitials = within(panel).getByText(MOCK_INITIALS);
    expect(panelImage).not.toBeInTheDocument();
    expect(panelInitials).toBeVisible();
  });

  it('does not carry a stale failure forward once a different image URL is supplied', () => {
    const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
    const triggerImage = within(trigger).getByRole('presentation');
    fireEvent.error(triggerImage);

    rerender(
      <Wrapper
        name={MOCK_NAME}
        email={MOCK_EMAIL}
        image={MOCK_OTHER_IMAGE_URL}
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
    const name = within(panel).getByText(MOCK_NAME);
    const email = within(panel).getByText(MOCK_EMAIL);
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
    rerender(<Wrapper name={null} email={MOCK_EMAIL} image={null} />);

    const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
    await user.click(trigger);

    const panel = screen.getByRole('menu');
    const handle = within(panel).getByText(MOCK_HANDLE);
    const emails = within(panel).getAllByText(MOCK_EMAIL);
    expect(handle).toBeVisible();
    expect(emails).toHaveLength(1);
  });
});
