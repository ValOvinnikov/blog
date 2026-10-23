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
        expect(screen.getByRole('link', { name: link.label })).toBeVisible();
      }
    });

    it('renders as a nav landmark', () => {
      expect(screen.getByRole('navigation')).toBeVisible();
    });

    it('renders without actions when omitted', () => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders no mobile panel when mobileToggle is omitted', () => {
      expect(
        screen.queryByTestId(MOBILE_PANEL_TEST_ID),
      ).not.toBeInTheDocument();
    });
  });

  it('renders the actions slot when provided', () => {
    setup({ actions: <button>Toggle</button> });
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeVisible();
  });

  it('renders panelActions in the bar when there is no mobile toggle', () => {
    setup({ panelActions: <button type="button">Language</button> });
    expect(screen.getByRole('button', { name: 'Language' })).toBeVisible();
  });

  it('renders no drawerActions when there is no mobile toggle', () => {
    setup({ drawerActions: <button type="button">Sign in</button> });
    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
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

    expect(screen.getByRole('link', { name: externalLabel })).toHaveAttribute(
      'target',
      '_blank',
    );
    for (const link of links) {
      expect(
        screen.getByRole('link', { name: link.label }),
      ).not.toHaveAttribute('target');
    }
  });

  it('renders each link via linkAs when provided', () => {
    setup({ linkAs: MockLink });
    expect(screen.getAllByTestId(MOCK_LINK_TEST_ID)).toHaveLength(links.length);
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

      expect(screen.getByRole('button', { name: ariaLabel })).toBeVisible();
    });

    it('reflects isOpen as aria-expanded and links the toggle to its panel', () => {
      setup({
        mobileToggle: mobileToggle(true),
      });

      const toggle = screen.getByRole('button', { name: ariaLabel });
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(toggle).toHaveAttribute('aria-controls', panelId);
      expect(screen.getByTestId(MOBILE_PANEL_TEST_ID)).toHaveAttribute(
        'id',
        panelId,
      );
    });

    it('hides the panel when isOpen is false and shows it when isOpen is true', () => {
      const { rerender } = setup({
        mobileToggle: mobileToggle(false),
      });

      expect(screen.getByTestId(MOBILE_PANEL_TEST_ID)).not.toBeVisible();

      rerender(
        <PrimaryNavigation links={links} mobileToggle={mobileToggle(true)} />,
      );

      const panel = screen.getByTestId(MOBILE_PANEL_TEST_ID);
      expect(panel).toBeVisible();
      for (const link of links) {
        expect(
          within(panel).getByRole('link', { name: link.label }),
        ).toBeVisible();
      }
    });

    it('shows panelActions as a row in the open panel', () => {
      setup({
        panelActions: <button type="button">Language</button>,
        mobileToggle: mobileToggle(true),
      });

      expect(
        within(screen.getByTestId(PANEL_ACTIONS_TEST_ID)).getByRole('button', {
          name: 'Language',
        }),
      ).toBeVisible();
    });

    it('leaves panelActions out of the closed panel', () => {
      setup({
        panelActions: <button type="button">Language</button>,
        mobileToggle: mobileToggle(false),
      });

      expect(
        screen.queryByTestId(PANEL_ACTIONS_TEST_ID),
      ).not.toBeInTheDocument();
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
      expect(
        within(drawerActions).getByRole('button', { name: 'Sign in' }),
      ).toBeVisible();
      expect(
        screen
          .getByTestId(PANEL_ACTIONS_TEST_ID)
          .compareDocumentPosition(drawerActions) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('leaves drawerActions out of the closed panel and the bar', () => {
      setup({
        drawerActions: <button type="button">Sign in</button>,
        mobileToggle: mobileToggle(false),
      });

      expect(
        screen.queryByRole('button', { name: 'Sign in' }),
      ).not.toBeInTheDocument();
    });

    it('calls onToggle when the toggle button is clicked', async () => {
      const onToggle = vi.fn();
      setup({
        mobileToggle: mobileToggle(false, onToggle),
      });

      await userEvent.click(screen.getByRole('button', { name: ariaLabel }));
      expect(onToggle).toHaveBeenCalledOnce();
    });
  });
});
