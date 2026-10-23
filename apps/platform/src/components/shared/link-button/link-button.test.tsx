import { SIZE } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { LinkButton } from './link-button';

vi.mock('@platform/i18n/navigation');

const TENANTS = 'Tenants';
const MANAGE_TENANT = `Manage ${MOCK_TENANT_NAME}`;

describe(LinkButton, () => {
  it('renders as an anchor with the given href', () => {
    render(<LinkButton href={adminRoutes.tenants()}>{TENANTS}</LinkButton>);

    const link = screen.getByRole('link', { name: TENANTS });

    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', adminRoutes.tenants());
  });

  it('renders every variant and size without throwing', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
    const sizes = [SIZE.SM, SIZE.MD] as const;

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        expect(() =>
          render(
            <LinkButton
              href={adminRoutes.tenants()}
              variant={variant}
              size={size}
            >
              {TENANTS}
            </LinkButton>,
          ),
        ).not.toThrow();
      });
    });
  });

  it('applies the given ariaLabel as the accessible name', () => {
    render(
      <LinkButton href={adminRoutes.tenants()} ariaLabel={MANAGE_TENANT}>
        Manage
      </LinkButton>,
    );

    const link = screen.getByRole('link', { name: MANAGE_TENANT });

    expect(link).toHaveAttribute('href', adminRoutes.tenants());
  });

  it('keeps a decorative arrow out of the accessible name', () => {
    render(
      <LinkButton href={adminRoutes.tenants()} hasArrow={true}>
        View steps
      </LinkButton>,
    );

    const link = screen.getByRole('link', { name: 'View steps' });

    expect(link).toBeVisible();
  });
});
