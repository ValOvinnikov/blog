import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { TenantsView } from './tenants-view';

const render = renderWithIntl;

const tenant = makeTenant();

describe(TenantsView, () => {
  describe('with default props', () => {
    beforeEach(() => {
      render(
        <TenantsView
          tenants={[tenant]}
          shouldShowArchived={false}
          isEmailAlertingConfigured={true}
        />,
      );
    });

    it('renders the real tenant row', () => {
      expect(screen.getByRole('heading', { name: 'Tenants' })).toBeVisible();
      expect(screen.getByText('Acme Inc.')).toBeVisible();
    });

    it("renders the description's code chunk as a real <code> element", () => {
      const code = screen.getByText('tenants', { selector: 'code' });
      expect(code.tagName).toBe('CODE');
    });

    it('links add-tenant to the wizard', () => {
      const addTenant = screen.getByRole('link', { name: 'Add tenant' });
      expect(addTenant).toHaveAttribute('href', '/tenants/new');
    });

    it('shows the archived-tenants toggle set to Active by default', () => {
      expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('renders no email-alerts banner when email alerting is configured', () => {
      expect(
        screen.queryByText('Email alerts not configured'),
      ).not.toBeInTheDocument();
    });
  });

  it('shows the archived-tenants toggle set to All when shouldShowArchived is true', () => {
    render(
      <TenantsView
        tenants={[tenant]}
        shouldShowArchived={true}
        isEmailAlertingConfigured={true}
      />,
    );

    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders the email-alerts banner when email alerting is not configured', () => {
    render(
      <TenantsView
        tenants={[tenant]}
        shouldShowArchived={false}
        isEmailAlertingConfigured={false}
      />,
    );

    expect(screen.getByText('Email alerts not configured')).toBeVisible();
    expect(
      screen.getByText(
        "RESEND_API_KEY isn't set, so operators won't be emailed when a tenant needs attention — check this page manually.",
      ),
    ).toBeVisible();
  });
});
