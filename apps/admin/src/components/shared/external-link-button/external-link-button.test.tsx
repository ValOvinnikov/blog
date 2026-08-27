import { render, screen } from '@admin/testing/custom-render';
import { Size } from '@blog/config';

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
    const sizes = [Size.SM, Size.MD] as const;

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
});
