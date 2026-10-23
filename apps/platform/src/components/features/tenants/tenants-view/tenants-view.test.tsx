import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  makeTenant,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { TenantsView } from './tenants-view';

const render = renderWithIntl;

const tenant = makeTenant();

const ARIA_PRESSED = 'aria-pressed';
const PRESSED = 'true';
const CODE_TAG = 'code';
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
      const code = screen.getByText('tenants', { selector: CODE_TAG });

      expect(code.localName).toBe(CODE_TAG);
    });

    it('links add-tenant to the wizard', () => {
      const addTenant = screen.getByRole('link', { name: 'Add tenant' });

      expect(addTenant).toHaveAttribute('href', adminRoutes.newTenant());
    });

    it('shows the archived-tenants toggle set to Active by default', () => {
      const activeButton = screen.getByRole('button', { name: 'Active' });

      expect(activeButton).toHaveAttribute(ARIA_PRESSED, PRESSED);
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

    const allButton = screen.getByRole('button', { name: 'All' });

    expect(allButton).toHaveAttribute(ARIA_PRESSED, PRESSED);
  });

  it('renders the email-alerts banner when email alerting is not configured', () => {
    render(
      <TenantsView
        tenants={[tenant]}
        shouldShowArchived={false}
        isEmailAlertingConfigured={false}
      />,
    );

    const banner = screen.getByText(EMAIL_ALERTS_NOT_CONFIGURED);
    const bannerDescription = screen.getByText(
      "RESEND_API_KEY isn't set, so operators won't be emailed when a tenant needs attention — check this page manually.",
    );

    expect(banner).toBeVisible();
    expect(bannerDescription).toBeVisible();
  });
});
