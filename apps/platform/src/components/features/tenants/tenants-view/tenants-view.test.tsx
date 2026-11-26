import { pinTenantAction } from '@platform/server/tenants/pin-tenant-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { holdSave } from '@platform/testing/pinned-tenants/held-save';
import {
  mockTenantsListQuery,
  mockTenantsPageRow,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { mockPinnedTenant } from '@platform/testing/tenants/pinned-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantsView } from './tenants-view';

vi.mock('@platform/server/tenants/pin-tenant-action');
vi.mock('@platform/server/tenants/unpin-tenant-action');

const tPinned = makeEnTranslator('pinnedTenants');
const NAMED = { name: MOCK_TENANT_NAME };
const PINNED_HEADING = new RegExp(tPinned('title'));
const PIN_LABEL = tPinned('pinAriaLabel', NAMED);
const UNPIN_LABEL = tPinned('unpinAriaLabel', NAMED);

const setup = customRender(TenantsView, {
  tenants: [mockTenantsPageRow()],
  pinnedTenants: [],
  total: 1,
  totalPages: 1,
  listQuery: mockTenantsListQuery(),
  isEmailAlertingConfigured: true,
});

const ARIA_PRESSED = 'aria-pressed';
const PRESSED = 'true';
const EMAIL_ALERTS_NOT_CONFIGURED = 'Email alerts not configured';

describe(`<${TenantsView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

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

    it('offers a tenant search', () => {
      const search = screen.getByRole('searchbox', { name: 'Search tenants' });

      expect(search).toBeVisible();
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

  it('warns when email alerting is not configured', () => {
    setup({ isEmailAlertingConfigured: false });

    const banner = screen.getByText(EMAIL_ALERTS_NOT_CONFIGURED);

    expect(banner).toBeVisible();
  });

  it("shows the operator's pins in a section of their own", () => {
    setup({ pinnedTenants: [mockPinnedTenant()] });

    const heading = screen.getByRole('heading', { name: PINNED_HEADING });

    expect(heading).toBeVisible();
  });

  it('adds a tenant to the pinned section when its row toggle is pressed', async () => {
    const save = holdSave();
    vi.mocked(pinTenantAction).mockReturnValueOnce(save.promise);
    setup();

    const rowToggle = screen.getByRole('button', { name: PIN_LABEL });
    await user.click(rowToggle);

    const heading = screen.getByRole('heading', { name: PINNED_HEADING });
    const unpinButtons = screen.getAllByRole('button', { name: UNPIN_LABEL });

    expect(heading).toBeVisible();
    expect(unpinButtons).toHaveLength(2);

    save.settle();
    const settledToggle = await screen.findByRole('button', {
      name: PIN_LABEL,
    });

    expect(settledToggle).toBeVisible();
  });
});
