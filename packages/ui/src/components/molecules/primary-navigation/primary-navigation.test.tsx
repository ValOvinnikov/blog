import { faker } from '@faker-js/faker';
import { HEADER_ACTION_PHONE_PLACEMENT } from '@shinefold/config';
import {
  customRender,
  screen,
  within,
} from '@shinefold/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@shinefold/ui/testing/mock-link';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PrimaryNavigation } from './primary-navigation';

const MOBILE_PANEL_TEST_ID = 'primary-navigation-mobile-panel';
const LINKS_TEST_ID = 'primary-navigation-links';
const PANEL_ACTIONS_TEST_ID = 'primary-navigation-panel-actions';
const DRAWER_ACTIONS_TEST_ID = 'primary-navigation-drawer-actions';

faker.seed(123);

const MOCK_ACTION_LABEL = faker.lorem.word();
const MOCK_PANEL_ACTION_LABEL = faker.lorem.word();
const MOCK_DRAWER_ACTION_LABEL = faker.lorem.word();
const MOCK_TOGGLE_LABEL = faker.lorem.words(2);
const MOCK_PANEL_ID = faker.string.uuid();
const MOCK_HEADER_ACTION = {
  href: `/${faker.lorem.slug()}`,
  label: faker.lorem.words(2),
};

const links = faker.helpers.multiple(
  () => ({
    href: `/${faker.lorem.slug()}`,
    label: faker.lorem.words(2),
  }),
  { count: 3 },
);

const mobileToggle = (isOpen: boolean, onToggle: () => void = () => {}) => ({
  isOpen,
  onToggle,
  ariaLabel: MOCK_TOGGLE_LABEL,
  panelId: MOCK_PANEL_ID,
});

const groupHref = `/${faker.lorem.slug()}`;
const groupLabel = faker.lorem.words(2);
const subLinks = faker.helpers.multiple(
  () => ({
    href: `${groupHref}/${faker.lorem.slug()}`,
    label: faker.lorem.words(2),
  }),
  { count: 2 },
);
const groupLink = {
  href: groupHref,
  label: groupLabel,
  subItems: [{ href: groupHref, label: groupLabel }, ...subLinks],
};

const panelActionsSlot = (
  <PrimaryNavigation.PanelActions key="panel-actions">
    <button type="button">{MOCK_PANEL_ACTION_LABEL}</button>
  </PrimaryNavigation.PanelActions>
);
const drawerActionsSlot = (
  <PrimaryNavigation.DrawerActions key="drawer-actions">
    <button type="button">{MOCK_DRAWER_ACTION_LABEL}</button>
  </PrimaryNavigation.DrawerActions>
);

const setup = customRender(PrimaryNavigation, {
  links,
});

