import { setTenantPinAction } from '@platform/server/tenants/set-tenant-pin-action';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { stubFirstRowTileCount } from '@platform/testing/pinned-tenants/first-row-tile-count';
import { holdPinSave } from '@platform/testing/pinned-tenants/held-save';
import { pinLabelsFor } from '@platform/testing/pinned-tenants/pin-labels';
import { customRenderInPinnedTenants } from '@platform/testing/pinned-tenants/render-in-pinned-tenants';
import { resizeObservedElements } from '@platform/testing/resize-observer';
import { tabTo } from '@platform/testing/tab-to';
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
  mockThirdPinnedTenant,
} from '@platform/testing/tenants/pinned-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TMaybeUndefined } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PinnedTenants } from './pinned-tenants';

vi.mock('@platform/server/tenants/set-tenant-pin-action');

const tPinned = makeEnTranslator('pinnedTenants');
const tPlan = makeEnTranslator('planNames');
const tTable = makeEnTranslator('tenantsTable');
const MOCK_PINS = [
  mockPinnedTenant(),
  mockOtherPinnedTenant({
    plan: TENANT_PLAN.GROWTH,
    status: TENANT_STATUS.SUSPENDED,
  }),
];
const MOCK_THIRD_PIN = mockThirdPinnedTenant();
const MOCK_THREE_PINS = [...MOCK_PINS, MOCK_THIRD_PIN];
const SHOW_ALL = tPinned('showAll', { count: MOCK_PINS.length });
const SHOW_LESS = tPinned('showLess');
const EXPANDED = 'true';
const COLLAPSED = 'false';
const INERT = 'inert';

const setup = customRenderInPinnedTenants(PinnedTenants, {});

const tileLinkOf = (tenantName: string) =>
  screen.getByRole('link', {
    name: (accessibleName) => accessibleName.includes(tenantName),
  });

const unpinButtonOf = (tenantName: string) =>
  screen.getByRole('button', { name: pinLabelsFor(tenantName).unpinLabel });

describe(`<${PinnedTenants.name}/>`, () => {
  let user: UserEvent;

  const unpinByKeyboard = async (tenantName: string) => {
    const unpinButton = unpinButtonOf(tenantName);
    await tabTo(user, unpinButton);
    await user.keyboard(USER_EVENT_KEY.ENTER);
  };

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders nothing when the operator has no pins', () => {
    setup();

    const heading = screen.queryByRole('heading');

    expect(heading).not.toBeInTheDocument();
  });

  it.each([
    { count: 1, pinnedTenants: [mockPinnedTenant()] },
    { count: MOCK_PINS.length, pinnedTenants: MOCK_PINS },
  ])(
    'names the section by its pin count of $count',
    ({ count, pinnedTenants }) => {
      setup({}, { pinnedTenants });

      const heading = screen.getByRole('heading', {
        name: tPinned('titleAccessible', { count }),
      });

      expect(heading).toBeVisible();
    },
  );

  describe('with two pins', () => {
    beforeEach(() => {
      setup({}, { pinnedTenants: MOCK_PINS });
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
      const save = holdPinSave();

      const unpinButton = unpinButtonOf(MOCK_TENANT_NAME);
      await user.click(unpinButton);

      const removedName = screen.queryByText(MOCK_TENANT_NAME);
      const keptName = screen.getByText(MOCK_OTHER_TENANT_NAME);

      expect(removedName).not.toBeInTheDocument();
      expect(keptName).toBeVisible();
      expect(setTenantPinAction).toHaveBeenCalledWith(MOCK_TENANT_ID, false);

      await save.settle();
    });
  });

  describe('with three pins while the unpin save is held', () => {
    let save: ReturnType<typeof holdPinSave>;

    beforeEach(() => {
      save = holdPinSave();
      setup({}, { pinnedTenants: MOCK_THREE_PINS });
    });

    afterEach(async () => {
      await save.settle();
    });

    it.each([
      {
        position: 'middle',
        neighbour: 'next',
        unpinnedName: MOCK_OTHER_TENANT_NAME,
        focusedName: MOCK_THIRD_PIN.name,
      },
      {
        position: 'last',
        neighbour: 'previous',
        unpinnedName: MOCK_THIRD_PIN.name,
        focusedName: MOCK_OTHER_TENANT_NAME,
      },
    ])(
      'hands focus to the $neighbour tile when the $position tile unpins itself',
      async ({ unpinnedName, focusedName }) => {
        await unpinByKeyboard(unpinnedName);

        const neighbourUnpin = unpinButtonOf(focusedName);

        expect(neighbourUnpin).toHaveFocus();
      },
    );

    it('leaves focus put when a failed save brings the tile back', async () => {
      await unpinByKeyboard(MOCK_OTHER_TENANT_NAME);
      await save.fail();

      const nextUnpin = unpinButtonOf(MOCK_THIRD_PIN.name);

      expect(nextUnpin).toHaveFocus();
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

    it('moves focus to Show all when its tile wraps out of the first row', async () => {
      const wrappingUnpin = unpinButtonOf(MOCK_OTHER_TENANT_NAME);
      await tabTo(user, wrappingUnpin);

      stubFirstRowTileCount(MOCK_PINS.length - 1);
      await resizeObservedElements();

      const showAll = screen.getByRole('button', { name: SHOW_ALL });

      expect(showAll).toHaveFocus();
    });
  });

  describe('when the pins overflow the first row', () => {
    let showAll: HTMLElement;
    let overflowTile: TMaybeUndefined<HTMLElement>;

    beforeEach(() => {
      stubFirstRowTileCount(MOCK_PINS.length - 1);
      setup({}, { pinnedTenants: MOCK_PINS });
      showAll = screen.getByRole('button', { name: SHOW_ALL });
      [, overflowTile] = screen.getAllByRole('listitem', { hidden: true });
    });

    it('offers a collapsed Show all button with the pin count', () => {
      expect(showAll).toHaveAttribute(ARIA_EXPANDED, COLLAPSED);
    });

    it('keeps the tiles past the first row out of reach', () => {
      expect(overflowTile).toHaveAttribute(INERT);
    });

    describe('once expanded', () => {
      let showLess: HTMLElement;

      beforeEach(async () => {
        await user.click(showAll);
        showLess = screen.getByRole('button', { name: SHOW_LESS });
      });

      it('reads Show less and reports itself expanded', () => {
        expect(showLess).toHaveAttribute(ARIA_EXPANDED, EXPANDED);
      });

      it('brings every tile within reach', () => {
        expect(overflowTile).not.toHaveAttribute(INERT);
      });

      it('collapses again on Show less', async () => {
        await user.click(showLess);

        const collapsed = screen.getByRole('button', { name: SHOW_ALL });

        expect(collapsed).toHaveAttribute(ARIA_EXPANDED, COLLAPSED);
      });
    });
  });
});
