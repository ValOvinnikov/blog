import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PostShareButtons } from './post-share-buttons';

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

const author = {
  name: 'Jane Doe',
  avatarUrl: 'https://cdn.example.com/jane.jpg',
};

type TFakeShareProps = {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: { current: HTMLButtonElement | null };
  triggerAriaLabel: string;
  panelAriaLabel?: string;
  isCopied?: boolean;
  onCopyClick?: () => void;
  copyLabel?: string;
  copiedLabel?: string;
  linkAs?: (props: { href: string; children: ReactNode }) => React.JSX.Element;
  links: { href: string; label: string }[];
};

vi.mock('@blog/ui', () => ({
  PostMeta: ({
    author: postAuthor,
    share,
  }: {
    author: { name: string };
    share?: TFakeShareProps;
  }) => (
    <div>
      <span>{postAuthor.name}</span>
      {share && (
        <>
          <button
            ref={share.triggerRef}
            aria-label={share.triggerAriaLabel}
            aria-expanded={share.open}
            onClick={() => share.onOpenChange(!share.open)}
          >
            Share
          </button>
          <div
            id={share.id}
            role="menu"
            aria-label={share.panelAriaLabel}
            hidden={!share.open}
          >
            <button onClick={share.onCopyClick}>
              {share.isCopied
                ? (share.copiedLabel ?? 'Copied')
                : (share.copyLabel ?? 'Copy link')}
            </button>
            {share.links.map((link) => {
              const As = share.linkAs ?? 'a';
              return (
                <As key={link.href} href={link.href}>
                  {link.label}
                </As>
              );
            })}
          </div>
        </>
      )}
    </div>
  ),
}));

const renderComponent = () =>
  render(
    <PostShareButtons
      author={author}
      publishedAt="2026-01-15T00:00:00Z"
      formattedDate="January 15, 2026"
      links={links}
      url="https://example.com/blog/hello"
      triggerAriaLabel='Share "Hello World"'
      id="share-menu"
    />,
  );

describe(`<${PostShareButtons.name}/>`, () => {
  it('renders the trigger with the given aria-label, closed by default', () => {
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
    expect(screen.getByRole('link', { name: 'Share on X' })).toBeVisible();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the panel on Escape', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: 'Share "Hello World"' }),
    );
    expect(
      screen.getByRole('button', { name: 'Share "Hello World"' }),
    ).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });

    const trigger = screen.getByRole('button', { name: 'Share "Hello World"' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes the panel on an outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">outside</button>
        <PostShareButtons
          author={author}
          publishedAt="2026-01-15T00:00:00Z"
          formattedDate="January 15, 2026"
          links={links}
          url="https://example.com/blog/hello"
          triggerAriaLabel='Share "Hello World"'
          id="share-menu"
        />
      </div>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Share "Hello World"' }),
    );
    expect(
      screen.getByRole('button', { name: 'Share "Hello World"' }),
    ).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }));

    const trigger = screen.getByRole('button', { name: 'Share "Hello World"' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('traps Tab within the panel, wrapping from the last to the first focusable item', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: 'Share "Hello World"' }),
    );

    const copyButton = screen.getByRole('button', { name: 'Copy link' });
    const lastLink = screen.getByRole('link', { name: 'Share on LinkedIn' });

    lastLink.focus();
    expect(document.activeElement).toBe(lastLink);

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(copyButton);
  });

  it('copies the url to the clipboard and shows a Copied state that resets after a delay', async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: 'Share "Hello World"' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(writeText).toHaveBeenCalledWith('https://example.com/blog/hello');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeVisible();

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Copy link' })).toBeVisible();
      },
      { timeout: 3000 },
    );
  });
});
