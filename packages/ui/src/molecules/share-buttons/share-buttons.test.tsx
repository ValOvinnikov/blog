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
  it('renders a link for each entry in links, as plain <a>s by default', () => {
    const links = buildLinks();
    render(<ShareButtons links={links} />);

    links.forEach(({ href, label }) => {
      const link = screen.getByRole('link', { name: label });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders the copy-link button with the default label', () => {
    render(<ShareButtons links={buildLinks()} />);
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeVisible();
  });

  it('renders a custom copyLabel when provided', () => {
    render(<ShareButtons links={buildLinks()} copyLabel="Copier le lien" />);
    expect(
      screen.getByRole('button', { name: 'Copier le lien' }),
    ).toBeVisible();
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

    render(<ShareButtons links={buildLinks()} linkAs={CustomLink} />);

    expect(screen.getAllByTestId('custom-link')).toHaveLength(2);
  });

  it('calls onCopy when the copy button is clicked', async () => {
    const onCopy = vi.fn();
    render(<ShareButtons links={buildLinks()} onCopy={onCopy} />);

    await userEvent.click(screen.getByRole('button', { name: /copy link/i }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('does not throw when onCopy is omitted and the copy button is clicked', async () => {
    render(<ShareButtons links={buildLinks()} />);

    await userEvent.click(screen.getByRole('button', { name: /copy link/i }));
    expect(screen.getByRole('button', { name: /copy link/i })).toBeVisible();
  });

  it('forwards data-testid', () => {
    render(<ShareButtons links={buildLinks()} dataTestId="share-buttons" />);
    expect(screen.getByTestId('share-buttons')).toBeVisible();
  });

  it('merges extra className', () => {
    render(
      <ShareButtons
        links={buildLinks()}
        className="mt-4"
        dataTestId="share-buttons"
      />,
    );
    expect(screen.getByTestId('share-buttons').className).toContain('mt-4');
  });
});
