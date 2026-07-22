import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PostShare } from './post-share';

const links = [
  {
    href: 'https://twitter.com/intent/tweet?text=Hi&url=https%3A%2F%2Fx.com',
    label: 'Share on X',
  },
  {
    href: 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fx.com',
    label: 'Share on LinkedIn',
  },
];

const renderComponent = () =>
  render(
    <PostShare
      url="https://example.com/blog/hello"
      title="Hello World"
      links={links}
    />,
  );

describe(`<${PostShare.name}/>`, () => {
  it('renders the trigger with the post title in its aria-label, closed by default', () => {
    renderComponent();

    const trigger = screen.getByRole('button', { name: 'Share "Hello World"' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the panel on trigger click and closes it on a second click', async () => {
    const user = userEvent.setup();
    renderComponent();

    const trigger = screen.getByRole('button', { name: 'Share "Hello World"' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Share on X' })).toBeVisible();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus to the first menu item when the panel opens', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: 'Share "Hello World"' }),
    );

    expect(document.activeElement).toBe(
      screen.getByRole('menuitem', { name: 'Copy link' }),
    );
  });

  it('closes the panel on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    renderComponent();

    const trigger = screen.getByRole('button', { name: 'Share "Hello World"' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes the panel on an outside click and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">outside</button>
        <PostShare
          url="https://example.com/blog/hello"
          title="Hello World"
          links={links}
        />
      </div>,
    );

    const trigger = screen.getByRole('button', { name: 'Share "Hello World"' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }));

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('traps Tab within the panel, wrapping from the last to the first focusable item', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: 'Share "Hello World"' }),
    );

    const copyItem = screen.getByRole('menuitem', { name: 'Copy link' });
    const lastLink = screen.getByRole('menuitem', {
      name: 'Share on LinkedIn',
    });

    lastLink.focus();
    expect(document.activeElement).toBe(lastLink);

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(copyItem);
  });

  it('copies the url to the clipboard and shows a Copied state that resets after a delay', async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    renderComponent();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Share "Hello World"' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));

    expect(writeText).toHaveBeenCalledWith('https://example.com/blog/hello');
    expect(
      await screen.findByRole('menuitem', { name: 'Copied' }),
    ).toBeVisible();

    await waitFor(
      () => {
        expect(
          screen.getByRole('menuitem', { name: 'Copy link' }),
        ).toBeVisible();
      },
      { timeout: 3000 },
    );
  });

  it('renders one share link per entry in `links`, opening in a new tab', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: 'Share "Hello World"' }),
    );

    const xLink = screen.getByRole('menuitem', { name: 'Share on X' });
    expect(xLink).toHaveAttribute('href', links[0]?.href);
    expect(xLink).toHaveAttribute('target', '_blank');
    expect(xLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
