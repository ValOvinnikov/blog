import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockTenant,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { TenantsView } from './tenants-view';

const setup = customRender(TenantsView, {
  tenants: [mockTenant()],
  shouldShowArchived: false,
  isEmailAlertingConfigured: true,
});

const ARIA_PRESSED = 'aria-pressed';
const PRESSED = 'true';
const EMAIL_ALERTS_NOT_CONFIGURED = 'Email alerts not configured';

describe(`<${TenantsView.name}/>`, () => {
  describe('with email alerting configured', () => {
    beforeEach(() => {
      setup();
    });

    it('lists the tenants under the page heading', () => {
      const heading = screen.getByRole('heading', { name: 'Tenants' });
      const tenantName = screen.getByText(MOCK_TENANT_NAME);

      expect(heading).toBeVisible();
      expect(tenantName).toBeVisible();
    });

    it('links add-tenant to the wizard', () => {
      const addTenant = screen.getByRole('link', { name: 'Add tenant' });

      expect(addTenant).toHaveAttribute('href', adminRoutes.newTenant());
    });

    it('filters to active tenants by default', () => {
      const activeButton = screen.getByRole('button', { name: 'Active' });

      expect(activeButton).toHaveAttribute(ARIA_PRESSED, PRESSED);
    });

    it('hides the email-alerts banner when alerting is configured', () => {
      const banner = screen.queryByText(EMAIL_ALERTS_NOT_CONFIGURED);

      expect(banner).not.toBeInTheDocument();
    });
  });

  it('filters to all tenants when archived tenants are included', () => {
    setup({ shouldShowArchived: true });

    const allButton = screen.getByRole('button', { name: 'All' });

    expect(allButton).toHaveAttribute(ARIA_PRESSED, PRESSED);
  });

  it('warns when email alerting is not configured', () => {
    setup({ isEmailAlertingConfigured: false });

    const banner = screen.getByText(EMAIL_ALERTS_NOT_CONFIGURED);
    const bannerDescription = screen.getByText(
      "RESEND_API_KEY isn't set, so operators won't be emailed when a tenant needs attention — check this page manually.",
    );

    expect(banner).toBeVisible();
    expect(bannerDescription).toBeVisible();
  });
});
