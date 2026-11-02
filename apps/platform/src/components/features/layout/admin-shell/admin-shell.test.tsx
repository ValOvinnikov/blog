import { ICONS } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_EXPANDED, ARIA_HASPOPUP } from '@platform/testing/aria';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { AdminShell } from './admin-shell';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/auth/sign-out-action');

faker.seed(2401);

const MOCK_SECTION_LABEL = faker.lorem.words(2);
const MOCK_NAV_ITEM_LABEL = faker.lorem.word();
const MOCK_CRUMB = faker.lorem.words(3);
const MOCK_SCOPE = faker.company.name();
const MOCK_PAGE_CONTENT = faker.lorem.sentence();
const MOCK_SWITCHER = faker.lorem.words(2);
const MOCK_NAME = faker.person.fullName();
const MOCK_EMAIL = faker.internet.email();
const MOCK_ROLE_LINE = makeEnTranslator('account')('roleLine', {
  role: messages.roleLabel.ADMIN,
  scope: MOCK_SCOPE,
});

const setup = customRender(AdminShell, {
  sections: [
    {
      label: MOCK_SECTION_LABEL,
      items: [
        {
          label: MOCK_NAV_ITEM_LABEL,
          icon: ICONS.GRID,
          href: adminRoutes.tenants(),
        },
      ],
    },
  ],
  crumb: <p>{MOCK_CRUMB}</p>,
  account: {
    name: MOCK_NAME,
    email: MOCK_EMAIL,
    role: ADMIN_ROLE.ADMIN,
    scope: MOCK_SCOPE,
  },
  children: <p>{MOCK_PAGE_CONTENT}</p>,
});

describe(`<${AdminShell.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the sidebar, topbar and page content together', () => {
      const navLink = screen.getByRole('link', { name: MOCK_NAV_ITEM_LABEL });
      const sectionLabel = screen.getByText(MOCK_SECTION_LABEL);
      const crumb = screen.getByText(MOCK_CRUMB);
      const pageContent = screen.getByText(MOCK_PAGE_CONTENT);

      expect(navLink).toBeVisible();
      expect(sectionLabel).toBeVisible();
      expect(crumb).toBeVisible();
      expect(pageContent).toBeVisible();
    });

    it('puts the account in the sidebar foot, with the role line in its menu', async () => {
      const sidebar = screen.getByRole('complementary', {
        name: messages.sidebar.ariaLabel,
      });
      const trigger = within(sidebar).getByRole('button', {
        name: new RegExp(MOCK_EMAIL),
      });
      await user.click(trigger);

      const menu = await screen.findByRole('menu', {
        name: messages.account.menuLabel,
      });
      const name = within(trigger).getByText(MOCK_NAME);
      const roleLine = within(menu).getByText(MOCK_ROLE_LINE);

      expect(name).toBeVisible();
      expect(roleLine).toBeVisible();
    });

    it('keeps the phone pill in the top bar, named by the role line', () => {
      const banner = screen.getByRole('banner');
      const pill = within(banner).getByRole('button', { name: MOCK_ROLE_LINE });

      expect(pill).toHaveAttribute(ARIA_HASPOPUP, 'menu');
    });
  });

  it('lists the nav items and the switcher in the topbar menu', async () => {
    setup({ switcher: <div>{MOCK_SWITCHER}</div> });

    const menuTrigger = screen.getByRole('button', {
      name: messages.topbarNavMenu.triggerLabel,
    });
    await user.click(menuTrigger);

    const menu = await screen.findByRole('menu');
    const menuNavItem = within(menu).getByRole('menuitem', {
      name: MOCK_NAV_ITEM_LABEL,
    });
    const menuSwitcher = within(menu).getByText(MOCK_SWITCHER);

    expect(menuNavItem).toBeVisible();
    expect(menuSwitcher).toBeVisible();
  });

  it('can open with the sidebar collapsed', () => {
    setup({ isSidebarInitiallyCollapsed: true });

    const expandToggle = screen.getByRole('button', {
      name: messages.sidebar.expandToggle,
    });
    const navLink = screen.getByRole('link', { name: MOCK_NAV_ITEM_LABEL });

    expect(expandToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(navLink).toBeVisible();
  });
});
