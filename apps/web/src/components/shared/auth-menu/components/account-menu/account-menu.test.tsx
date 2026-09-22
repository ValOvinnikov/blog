import userEvent from '@testing-library/user-event';
import { usePopover } from '@web/hooks/use-popover';
import {
  customRender,
  fireEvent,
  screen,
  within,
} from '@web/testing/custom-render';
import { useId } from 'react';

import { AccountMenu, type TAccountMenuProps } from './account-menu';

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
  name: 'Jane Doe',
  email: 'jane@example.com',
  image: 'https://example.com/broken-avatar.png',
});

const getTriggerImage = () => {
  const trigger = screen.getByRole('button', { name: 'Account menu' });

  return within(trigger).queryByRole('presentation');
};

describe(`<${AccountMenu.name}/>`, () => {
  it('falls back to initials in the trigger avatar once its image fails to load', () => {
    setup();

    const image = getTriggerImage();
    expect(image).toBeInTheDocument();

    fireEvent.error(image!);

    const trigger = screen.getByRole('button', { name: 'Account menu' });
    expect(within(trigger).queryByRole('presentation')).not.toBeInTheDocument();
    expect(within(trigger).getByText('JD')).toBeVisible();
  });

  it('also falls back to initials in the panel body avatar, since it shares the same failure state as the trigger', async () => {
    setup();
    const user = userEvent.setup();

    fireEvent.error(getTriggerImage()!);

    const trigger = screen.getByRole('button', { name: 'Account menu' });
    await user.click(trigger);
    const panel = screen.getByRole('menu');

    expect(within(panel).queryByRole('presentation')).not.toBeInTheDocument();
    expect(within(panel).getAllByText('JD').length).toBeGreaterThan(0);
  });

  it('does not carry a stale failure forward once a different image URL is supplied', () => {
    const { rerender } = setup();

    fireEvent.error(getTriggerImage()!);
    expect(getTriggerImage()).not.toBeInTheDocument();

    rerender(
      <Wrapper
        name="Jane Doe"
        email="jane@example.com"
        image="https://example.com/a-different-avatar.png"
      />,
    );

    expect(getTriggerImage()).toBeInTheDocument();
  });

  it('renders a plain "Account" label — not a heading — and the session name/email', async () => {
    setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    const panel = screen.getByRole('menu');

    expect(within(panel).queryByRole('heading')).not.toBeInTheDocument();
    expect(within(panel).getByText('Account')).toBeVisible();
    expect(within(panel).getAllByText('Jane Doe').length).toBeGreaterThan(0);
    expect(within(panel).getByText('jane@example.com')).toBeVisible();
    expect(
      screen.getByRole('menuitem', { name: 'My bookmarks' }),
    ).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  });
});
