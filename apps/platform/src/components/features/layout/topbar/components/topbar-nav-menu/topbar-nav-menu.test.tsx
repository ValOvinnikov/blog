import { faker } from '@faker-js/faker';
import { AccountMenu } from '@platform/components/features/layout/account-menu';
import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import { TenantSwitcher } from '@platform/components/features/layout/tenant-switcher';
import messages from '@platform/i18n/messages/en.json';
import { usePathname } from '@platform/i18n/navigation';
import { ARIA_CURRENT, ARIA_DISABLED } from '@platform/testing/aria';
import {
  customRender,
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  mockAccount,
  mockNavBadge,
  mockNavInertItem,
  mockNavLinkItem,
  mockNavSection,
  mockNavStatus,
  mockTenantSwitcherItem,
} from '@platform/testing/layout/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { createRef } from 'react';

import { TopbarNavMenu } from './topbar-nav-menu';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/auth/sign-out-action');

faker.seed(5993);

const MOCK_LOOK_ITEM = mockNavLinkItem();
const MOCK_VOICE_ITEM = mockNavLinkItem();
const MOCK_BADGE = mockNavBadge();
const MOCK_BADGED_ITEM = mockNavLinkItem({ badge: MOCK_BADGE });
const MOCK_STATUS = mockNavStatus();
const MOCK_STATUS_ITEM = mockNavLinkItem({ status: MOCK_STATUS });
const MOCK_NOTE = faker.lorem.sentence();
const MOCK_SWITCHER_TEXT = faker.lorem.words(2);
const MOCK_ACCOUNT_TEXT = faker.lorem.words(2);
const MOCK_SECTION = mockNavSection({ items: [MOCK_LOOK_ITEM] });
const MOCK_ACCOUNT = mockAccount();
const MOCK_ACTIVE_TENANT = mockTenantSwitcherItem();
const MOCK_OTHER_TENANT = mockTenantSwitcherItem();

const ARROW_DOWN = '{ArrowDown}';
const ARROW_DOWN_TO_ACCOUNT = ARROW_DOWN.repeat(3);
const ENTER = '{Enter}';
const ESCAPE = '{Escape}';

const MOCK_BAR_REF = createRef<HTMLElement>();

const setup = customRender(TopbarNavMenu, {
  sections: [MOCK_SECTION],
  account: <div>{MOCK_ACCOUNT_TEXT}</div>,
  barRef: MOCK_BAR_REF,
});

const setupPinned = () =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={false}>
      <TopbarNavMenu
        sections={[MOCK_SECTION]}
        switcher={
          <TenantSwitcher
            tenants={[MOCK_ACTIVE_TENANT, MOCK_OTHER_TENANT]}
            activeTenantId={MOCK_ACTIVE_TENANT.id}
          />
        }
        account={<AccountMenu account={MOCK_ACCOUNT} />}
        barRef={MOCK_BAR_REF}
      />
    </SidebarCollapseProvider>,
  );

