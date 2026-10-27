import { ICONS } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
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
  roleChip: {
    name: faker.person.fullName(),
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

  it('renders the sidebar, topbar and page content together', () => {
    setup();

    const navLink = screen.getByRole('link', { name: MOCK_NAV_ITEM_LABEL });
    const sectionLabel = screen.getByText(MOCK_SECTION_LABEL);
    const crumb = screen.getByText(MOCK_CRUMB);
    const roleChipLabel = screen.getByText(
      makeEnTranslator('topbar')('roleChip', {
        role: messages.roleLabel.ADMIN,
        scope: MOCK_SCOPE,
      }),
    );
    const pageContent = screen.getByText(MOCK_PAGE_CONTENT);

    expect(navLink).toBeVisible();
    expect(sectionLabel).toBeVisible();
    expect(crumb).toBeVisible();
    expect(roleChipLabel).toBeVisible();
    expect(pageContent).toBeVisible();
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

    expect(expandToggle).toHaveAttribute('aria-expanded', 'false');
    expect(navLink).toBeVisible();
  });
});
