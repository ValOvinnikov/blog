import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import {
  MOCK_SIDEBAR_NAV_ITEMS,
  MOCK_SIDEBAR_NAV_LABEL,
  MOCK_SIDEBAR_NAV_PRICING_ITEM,
} from '@web/testing/shared/sidebar-nav/fixtures';

import { SidebarNav } from './sidebar-nav';

vi.mock('@web/i18n/navigation');

const ARIA_CURRENT = 'aria-current';
const ARIA_EXPANDED = 'aria-expanded';
const ITEM_COUNT = MOCK_SIDEBAR_NAV_ITEMS.length;
const PRICING_LABEL = MOCK_SIDEBAR_NAV_PRICING_ITEM.label;

const setup = customRender(SidebarNav, {
  items: MOCK_SIDEBAR_NAV_ITEMS,
  activeKey: MOCK_SIDEBAR_NAV_PRICING_ITEM.href,
  label: MOCK_SIDEBAR_NAV_LABEL,
  ariaCurrent: 'page',
});

const getMobileTrigger = () =>
  screen.getByRole('button', { name: new RegExp(MOCK_SIDEBAR_NAV_LABEL) });

describe(`<${SidebarNav.name}/>`, () => {
  describe('with an active item', () => {
    let user: UserEvent;
    let trigger: HTMLElement;

    beforeEach(() => {
      user = userEvent.setup();
      setup();
      trigger = getMobileTrigger();
    });

    it('renders a single nav landmark named by its label', () => {
      const navs = screen.getAllByRole('navigation', {
        name: MOCK_SIDEBAR_NAV_LABEL,
      });

      expect(navs).toHaveLength(1);
    });

    it('labels the desktop list with a heading that names the nav landmark', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_SIDEBAR_NAV_LABEL,
      });
      const nav = screen.getByRole('navigation', {
        name: MOCK_SIDEBAR_NAV_LABEL,
      });

      expect(nav).toContainElement(heading);
    });

    it('shows the active item in the mobile selector', () => {
      const selector = screen.getByRole('button', {
        name: `${MOCK_SIDEBAR_NAV_LABEL} ${PRICING_LABEL}`,
      });

      expect(selector).toBeVisible();
    });

    it('renders every item as a link to its href in the desktop list, in order', () => {
      const hrefs = screen
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'));

      expect(hrefs).toEqual(MOCK_SIDEBAR_NAV_ITEMS.map(({ href }) => href));
    });

    it('marks only the item whose href matches activeKey with aria-current', () => {
      const activeLink = screen.getByRole('link', { name: PRICING_LABEL });

      expect(activeLink).toHaveAttribute(ARIA_CURRENT, 'page');
      MOCK_SIDEBAR_NAV_ITEMS.filter(
        ({ label }) => label !== PRICING_LABEL,
      ).forEach(({ label }) => {
        const link = screen.getByRole('link', { name: label });

        expect(link).not.toHaveAttribute(ARIA_CURRENT);
      });
    });

    it('starts with the mobile disclosure closed and its links hidden', () => {
      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(screen.getAllByRole('link')).toHaveLength(ITEM_COUNT);
    });

    it('opens the mobile disclosure on trigger click, exposing plain links', async () => {
      await user.click(trigger);

      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(screen.getAllByRole('link')).toHaveLength(ITEM_COUNT * 2);
    });

    it('never puts WAI-ARIA menu roles on either copy of the list', async () => {
      await user.click(trigger);

      const menu = screen.queryByRole('menu');
      const menuItem = screen.queryByRole('menuitem');

      expect(menu).not.toBeInTheDocument();
      expect(menuItem).not.toBeInTheDocument();
    });

    it('lets Tab leave the open mobile disclosure without trapping focus', async () => {
      await user.click(trigger);

      const lastLinkInPanel = screen
        .getAllByRole('link', { name: MOCK_SIDEBAR_NAV_ITEMS.at(-1)?.label })
        .at(-1);
      const firstDesktopLink = screen
        .getAllByRole('link', { name: MOCK_SIDEBAR_NAV_ITEMS.at(0)?.label })
        .at(0);
      lastLinkInPanel?.focus();

      await user.tab();

      expect(lastLinkInPanel).not.toHaveFocus();
      expect(firstDesktopLink).not.toHaveFocus();
    });

    it('closes the mobile disclosure on Escape', async () => {
      await user.click(trigger);
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(screen.getAllByRole('link')).toHaveLength(ITEM_COUNT);
    });

    it('closes the mobile disclosure on an outside click', async () => {
      await user.click(trigger);
      fireEvent.mouseDown(document.body);

      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(screen.getAllByRole('link')).toHaveLength(ITEM_COUNT);
    });

    it('closes the mobile disclosure when one of its links is clicked', async () => {
      await user.click(trigger);
      const panelLink = screen
        .getAllByRole('link', { name: MOCK_SIDEBAR_NAV_ITEMS.at(0)?.label })
        .at(-1)!;
      await user.click(panelLink);

      const panelList = screen.getAllByRole('list', { hidden: true }).at(-1);

      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(panelList).not.toBeVisible();
    });
  });

  describe('with location semantics', () => {
    beforeEach(() => {
      setup({ ariaCurrent: 'location' });
    });

    it('marks the active item with aria-current="location"', () => {
      const activeLink = screen.getByRole('link', { name: PRICING_LABEL });

      expect(activeLink).toHaveAttribute(ARIA_CURRENT, 'location');
    });
  });

  describe('without a matching active item', () => {
    beforeEach(() => {
      setup({ activeKey: undefined });
    });

    it('marks no item current', () => {
      screen.getAllByRole('link').forEach((link) => {
        expect(link).not.toHaveAttribute(ARIA_CURRENT);
      });
    });
  });
});
