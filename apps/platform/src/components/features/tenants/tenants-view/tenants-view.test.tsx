import { setTenantPinAction } from '@platform/server/tenants/set-tenant-pin-action';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { holdPinSave } from '@platform/testing/pinned-tenants/held-save';
import { pinLabelsFor } from '@platform/testing/pinned-tenants/pin-labels';
import { tabTo } from '@platform/testing/tab-to';
import {
  mockTenantsListQuery,
  mockTenantsPageRow,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { mockPinnedTenant } from '@platform/testing/tenants/pinned-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantsView } from './tenants-view';

vi.mock('@platform/server/tenants/set-tenant-pin-action');

const tPinned = makeEnTranslator('pinnedTenants');
const tView = makeEnTranslator('tenantsView');
const tSearch = makeEnTranslator('tenantsSearch');
const tVisibility = makeEnTranslator('archivedTenantsToggle');
const tBanner = makeEnTranslator('emailAlertsBanner');
const { pinLabel, unpinLabel } = pinLabelsFor(MOCK_TENANT_NAME);
const TENANTS_TITLE = tView('title');
const SEARCH_LABEL = tSearch('label');
const ONE_PIN_SECTION = tPinned('titleAccessible', { count: 1 });
const EMAIL_ALERTS_NOT_CONFIGURED = tBanner('title');

const setup = customRender(TenantsView, {
  tenants: [mockTenantsPageRow()],
  pinnedTenants: [],
  total: 1,
  totalPages: 1,
  listQuery: mockTenantsListQuery(),
  isEmailAlertingConfigured: true,
});

const tileUnpinButton = () => {
  const section = screen.getByRole('region', { name: ONE_PIN_SECTION });

  return within(section).getByRole('button', { name: unpinLabel });
};

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
      const heading = screen.getByRole('heading', { name: TENANTS_TITLE });
      const tenantName = screen.getByText(MOCK_TENANT_NAME);

      expect(heading).toBeVisible();
      expect(tenantName).toBeVisible();
    });

    it('links add-tenant to the wizard', () => {
      const addTenant = screen.getByRole('link', { name: tView('addTenant') });

      expect(addTenant).toHaveAttribute('href', adminRoutes.newTenant());
    });

    it('offers a tenant search', () => {
      const search = screen.getByRole('searchbox', { name: SEARCH_LABEL });

      expect(search).toBeVisible();
    });

    it('filters to active tenants by default', () => {
      const activeButton = screen.getByRole('button', {
        name: tVisibility('activeOption'),
      });

      expect(activeButton).toBePressed();
    });

    it('hides the email-alerts banner when alerting is configured', () => {
      const banner = screen.queryByText(EMAIL_ALERTS_NOT_CONFIGURED);

      expect(banner).not.toBeInTheDocument();
    });

    it('adds a tenant to the pinned section when its row toggle is pressed', async () => {
      const save = holdPinSave();

      const rowToggle = screen.getByRole('button', { name: pinLabel });
      await user.click(rowToggle);

      const tileUnpin = tileUnpinButton();

      expect(tileUnpin).toBeVisible();
      expect(setTenantPinAction).toHaveBeenCalledWith(MOCK_TENANT_ID, true);

      await save.settle();
    });
  });

  it('warns when email alerting is not configured', () => {
    setup({ isEmailAlertingConfigured: false });

    const banner = screen.getByText(EMAIL_ALERTS_NOT_CONFIGURED);

    expect(banner).toBeVisible();
  });

  describe('with one pin while the unpin save is held', () => {
    let save: ReturnType<typeof holdPinSave>;

    beforeEach(() => {
      save = holdPinSave();
      setup({ pinnedTenants: [mockPinnedTenant()] });
    });

    afterEach(async () => {
      await save.settle();
    });

    it("shows the operator's pins in a section of their own", () => {
      const heading = screen.getByRole('heading', { name: ONE_PIN_SECTION });

      expect(heading).toBeVisible();
    });

    it('hands focus to the search when the only tile unpins itself', async () => {
      const tileUnpin = tileUnpinButton();
      await tabTo(user, tileUnpin);
      await user.keyboard(USER_EVENT_KEY.ENTER);

      const search = screen.getByRole('searchbox', { name: SEARCH_LABEL });

      expect(search).toHaveFocus();
    });

    it('keeps focus on a row toggle that unpins its tenant', async () => {
      const table = screen.getByRole('region', { name: TENANTS_TITLE });
      const rowToggle = within(table).getByRole('button', {
        name: unpinLabel,
      });
      await user.click(rowToggle);

      const unpinnedToggle = within(table).getByRole('button', {
        name: pinLabel,
      });

      expect(unpinnedToggle).toHaveFocus();
    });
  });
});
