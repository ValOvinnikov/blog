import { SIZE } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';
import type { ComponentPropsWithoutRef } from 'react';

import { LinkButton } from './link-button';

// `LinkButton` defaults `as` to `@platform/i18n/navigation`'s `Link`
// (next-intl's locale-aware navigation), which needs real routing context
// this test environment doesn't provide — mock it the same way
// `tenant-switcher.test.tsx` and `sidebar.test.tsx` do for their own links.
vi.mock('@platform/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe(LinkButton, () => {
  it('renders as an anchor with the given href', () => {
    render(<LinkButton href="/tenants">Tenants</LinkButton>);

    const link = screen.getByRole('link', { name: 'Tenants' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/tenants');
  });

  it('renders every variant and size without throwing', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
    const sizes = [SIZE.SM, SIZE.MD] as const;

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        expect(() =>
          render(
            <LinkButton href="/tenants" variant={variant} size={size}>
              Tenants
            </LinkButton>,
          ),
        ).not.toThrow();
      });
    });
  });

  it('applies the given ariaLabel as the accessible name', () => {
    render(
      <LinkButton href="/tenants" ariaLabel="Manage Acme Inc.">
        Manage
      </LinkButton>,
    );

    expect(
      screen.getByRole('link', { name: 'Manage Acme Inc.' }),
    ).toHaveAttribute('href', '/tenants');
  });

  it('keeps a decorative arrow out of the accessible name', () => {
    render(
      <LinkButton href="/tenants" hasArrow={true}>
        View steps
      </LinkButton>,
    );

    expect(
      screen.getByRole('link', { name: 'View steps' }),
    ).toBeInTheDocument();
  });

  it('renders through a custom `as` component', () => {
    const StubLink = ({
      href,
      className,
      children,
    }: {
      href: string;
      className?: string;
      children?: React.ReactNode;
    }) => (
      <a href={href} className={className} data-stub="true">
        {children}
      </a>
    );

    render(
      <LinkButton as={StubLink} href="/tenants">
        Tenants
      </LinkButton>,
    );

    const link = screen.getByRole('link', { name: 'Tenants' });
    expect(link).toHaveAttribute('data-stub', 'true');
    expect(link).toHaveAttribute('href', '/tenants');
  });
});
