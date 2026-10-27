import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PrimaryNavigation } from './primary-navigation';

const MOBILE_PANEL_TEST_ID = 'primary-navigation-mobile-panel';
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
    setup({ actions: <button>{MOCK_ACTION_LABEL}</button> });

    const actionButton = screen.getByRole('button', {
      name: MOCK_ACTION_LABEL,
    });

    expect(actionButton).toBeVisible();
  });

  it('renders panelActions in the bar when there is no mobile toggle', () => {
    setup({
      panelActions: <button type="button">{MOCK_PANEL_ACTION_LABEL}</button>,
    });

    const panelActionButton = screen.getByRole('button', {
      name: MOCK_PANEL_ACTION_LABEL,
    });

    expect(panelActionButton).toBeVisible();
  });

  it('renders no drawerActions when there is no mobile toggle', () => {
    setup({
      drawerActions: <button type="button">{MOCK_DRAWER_ACTION_LABEL}</button>,
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

    it('shows panelActions as a row in the open panel', () => {
      setup({
        panelActions: <button type="button">{MOCK_PANEL_ACTION_LABEL}</button>,
        mobileToggle: mobileToggle(true),
      });

      const panelActions = screen.getByTestId(PANEL_ACTIONS_TEST_ID);
      const panelActionButton = within(panelActions).getByRole('button', {
        name: MOCK_PANEL_ACTION_LABEL,
      });

      expect(panelActionButton).toBeVisible();
    });

    it('leaves panelActions out of the closed panel', () => {
      setup({
        panelActions: <button type="button">{MOCK_PANEL_ACTION_LABEL}</button>,
        mobileToggle: mobileToggle(false),
      });

      const panelActions = screen.queryByTestId(PANEL_ACTIONS_TEST_ID);

      expect(panelActions).not.toBeInTheDocument();
    });

    it('shows drawerActions after the panelActions row in the open panel', () => {
      setup({
        panelActions: <button type="button">{MOCK_PANEL_ACTION_LABEL}</button>,
        drawerActions: (
          <button type="button">{MOCK_DRAWER_ACTION_LABEL}</button>
        ),
        mobileToggle: mobileToggle(true),
      });

      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      const panelActions = screen.getByTestId(PANEL_ACTIONS_TEST_ID);
      const drawerActionButton = within(drawerActions).getByRole('button', {
        name: MOCK_DRAWER_ACTION_LABEL,
      });
      const position = panelActions.compareDocumentPosition(drawerActions);

      expect(drawerActionButton).toBeVisible();
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('leaves drawerActions out of the closed panel and the bar', () => {
      setup({
        drawerActions: (
          <button type="button">{MOCK_DRAWER_ACTION_LABEL}</button>
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
});
