import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { TenantsView } from './tenants-view';

const render = renderWithIntl;

const tenant = makeTenant();

describe(TenantsView, () => {
  it('renders the real tenant row', () => {
    render(
      <TenantsView
        tenants={[tenant]}
        shouldShowArchived={false}
        isEmailAlertingConfigured={true}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByText('Acme Inc.')).toBeVisible();
  });

  it("renders the description's code chunk as a real <code> element", () => {
    render(
      <TenantsView
        tenants={[tenant]}
        shouldShowArchived={false}
        isEmailAlertingConfigured={true}
      />,
    );

    const code = screen.getByText('tenants', { selector: 'code' });
    expect(code.tagName).toBe('CODE');
  });

  it('links add-tenant to the wizard', () => {
    render(
      <TenantsView
        tenants={[tenant]}
        shouldShowArchived={false}
        isEmailAlertingConfigured={true}
      />,
    );

    const addTenant = screen.getByRole('link', { name: /add tenant/i });
    expect(addTenant).toHaveAttribute('href', '/tenants/new');
  });

  it('shows the archived-tenants toggle set to Active by default', () => {
    render(
      <TenantsView
        tenants={[tenant]}
        shouldShowArchived={false}
        isEmailAlertingConfigured={true}
      />,
    );

    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
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

  it('renders no email-alerts banner when email alerting is configured', () => {
    render(
      <TenantsView
        tenants={[tenant]}
        shouldShowArchived={false}
        isEmailAlertingConfigured={true}
      />,
    );

    expect(
      screen.queryByText('Email alerts not configured'),
    ).not.toBeInTheDocument();
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
