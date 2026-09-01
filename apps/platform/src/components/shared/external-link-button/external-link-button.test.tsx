import { SIZE } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';

import { ExternalLinkButton } from './external-link-button';

describe(ExternalLinkButton, () => {
  it('renders as an anchor with the given href, opening in a new tab safely', () => {
    render(
      <ExternalLinkButton href="https://acme.example.com">
        Open site
      </ExternalLinkButton>,
    );

    const link = screen.getByRole('link', { name: 'Open site' });
    expect(link).toHaveAttribute('href', 'https://acme.example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders every variant and size without throwing', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
    const sizes = [SIZE.SM, SIZE.MD] as const;

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        expect(() =>
          render(
            <ExternalLinkButton
              href="https://acme.example.com"
              variant={variant}
              size={size}
            >
              Open site
            </ExternalLinkButton>,
          ),
        ).not.toThrow();
      });
    });
  });

  it('applies the given ariaLabel as the accessible name', () => {
    render(
      <ExternalLinkButton
        href="https://acme.example.com"
        ariaLabel="Open Acme Inc.'s site"
      >
        Open site
      </ExternalLinkButton>,
    );

    expect(
      screen.getByRole('link', { name: "Open Acme Inc.'s site" }),
    ).toHaveAttribute('href', 'https://acme.example.com');
  });

  it('adds a visually-hidden "opens in new tab" hint to the accessible name when hasArrow is set', () => {
    render(
      <ExternalLinkButton href="https://acme.example.com" hasArrow={true}>
        Open site
      </ExternalLinkButton>,
    );

    expect(
      screen.getByRole('link', { name: 'Open site (opens in new tab)' }),
    ).toHaveAttribute('href', 'https://acme.example.com');
  });

  it('does not add the "opens in new tab" hint when hasArrow is unset', () => {
    render(
      <ExternalLinkButton href="https://acme.example.com">
        Open site
      </ExternalLinkButton>,
    );

    expect(screen.queryByText('(opens in new tab)')).not.toBeInTheDocument();
  });

  it('applies the given title attribute alongside an icon-only ariaLabel', () => {
    render(
      <ExternalLinkButton
        href="https://acme.example.com"
        ariaLabel="Open acme.example.com in a new tab"
        title="Open acme.example.com in a new tab"
      >
        ↗
      </ExternalLinkButton>,
    );

    expect(
      screen.getByRole('link', { name: 'Open acme.example.com in a new tab' }),
    ).toHaveAttribute('title', 'Open acme.example.com in a new tab');
  });
});
