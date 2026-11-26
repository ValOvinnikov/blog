import { unpinTenantAction } from '@platform/server/tenants/unpin-tenant-action';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { stubFirstRowTileCount } from '@platform/testing/pinned-tenants/first-row-tile-count';
import { holdSave } from '@platform/testing/pinned-tenants/held-save';
import { customRenderInPinnedTenants } from '@platform/testing/pinned-tenants/render-in-pinned-tenants';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import {
  mockOtherPinnedTenant,
  mockPinnedTenant,
} from '@platform/testing/tenants/pinned-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PinnedTenants } from './pinned-tenants';

vi.mock('@platform/server/tenants/unpin-tenant-action');

const tPinned = makeEnTranslator('pinnedTenants');
const tPlan = makeEnTranslator('planNames');
const tTable = makeEnTranslator('tenantsTable');
const ARIA_EXPANDED = 'aria-expanded';
const MOCK_PINS = [
  mockPinnedTenant(),
  mockOtherPinnedTenant({
    plan: TENANT_PLAN.GROWTH,
    status: TENANT_STATUS.SUSPENDED,
  }),
];
const SHOW_ALL = tPinned('showAll', { count: MOCK_PINS.length });
const SHOW_LESS = tPinned('showLess');

const setup = customRenderInPinnedTenants(PinnedTenants, {});

const tileLinkOf = (tenantName: string) =>
  screen.getByRole('link', {
    name: (accessibleName) => accessibleName.includes(tenantName),
  });

describe(`<${PinnedTenants.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders nothing when the operator has no pins', () => {
    setup();

    const heading = screen.queryByRole('heading', { name: tPinned('title') });

    expect(heading).not.toBeInTheDocument();
  });

  describe('with two pins', () => {
    beforeEach(() => {
      setup({}, { pinnedTenants: MOCK_PINS });
    });

    it('titles the section with the number of pins', () => {
      const heading = screen.getByRole('heading', {
        name: new RegExp(tPinned('title')),
      });

      expect(heading).toHaveTextContent(
        `${tPinned('title')}${MOCK_PINS.length}`,
      );
    });

    it('shows each tenant with its domain, plan and status', () => {
      const acmeTile = within(tileLinkOf(MOCK_TENANT_NAME));
      const acmeDomain = acmeTile.getByText(MOCK_TENANT_DOMAIN);
      const acmePlan = acmeTile.getByText(tPlan(TENANT_PLAN.FREE));
      const acmeStatus = acmeTile.getByText(
        tTable(`status.${TENANT_STATUS.ACTIVE}`),
      );
      const globexTile = within(tileLinkOf(MOCK_OTHER_TENANT_NAME));
      const globexDomain = globexTile.getByText(MOCK_OTHER_TENANT_DOMAIN);
      const globexPlan = globexTile.getByText(tPlan(TENANT_PLAN.GROWTH));
      const globexStatus = globexTile.getByText(
        tTable(`status.${TENANT_STATUS.SUSPENDED}`),
      );

      expect(acmeDomain).toBeVisible();
      expect(acmePlan).toBeVisible();
      expect(acmeStatus).toBeVisible();
      expect(globexDomain).toBeVisible();
      expect(globexPlan).toBeVisible();
      expect(globexStatus).toBeVisible();
    });

    it("links each tile to the tenant's manage page", () => {
      const acmeLink = tileLinkOf(MOCK_TENANT_NAME);
      const globexLink = tileLinkOf(MOCK_OTHER_TENANT_NAME);

      expect(acmeLink).toHaveAttribute(
        'href',
        adminRoutes.tenantOverview(MOCK_TENANT_ID),
      );
      expect(globexLink).toHaveAttribute(
        'href',
        adminRoutes.tenantOverview(MOCK_OTHER_TENANT_ID),
      );
    });

    it('removes a tile at once when its unpin button is pressed', async () => {
      const save = holdSave();
      vi.mocked(unpinTenantAction).mockReturnValueOnce(save.promise);

      const unpinButton = screen.getByRole('button', {
        name: tPinned('unpinAriaLabel', { name: MOCK_TENANT_NAME }),
      });
      await user.click(unpinButton);

      const removedName = screen.queryByText(MOCK_TENANT_NAME);
      const keptName = screen.getByText(MOCK_OTHER_TENANT_NAME);

      expect(removedName).not.toBeInTheDocument();
      expect(keptName).toBeVisible();
      expect(unpinTenantAction).toHaveBeenCalledWith(MOCK_TENANT_ID);

      save.settle();
      const settledName = await screen.findByText(MOCK_TENANT_NAME);

      expect(settledName).toBeVisible();
    });
  });

  describe('when every tile fits the first row', () => {
    beforeEach(() => {
      stubFirstRowTileCount(MOCK_PINS.length);
      setup({}, { pinnedTenants: MOCK_PINS });
    });

    it('offers no Show all button', () => {
      const showAll = screen.queryByRole('button', { name: SHOW_ALL });

      expect(showAll).not.toBeInTheDocument();
    });
  });

  describe('when the pins overflow the first row', () => {
    let showAll: HTMLElement;

    beforeEach(() => {
      stubFirstRowTileCount(MOCK_PINS.length - 1);
      setup({}, { pinnedTenants: MOCK_PINS });
      showAll = screen.getByRole('button', { name: SHOW_ALL });
    });

    it('offers a collapsed Show all button with the pin count', () => {
      expect(showAll).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    describe('once expanded', () => {
      let showLess: HTMLElement;

      beforeEach(async () => {
        await user.click(showAll);
        showLess = screen.getByRole('button', { name: SHOW_LESS });
      });

      it('reads Show less and reports itself expanded', () => {
        expect(showLess).toHaveAttribute(ARIA_EXPANDED, 'true');
      });

      it('collapses again on Show less', async () => {
        await user.click(showLess);

        const collapsed = screen.getByRole('button', { name: SHOW_ALL });

        expect(collapsed).toHaveAttribute(ARIA_EXPANDED, 'false');
      });
    });
  });
});
