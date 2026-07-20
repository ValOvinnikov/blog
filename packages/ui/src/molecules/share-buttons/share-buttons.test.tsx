import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { ShareButtons } from './share-buttons';

faker.seed(123);

describe(`<${ShareButtons.name}/>`, () => {
  it('renders a share link to X, as a plain <a> by default, built from the url and title', () => {
    const url = faker.internet.url();
    const title = faker.lorem.sentence();
    render(<ShareButtons url={url} title={title} />);

    const link = screen.getByRole('link', { name: /share on x/i });
    expect(link.tagName).toBe('A');
    const href = new URL(link.getAttribute('href') ?? '');
    expect(`${href.origin}${href.pathname}`).toBe(
      'https://twitter.com/intent/tweet',
    );
    expect(href.searchParams.get('url')).toBe(url);
    expect(href.searchParams.get('text')).toBe(title);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a share link to LinkedIn, as a plain <a> by default, built from the url', () => {
    const url = faker.internet.url();
    const title = faker.lorem.sentence();
    render(<ShareButtons url={url} title={title} />);

    const link = screen.getByRole('link', { name: /share on linkedin/i });
    expect(link.tagName).toBe('A');
    const href = new URL(link.getAttribute('href') ?? '');
    expect(`${href.origin}${href.pathname}`).toBe(
      'https://www.linkedin.com/sharing/share-offsite/',
    );
    expect(href.searchParams.get('url')).toBe(url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the default English labels when no label props are given', () => {
    render(
      <ShareButtons
        url={faker.internet.url()}
        title={faker.lorem.sentence()}
      />,
    );

    expect(screen.getByRole('link', { name: 'Share on X' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Share on LinkedIn' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeVisible();
  });

  it('renders custom labels when xLabel, linkedInLabel, and copyLabel are provided', () => {
    render(
      <ShareButtons
        url={faker.internet.url()}
        title={faker.lorem.sentence()}
        xLabel="Partager sur X"
        linkedInLabel="Partager sur LinkedIn"
        copyLabel="Copier le lien"
      />,
    );

    expect(screen.getByRole('link', { name: 'Partager sur X' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Partager sur LinkedIn' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Copier le lien' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Share on X' }),
    ).not.toBeInTheDocument();
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
        url={faker.internet.url()}
        title={faker.lorem.sentence()}
        linkAs={CustomLink}
      />,
    );

    // X + LinkedIn share links
    expect(screen.getAllByTestId('custom-link')).toHaveLength(2);
  });

  it('calls onCopy when the copy button is clicked', async () => {
    const onCopy = vi.fn();
    render(
      <ShareButtons
        url={faker.internet.url()}
        title={faker.lorem.sentence()}
        onCopy={onCopy}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /copy link/i }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('does not throw when onCopy is omitted and the copy button is clicked', async () => {
    render(
      <ShareButtons
        url={faker.internet.url()}
        title={faker.lorem.sentence()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /copy link/i }));
    expect(screen.getByRole('button', { name: /copy link/i })).toBeVisible();
  });

  it('forwards data-testid', () => {
    render(
      <ShareButtons
        url={faker.internet.url()}
        title={faker.lorem.sentence()}
        dataTestId="share-buttons"
      />,
    );
    expect(screen.getByTestId('share-buttons')).toBeVisible();
  });

  it('merges extra className', () => {
    render(
      <ShareButtons
        url={faker.internet.url()}
        title={faker.lorem.sentence()}
        className="mt-4"
        dataTestId="share-buttons"
      />,
    );
    expect(screen.getByTestId('share-buttons').className).toContain('mt-4');
  });
});