describe(`<${TopbarNavMenu.name}/>`, () => {
  let user: UserEvent;

  const openMenu = async () => {
    const trigger = screen.getByRole('button', {
      name: messages.topbarNavMenu.triggerLabel,
    });
    await user.click(trigger);
    return screen.findByRole('menu', {
      name: messages.topbarNavMenu.triggerLabel,
    });
  };

  const getMenuButton = () =>
    screen.getByRole('button', { name: messages.topbarNavMenu.triggerLabel });

  const getSwitcherTrigger = (menu: HTMLElement) =>
    within(menu).getByRole('menuitem', {
      name: new RegExp(MOCK_ACTIVE_TENANT.name),
    });

  const getAccountTrigger = (menu: HTMLElement) =>
    within(menu).getByRole('menuitem', {
      name: new RegExp(MOCK_ACCOUNT.name ?? ''),
    });

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(usePathname).mockReset();
  });

  it('opens the popup on click, showing items, badges and notes', async () => {
    setup({
      sections: [
        mockNavSection({ items: [MOCK_BADGED_ITEM] }),
        mockNavSection({ items: [], note: MOCK_NOTE }),
      ],
    });

    const menu = await openMenu();
    const link = within(menu).getByRole('menuitem', {
      name: `${MOCK_BADGED_ITEM.label}${MOCK_BADGE.label}`,
    });
    const badge = within(link).getByText(MOCK_BADGE.label);
    const note = within(menu).getByText(MOCK_NOTE);

    expect(link).toHaveAttribute('href', MOCK_BADGED_ITEM.href);
    expect(badge).toBeVisible();
    expect(note).toBeVisible();
  });

  it('names an item with a status by its label and line, with no native title', async () => {
    setup({ sections: [mockNavSection({ items: [MOCK_STATUS_ITEM] })] });

    const menu = await openMenu();
    const link = within(menu).getByRole('menuitem', {
      name: `${MOCK_STATUS_ITEM.label}${messages.navItemContent.statusSeparator} ${MOCK_STATUS.text}`,
    });

    expect(link).not.toHaveAttribute('title');
    expect(link).not.toHaveAccessibleDescription();
  });

  it('marks only the item matching the current pathname active', async () => {
    vi.mocked(usePathname).mockReturnValue(MOCK_LOOK_ITEM.href);
    setup({
      sections: [mockNavSection({ items: [MOCK_LOOK_ITEM, MOCK_VOICE_ITEM] })],
    });

    const menu = await openMenu();
    const activeItem = within(menu).getByRole('menuitem', {
      name: MOCK_LOOK_ITEM.label,
    });
    const inactiveItem = within(menu).getByRole('menuitem', {
      name: MOCK_VOICE_ITEM.label,
    });

    expect(activeItem).toHaveAttribute(ARIA_CURRENT, 'page');
    expect(inactiveItem).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('renders an item with no href as a disabled menu row with its badge', async () => {
    const inertItem = mockNavInertItem({ badge: MOCK_BADGE });
    setup({ sections: [mockNavSection({ items: [inertItem] })] });

    const menu = await openMenu();
    const inertRow = within(menu).getByRole('menuitem', {
      name: `${inertItem.label}${MOCK_BADGE.label}`,
    });
    const badge = within(inertRow).getByText(MOCK_BADGE.label);

    expect(inertRow).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(inertRow).not.toHaveAttribute('href');
    expect(badge).toBeVisible();
  });

  it('skips a disabled row when moving through the menu by keyboard', async () => {
    const inertItem = mockNavInertItem();
    setup({
      sections: [
        mockNavSection({ items: [MOCK_LOOK_ITEM, inertItem, MOCK_VOICE_ITEM] }),
      ],
    });

    const menu = await openMenu();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const voiceItem = within(menu).getByRole('menuitem', {
      name: MOCK_VOICE_ITEM.label,
    });

    expect(voiceItem).toHaveFocus();
  });

  it('renders the switcher slot above the nav sections when provided', async () => {
    setup({ switcher: <div>{MOCK_SWITCHER_TEXT}</div> });

    const menu = await openMenu();
    const switcher = within(menu).getByText(MOCK_SWITCHER_TEXT);

    expect(switcher).toBeVisible();
    expect(menu).toHaveTextContent(
      new RegExp(`${MOCK_SWITCHER_TEXT}.*${MOCK_SECTION.label}`),
    );
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a closed trigger', () => {
      const menu = screen.queryByRole('menu');

      expect(getMenuButton()).toBeVisible();
      expect(menu).not.toBeInTheDocument();
    });

    describe('once opened', () => {
      let menu: HTMLElement;

      beforeEach(async () => {
        menu = await openMenu();
      });

      it('closes the popup after clicking a link item', async () => {
        const link = within(menu).getByRole('menuitem', {
          name: MOCK_LOOK_ITEM.label,
        });
        await user.click(link);

        expect(menu).not.toBeInTheDocument();
      });

      it('renders no switcher slot', () => {
        const switcher = within(menu).queryByText(MOCK_SWITCHER_TEXT);

        expect(switcher).not.toBeInTheDocument();
      });

      it('renders the account in the foot, after the nav sections', () => {
        expect(menu).toHaveTextContent(
          new RegExp(`${MOCK_SECTION.label}.*${MOCK_ACCOUNT_TEXT}$`),
        );
      });

      it('titles a row by its label', () => {
        const link = within(menu).getByRole('menuitem', {
          name: MOCK_LOOK_ITEM.label,
        });

        expect(link).toHaveAttribute('title', MOCK_LOOK_ITEM.label);
      });
    });
  });

  describe('with the switcher and the account pinned', () => {
    let menu: HTMLElement;

    beforeEach(async () => {
      setupPinned();
      menu = await openMenu();
    });

    it('highlights the switcher first by arrow key', async () => {
      await user.keyboard(ARROW_DOWN);

      expect(getSwitcherTrigger(menu)).toHaveFocus();
    });

    it('reaches the account after the rows by arrow keys', async () => {
      await user.keyboard(ARROW_DOWN_TO_ACCOUNT);

      expect(getAccountTrigger(menu)).toHaveFocus();
    });

    it('closes both menus when a workspace is chosen', async () => {
      await user.click(getSwitcherTrigger(menu));
      const otherTenant = await screen.findByRole('menuitem', {
        name: new RegExp(MOCK_OTHER_TENANT.name),
      });
      await user.click(otherTenant);

      await waitFor(() => expect(menu).not.toBeInTheDocument());
      expect(otherTenant).not.toBeInTheDocument();
    });

    describe('with the account menu opened by Enter', () => {
      let accountMenu: HTMLElement;

      beforeEach(async () => {
        await user.keyboard(ARROW_DOWN_TO_ACCOUNT);
        await user.keyboard(ENTER);
        accountMenu = await screen.findByRole('menu', {
          name: messages.account.menuLabel,
        });
      });

      describe('after one Escape', () => {
        beforeEach(async () => {
          await user.keyboard(ESCAPE);
        });

        it('closes only the account menu, returning focus to its trigger', async () => {
          await waitFor(() => expect(accountMenu).not.toBeInTheDocument());
          expect(menu).toBeVisible();
          expect(getAccountTrigger(menu)).toHaveFocus();
        });

        it('closes the Menu onto its button on a second Escape', async () => {
          await user.keyboard(ESCAPE);

          await waitFor(() => expect(menu).not.toBeInTheDocument());
          expect(getMenuButton()).toHaveFocus();
        });
      });
    });
  });
});
