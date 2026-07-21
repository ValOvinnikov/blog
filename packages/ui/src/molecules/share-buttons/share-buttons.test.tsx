import type { IShareLinkItem } from '@blog/ui/molecules/share-link';
import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { ShareButtons } from './share-buttons';

faker.seed(123);

const buildLinks = (): IShareLinkItem[] => [
  { href: faker.internet.url(), label: 'Share on X' },
  { href: faker.internet.url(), label: 'Share on LinkedIn' },
];

describe(`<${ShareButtons.name}/>`, () => {
  it('renders a trigger button with the given accessible name', () => {
    render(
      <ShareButtons
        links={buildLinks()}
        open={false}
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Share this post' });
    expect(trigger).toBeVisible();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('reflects open in aria-expanded and the panel role', () => {
    render(
      <ShareButtons
        links={buildLinks()}
        open
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Share this post' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeVisible();
  });

  it('calls onOpenChange with the toggled value when the trigger is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <ShareButtons
        links={buildLinks()}
        open={false}
        onOpenChange={onOpenChange}
        triggerAriaLabel="Share this post"
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Share this post' }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('renders a menu item for each entry in links, as plain <a>s by default', () => {
    const links = buildLinks();
    render(
      <ShareButtons
        links={links}
        open
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
      />,
    );

    links.forEach(({ href, label }) => {
      const link = screen.getByRole('menuitem', { name: label });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders the copy-link row pinned at top with the default label', () => {
    render(
      <ShareButtons
        links={buildLinks()}
        open
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
      />,
    );

    const items = screen.getAllByRole('menuitem');
    expect(items[0]).toHaveTextContent('Copy link');
  });

  it('renders a custom copyLabel when provided', () => {
    render(
      <ShareButtons
        links={buildLinks()}
        open
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
        copyLabel="Copier le lien"
      />,
    );
    expect(
      screen.getByRole('menuitem', { name: 'Copier le lien' }),
    ).toBeVisible();
  });

  it('shows the copiedLabel when isCopied is true', () => {
    render(
      <ShareButtons
        links={buildLinks()}
        open
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
        isCopied
      />,
    );
    expect(screen.getByRole('menuitem', { name: 'Copied' })).toBeVisible();
    expect(
      screen.queryByRole('menuitem', { name: 'Copy link' }),
    ).not.toBeInTheDocument();
  });

  it('calls onCopyClick when the copy row is clicked', async () => {
    const onCopyClick = vi.fn();
    render(
      <ShareButtons
        links={buildLinks()}
        open
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
        onCopyClick={onCopyClick}
      />,
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));
    expect(onCopyClick).toHaveBeenCalledOnce();
  });

  it('renders share links via linkAs when provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    );

    render(
      <ShareButtons
        links={buildLinks()}
        open
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
        linkAs={CustomLink}
      />,
    );

    expect(screen.getAllByTestId('custom-link')).toHaveLength(2);
  });

  it('forwards data-testid', () => {
    render(
      <ShareButtons
        links={buildLinks()}
        open={false}
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
        dataTestId="share-buttons"
      />,
    );
    expect(screen.getByTestId('share-buttons')).toBeVisible();
  });

  it('merges extra className', () => {
    render(
      <ShareButtons
        links={buildLinks()}
        open={false}
        onOpenChange={vi.fn()}
        triggerAriaLabel="Share this post"
        className="mt-4"
        dataTestId="share-buttons"
      />,
    );
    expect(screen.getByTestId('share-buttons').className).toContain('mt-4');
  });
});
