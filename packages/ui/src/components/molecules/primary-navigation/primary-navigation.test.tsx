import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { PrimaryNavigation } from './primary-navigation';

const MOBILE_PANEL_TEST_ID = 'primary-navigation-mobile-panel';
const PANEL_ACTIONS_TEST_ID = 'primary-navigation-panel-actions';

faker.seed(123);

const links = faker.helpers.multiple(
  () => ({
    href: `/${faker.lorem.slug()}`,
    label: faker.lorem.words(2),
  }),
  { count: 3 },
);

const setup = customRender(PrimaryNavigation, {
  links,
});

describe(`<${PrimaryNavigation.name}/>`, () => {
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

    it('renders without actions when omitted', () => {
      const button = screen.queryByRole('button');

      expect(button).not.toBeInTheDocument();
    });

    it('renders no mobile panel when mobileToggle is omitted', () => {
      const mobilePanel = screen.queryByTestId(MOBILE_PANEL_TEST_ID);

      expect(mobilePanel).not.toBeInTheDocument();
    });
  });

  it('renders the actions slot when provided', () => {
    setup({ actions: <button>Toggle</button> });
    const actionButton = screen.getByRole('button', { name: 'Toggle' });

    expect(actionButton).toBeVisible();
  });

  it('renders panelActions in the bar when there is no mobile toggle', () => {
    setup({ panelActions: <button type="button">Language</button> });
    const languageButton = screen.getByRole('button', { name: 'Language' });

    expect(languageButton).toBeVisible();
  });

  it('renders no drawerActions when there is no mobile toggle', () => {
    setup({ drawerActions: <button type="button">Sign in</button> });
    const signInButton = screen.queryByRole('button', { name: 'Sign in' });

    expect(signInButton).not.toBeInTheDocument();
  });

  it('forwards target to the anchor when provided on a link', () => {
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

  it('renders each link via linkAs when provided', () => {
    setup({ linkAs: MockLink });
    const mockLinks = screen.getAllByTestId(MOCK_LINK_TEST_ID);

    expect(mockLinks).toHaveLength(links.length);
  });

  describe('mobileToggle', () => {
    const ariaLabel = 'Toggle navigation menu';
    const panelId = 'primary-navigation-panel';
    const mobileToggle = (
      isOpen: boolean,
      onToggle: () => void = () => {},
    ) => ({ isOpen, onToggle, ariaLabel, panelId });

    it('renders the toggle button with the given ariaLabel', () => {
      setup({
        mobileToggle: mobileToggle(false),
      });

      const toggle = screen.getByRole('button', { name: ariaLabel });

      expect(toggle).toBeVisible();
    });

    it('reflects isOpen as aria-expanded and links the toggle to its panel', () => {
      setup({
        mobileToggle: mobileToggle(true),
      });

      const toggle = screen.getByRole('button', { name: ariaLabel });
      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(toggle).toHaveAttribute('aria-controls', panelId);
      expect(mobilePanel).toHaveAttribute('id', panelId);
    });

    it('hides the panel when isOpen is false and shows it when isOpen is true', () => {
      const { rerender } = setup({
        mobileToggle: mobileToggle(false),
      });

      const closedPanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

      expect(closedPanel).not.toBeVisible();

      rerender(
        <PrimaryNavigation links={links} mobileToggle={mobileToggle(true)} />,
      );

      const panel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

      expect(panel).toBeVisible();
      for (const link of links) {
        const panelLink = within(panel).getByRole('link', { name: link.label });

        expect(panelLink).toBeVisible();
      }
    });

    it('shows panelActions as a row in the open panel', () => {
      setup({
        panelActions: <button type="button">Language</button>,
        mobileToggle: mobileToggle(true),
      });

      const panelActions = screen.getByTestId(PANEL_ACTIONS_TEST_ID);
      const languageButton = within(panelActions).getByRole('button', {
        name: 'Language',
      });

      expect(languageButton).toBeVisible();
    });

    it('leaves panelActions out of the closed panel', () => {
      setup({
        panelActions: <button type="button">Language</button>,
        mobileToggle: mobileToggle(false),
      });

      const panelActions = screen.queryByTestId(PANEL_ACTIONS_TEST_ID);

      expect(panelActions).not.toBeInTheDocument();
    });

    it('shows drawerActions after the panelActions row in the open panel', () => {
      setup({
        panelActions: <button type="button">Language</button>,
        drawerActions: <button type="button">Sign in</button>,
        mobileToggle: mobileToggle(true),
      });

      const drawerActions = screen.getByTestId(
        'primary-navigation-drawer-actions',
      );
      const panelActions = screen.getByTestId(PANEL_ACTIONS_TEST_ID);
      const signInButton = within(drawerActions).getByRole('button', {
        name: 'Sign in',
      });
      const position = panelActions.compareDocumentPosition(drawerActions);

      expect(signInButton).toBeVisible();
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('leaves drawerActions out of the closed panel and the bar', () => {
      setup({
        drawerActions: <button type="button">Sign in</button>,
        mobileToggle: mobileToggle(false),
      });

      const signInButton = screen.queryByRole('button', { name: 'Sign in' });

      expect(signInButton).not.toBeInTheDocument();
    });

    it('calls onToggle when the toggle button is clicked', async () => {
      const onToggle = vi.fn();
      setup({
        mobileToggle: mobileToggle(false, onToggle),
      });

      const toggle = screen.getByRole('button', { name: ariaLabel });
      await userEvent.click(toggle);

      expect(onToggle).toHaveBeenCalledOnce();
    });
  });
});
