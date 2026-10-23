import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { TenantsView } from './tenants-view';

const render = renderWithIntl;

const tenant = mockTenant();
const ARIA_PRESSED = 'aria-pressed';
const EMAIL_ALERTS_NOT_CONFIGURED = 'Email alerts not configured';

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
      const heading = screen.getByRole('heading', { name: 'Tenants' });
      const tenantName = screen.getByText(MOCK_TENANT_NAME);
      expect(heading).toBeVisible();
      expect(tenantName).toBeVisible();
    });

    it("renders the description's code chunk as a real <code> element", () => {
      const code = screen.getByText('tenants', { selector: 'code' });
      expect(code).toBeVisible();
    });

    it('links add-tenant to the wizard', () => {
      const addTenant = screen.getByRole('link', { name: 'Add tenant' });
      expect(addTenant).toHaveAttribute('href', '/tenants/new');
    });

    it('shows the archived-tenants toggle set to Active by default', () => {
      const activeToggle = screen.getByRole('button', { name: 'Active' });
      expect(activeToggle).toHaveAttribute(ARIA_PRESSED, 'true');
    });

    it('renders no email-alerts banner when email alerting is configured', () => {
      const banner = screen.queryByText(EMAIL_ALERTS_NOT_CONFIGURED);
      expect(banner).not.toBeInTheDocument();
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

    const allToggle = screen.getByRole('button', { name: 'All' });
    expect(allToggle).toHaveAttribute(ARIA_PRESSED, 'true');
  });

  it('renders the email-alerts banner when email alerting is not configured', () => {
    render(
      <TenantsView
        tenants={[tenant]}
        shouldShowArchived={false}
        isEmailAlertingConfigured={false}
      />,
    );

    const bannerTitle = screen.getByText(EMAIL_ALERTS_NOT_CONFIGURED);
    const bannerBody = screen.getByText(
      "RESEND_API_KEY isn't set, so operators won't be emailed when a tenant needs attention — check this page manually.",
    );
    expect(bannerTitle).toBeVisible();
    expect(bannerBody).toBeVisible();
  });
});
