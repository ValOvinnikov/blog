import { faker } from '@faker-js/faker';
import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_HASPOPUP } from '@platform/testing/aria';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import {
  mockAccount,
  mockNavLinkItem,
  mockNavSection,
} from '@platform/testing/layout/fixtures';
import userEvent from '@testing-library/user-event';

import { Topbar, type TTopbarProps } from './topbar';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/auth/sign-out-action');

faker.seed(5993);

const MOCK_CRUMB_TEXT = faker.lorem.words(2);
const MOCK_SWITCHER_TEXT = faker.lorem.words(2);
const MOCK_NAV_ITEM = mockNavLinkItem();
const MOCK_ACCOUNT = mockAccount();

const setup = (overrides: Partial<TTopbarProps> = {}) =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={false}>
      <Topbar
        crumb={<p>{MOCK_CRUMB_TEXT}</p>}
        account={MOCK_ACCOUNT}
        sections={[mockNavSection({ items: [MOCK_NAV_ITEM] })]}
        {...overrides}
      />
    </SidebarCollapseProvider>,
  );

describe(`<${Topbar.name}/>`, () => {
  describe('with the default props', () => {
    let banner: HTMLElement;

    beforeEach(() => {
      setup();
      banner = screen.getByRole('banner');
    });

    it('holds only the collapse toggle, the Menu button and the crumb', () => {
      const crumb = within(banner).getByText(MOCK_CRUMB_TEXT);
      const buttons = within(banner).getAllByRole('button');
      const menuButton = within(banner).getByRole('button', {
        name: messages.topbarNavMenu.triggerLabel,
      });

      expect(crumb).toBeVisible();
      expect(buttons).toHaveLength(2);
      expect(menuButton).toHaveAttribute(ARIA_HASPOPUP, 'menu');
    });

    it('leads with the collapse toggle, before the crumb', () => {
      const toggle = screen.getByRole('button', {
        name: messages.sidebar.collapseToggle,
      });
      const [firstButton] = within(banner).getAllByRole('button');

      expect(firstButton).toBe(toggle);
      expect(banner).toHaveTextContent(new RegExp(`^${MOCK_CRUMB_TEXT}`));
    });
  });

  describe('with the nav menu opened', () => {
    let menu: HTMLElement;

    beforeEach(async () => {
      const user = userEvent.setup();
      setup({ switcher: <div>{MOCK_SWITCHER_TEXT}</div> });

      const trigger = screen.getByRole('button', {
        name: messages.topbarNavMenu.triggerLabel,
      });
      await user.click(trigger);
      menu = await screen.findByRole('menu', {
        name: messages.topbarNavMenu.triggerLabel,
      });
    });

    it('shows the passed sections', () => {
      const item = within(menu).getByRole('menuitem', {
        name: MOCK_NAV_ITEM.label,
      });

      expect(item).toBeVisible();
    });

    it('shows the switcher slot', () => {
      const switcher = within(menu).getByText(MOCK_SWITCHER_TEXT);

      expect(switcher).toBeVisible();
    });

    it('shows the account in the foot', () => {
      const account = within(menu).getByRole('menuitem', {
        name: new RegExp(MOCK_ACCOUNT.email ?? ''),
      });

      expect(account).toBeVisible();
    });
  });
});
