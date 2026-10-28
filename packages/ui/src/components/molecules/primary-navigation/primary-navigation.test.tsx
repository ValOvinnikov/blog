import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PrimaryNavigation } from './primary-navigation';

const { Actions, PanelActions, DrawerActions } = PrimaryNavigation;

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
        <Actions>
          <button>{MOCK_ACTION_LABEL}</button>
        </Actions>
      ),
    });

    const actionButton = screen.getByRole('button', {
      name: MOCK_ACTION_LABEL,
    });

    expect(actionButton).toBeVisible();
  });

  it('renders the panel actions in the bar when there is no mobile toggle', () => {
    setup({
      children: (
        <PanelActions>
          <button type="button">{MOCK_PANEL_ACTION_LABEL}</button>
        </PanelActions>
      ),
    });

    const panelActionButton = screen.getByRole('button', {
      name: MOCK_PANEL_ACTION_LABEL,
    });

    expect(panelActionButton).toBeVisible();
  });

  it('renders no drawer actions when there is no mobile toggle', () => {
    setup({
      children: (
        <DrawerActions>
          <button type="button">{MOCK_DRAWER_ACTION_LABEL}</button>
        </DrawerActions>
      ),
    });

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
    it('renders the toggle button with its accessible label', () => {
      setup({ mobileToggle: mobileToggle(false) });

      const toggle = screen.getByRole('button', { name: MOCK_TOGGLE_LABEL });

      expect(toggle).toBeVisible();
    });

    it('exposes the open state and links the toggle to its panel', () => {
      setup({ mobileToggle: mobileToggle(true) });

      const toggle = screen.getByRole('button', { name: MOCK_TOGGLE_LABEL });
      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(toggle).toHaveAttribute('aria-controls', MOCK_PANEL_ID);
      expect(mobilePanel).toHaveAttribute('id', MOCK_PANEL_ID);
    });

    it('hides the panel while closed', () => {
      setup({ mobileToggle: mobileToggle(false) });

      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

      expect(mobilePanel).not.toBeVisible();
    });

    it('shows every link in the panel while open', () => {
      setup({ mobileToggle: mobileToggle(true) });

      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

      expect(mobilePanel).toBeVisible();
      for (const link of links) {
        const panelLink = within(mobilePanel).getByRole('link', {
          name: link.label,
        });

        expect(panelLink).toBeVisible();
      }
    });

    it('shows the panel actions as a row in the open panel', () => {
      setup({
        children: (
          <PanelActions>
            <button type="button">{MOCK_PANEL_ACTION_LABEL}</button>
          </PanelActions>
        ),
        mobileToggle: mobileToggle(true),
      });

      const panelActions = screen.getByTestId(PANEL_ACTIONS_TEST_ID);
      const panelActionButton = within(panelActions).getByRole('button', {
        name: MOCK_PANEL_ACTION_LABEL,
      });

      expect(panelActionButton).toBeVisible();
    });

    it('leaves the panel actions out of the closed panel', () => {
      setup({
        children: (
          <PanelActions>
            <button type="button">{MOCK_PANEL_ACTION_LABEL}</button>
          </PanelActions>
        ),
        mobileToggle: mobileToggle(false),
      });

      const panelActions = screen.queryByTestId(PANEL_ACTIONS_TEST_ID);

      expect(panelActions).not.toBeInTheDocument();
    });

    it('shows the drawer actions after the panel actions row in the open panel', () => {
      setup({
        children: (
          <>
            <PanelActions>
              <button type="button">{MOCK_PANEL_ACTION_LABEL}</button>
            </PanelActions>
            <DrawerActions>
              <button type="button">{MOCK_DRAWER_ACTION_LABEL}</button>
            </DrawerActions>
          </>
        ),
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
      setup({
        children: (
          <DrawerActions>
            <button type="button">{MOCK_DRAWER_ACTION_LABEL}</button>
          </DrawerActions>
        ),
        mobileToggle: mobileToggle(false),
      });

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

    it('names every phone panel group with the supplied group name', () => {
      const groupName = faker.lorem.slug();
      const accountLabel = faker.lorem.words(2);
      setup({
        links: [groupLink],
        panelGroupName: groupName,
        mobileToggle: mobileToggle(true),
        children: (
          <DrawerActions>
            <details name={groupName}>
              <summary>{accountLabel}</summary>
            </details>
          </DrawerActions>
        ),
      });

      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);
      const groups = within(mobilePanel).getAllByRole('group');

      expect(groups).toHaveLength(2);
      for (const group of groups) {
        expect(group).toHaveAttribute('name', groupName);
      }
    });
  });
});