describe(`<${PrimaryNavigation.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders all nav links', () => {
      for (const link of links) {
        const navLink = screen.getByRole('link', { name: link.label });

        expect(navLink).toBeVisible();
      }
    });

    it('renders as a nav landmark', () => {
      const nav = screen.getByRole('navigation');

      expect(nav).toBeVisible();
    });

    it('renders without actions', () => {
      const button = screen.queryByRole('button');

      expect(button).not.toBeInTheDocument();
    });

    it('renders no mobile panel', () => {
      const mobilePanel = screen.queryByTestId(MOBILE_PANEL_TEST_ID);

      expect(mobilePanel).not.toBeInTheDocument();
    });
  });

  it('renders the actions slot', () => {
    setup({
      children: (
        <PrimaryNavigation.Actions>
          <button>{MOCK_ACTION_LABEL}</button>
        </PrimaryNavigation.Actions>
      ),
    });

    const actionButton = screen.getByRole('button', {
      name: MOCK_ACTION_LABEL,
    });

    expect(actionButton).toBeVisible();
  });

  it('renders the panel actions in the bar when there is no mobile toggle', () => {
    setup({ children: panelActionsSlot });

    const panelActionButton = screen.getByRole('button', {
      name: MOCK_PANEL_ACTION_LABEL,
    });

    expect(panelActionButton).toBeVisible();
  });

  it('renders no drawer actions when there is no mobile toggle', () => {
    setup({ children: drawerActionsSlot });

    const drawerActionButton = screen.queryByRole('button', {
      name: MOCK_DRAWER_ACTION_LABEL,
    });

    expect(drawerActionButton).not.toBeInTheDocument();
  });

  it('opens a link in a new tab when it targets _blank', () => {
    const externalHref = faker.internet.url();
    const externalLabel = faker.lorem.words(2);

    setup({
      links: [
        ...links,
        { href: externalHref, label: externalLabel, target: '_blank' },
      ],
    });

    const externalLink = screen.getByRole('link', { name: externalLabel });

    expect(externalLink).toHaveAttribute('target', '_blank');
    for (const link of links) {
      const internalLink = screen.getByRole('link', { name: link.label });

      expect(internalLink).not.toHaveAttribute('target');
    }
  });

  it('renders each link through the supplied link component', () => {
    setup({ linkAs: MockLink });

    const mockLinks = screen.getAllByTestId(MOCK_LINK_TEST_ID);

    expect(mockLinks).toHaveLength(links.length);
  });

  describe('mobile toggle', () => {
    describe('while closed', () => {
      beforeEach(() => {
        setup({ mobileToggle: mobileToggle(false) });
      });

      it('renders the toggle button with its accessible label', () => {
        const toggle = screen.getByRole('button', { name: MOCK_TOGGLE_LABEL });

        expect(toggle).toBeVisible();
      });

      it('hides the panel', () => {
        const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

        expect(mobilePanel).not.toBeVisible();
      });
    });

    describe('while open', () => {
      beforeEach(() => {
        setup({ mobileToggle: mobileToggle(true) });
      });

      it('exposes the open state and links the toggle to its panel', () => {
        const toggle = screen.getByRole('button', { name: MOCK_TOGGLE_LABEL });
        const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(toggle).toHaveAttribute('aria-controls', MOCK_PANEL_ID);
        expect(mobilePanel).toHaveAttribute('id', MOCK_PANEL_ID);
      });

      it('shows every link in the panel', () => {
        const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

        expect(mobilePanel).toBeVisible();
        for (const link of links) {
          const panelLink = within(mobilePanel).getByRole('link', {
            name: link.label,
          });

          expect(panelLink).toBeVisible();
        }
      });
    });

    it('shows the panel actions as a row in the open panel', () => {
      setup({ children: panelActionsSlot, mobileToggle: mobileToggle(true) });

      const panelActions = screen.getByTestId(PANEL_ACTIONS_TEST_ID);
      const panelActionButton = within(panelActions).getByRole('button', {
        name: MOCK_PANEL_ACTION_LABEL,
      });

      expect(panelActionButton).toBeVisible();
    });

    it('leaves the panel actions out of the closed panel', () => {
      setup({ children: panelActionsSlot, mobileToggle: mobileToggle(false) });

      const panelActions = screen.queryByTestId(PANEL_ACTIONS_TEST_ID);

      expect(panelActions).not.toBeInTheDocument();
    });

    it('shows the drawer actions after the panel actions row in the open panel', () => {
      setup({
        children: [panelActionsSlot, drawerActionsSlot],
        mobileToggle: mobileToggle(true),
      });

      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      const panelActions = screen.getByTestId(PANEL_ACTIONS_TEST_ID);
      const drawerActionButton = within(drawerActions).getByRole('button', {
        name: MOCK_DRAWER_ACTION_LABEL,
      });

      expect(drawerActionButton).toBeVisible();
      expect(panelActions.compareDocumentPosition(drawerActions)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('leaves the drawer actions out of the closed panel and the bar', () => {
      setup({ children: drawerActionsSlot, mobileToggle: mobileToggle(false) });

      const drawerActionButton = screen.queryByRole('button', {
        name: MOCK_DRAWER_ACTION_LABEL,
      });

      expect(drawerActionButton).not.toBeInTheDocument();
    });

    it('calls onToggle when the toggle button is clicked', async () => {
      const onToggle = vi.fn();
      setup({ mobileToggle: mobileToggle(false, onToggle) });

      const toggle = screen.getByRole('button', { name: MOCK_TOGGLE_LABEL });
      await user.click(toggle);

      expect(onToggle).toHaveBeenCalledOnce();
    });
  });

  describe('header action', () => {
    it('renders the action as a link named by its label', () => {
      setup({ action: MOCK_HEADER_ACTION });

      const actionLink = screen.getByRole('link', {
        name: MOCK_HEADER_ACTION.label,
      });

      expect(actionLink).toHaveAttribute('href', MOCK_HEADER_ACTION.href);
    });

    it('shows a menu-placed action as the first item of the open panel', () => {
      setup({
        action: {
          ...MOCK_HEADER_ACTION,
          phonePlacement: HEADER_ACTION_PHONE_PLACEMENT.MENU,
        },
        mobileToggle: mobileToggle(true),
      });

      const [firstPanelLink] = within(
        screen.getByTestId(MOBILE_PANEL_TEST_ID),
      ).getAllByRole('link');

      expect(firstPanelLink).toHaveAccessibleName(MOCK_HEADER_ACTION.label);
    });

    it('keeps a bar-placed action out of the open panel', () => {
      setup({
        action: {
          ...MOCK_HEADER_ACTION,
          phonePlacement: HEADER_ACTION_PHONE_PLACEMENT.BAR,
        },
        mobileToggle: mobileToggle(true),
      });

      const panelActionLink = within(
        screen.getByTestId(MOBILE_PANEL_TEST_ID),
      ).queryByRole('link', { name: MOCK_HEADER_ACTION.label });

      expect(panelActionLink).not.toBeInTheDocument();
    });
  });

  describe('a link with sub-items', () => {
    it('sits behind a button named by the link, listing its own page first', () => {
      setup({ links: [groupLink] });

      const trigger = screen.getByRole('button', { name: groupLabel });
      const barLinksRegion = screen.getByTestId(LINKS_TEST_ID);
      const barLinks = within(barLinksRegion).getAllByRole('link', {
        hidden: true,
      });

      expect(trigger).toBeVisible();
      expect(barLinks.map((link) => link.getAttribute('href'))).toEqual([
        groupHref,
        ...subLinks.map((link) => link.href),
      ]);
    });

    it('keeps its sub-items folded in the open panel until opened', async () => {
      setup({ links: [groupLink], mobileToggle: mobileToggle(true) });

      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);
      const [firstSubLink] = subLinks;
      const subLink = within(mobilePanel).getByRole('link', {
        name: firstSubLink?.label,
      });
      const groupToggle = within(mobilePanel).getByText(groupLabel, {
        selector: 'summary',
      });

      expect(subLink).not.toBeVisible();

      await user.click(groupToggle);

      expect(subLink).toBeVisible();
    });
  });
});
