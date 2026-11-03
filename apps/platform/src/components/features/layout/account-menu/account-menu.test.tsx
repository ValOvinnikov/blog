import { COLOR_SCHEME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import { ACCOUNT_MENU_APPEARANCE } from '@platform/constants/account-menu';
import { DATA_THEME, THEME_PREFERENCE } from '@platform/constants/theme';
import messages from '@platform/i18n/messages/en.json';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { ARIA_EXPANDED, ARIA_HASPOPUP } from '@platform/testing/aria';
import {
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockAccount } from '@platform/testing/layout/fixtures';
import {
  DATA_THEME_ATTRIBUTE,
  resetThemePreference,
} from '@platform/testing/theme-preference';
import { THEME_PREFERENCE_COOKIE } from '@platform/utils/theme-preference-cookie/theme-preference-cookie';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { AccountMenu, type TAccountMenuProps } from './account-menu';

vi.mock('@platform/server/auth/sign-out-action');

faker.seed(6375);

const MOCK_FIRST_NAME = faker.person.firstName();
const MOCK_LAST_NAME = faker.person.lastName();
const MOCK_NAME = `${MOCK_FIRST_NAME} ${MOCK_LAST_NAME}`;
const MOCK_EMAIL = faker.internet.email();
const MOCK_ACCOUNT = mockAccount({ name: MOCK_NAME, email: MOCK_EMAIL });
const MOCK_INITIALS =
  `${MOCK_FIRST_NAME.charAt(0)}${MOCK_LAST_NAME.charAt(0)}`.toUpperCase();
const MOCK_EMAIL_ONLY = mockAccount({ name: undefined, email: MOCK_EMAIL });

const t = makeEnTranslator('account');
const MENU_ITEM_RADIO = 'menuitemradio';

const setup = (
  props: Partial<TAccountMenuProps> = {},
  isInitiallyCollapsed = false,
) =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={isInitiallyCollapsed}>
      <AccountMenu
        account={MOCK_ACCOUNT}
        appearance={ACCOUNT_MENU_APPEARANCE.SIDEBAR}
        {...props}
      />
    </SidebarCollapseProvider>,
  );

const openMenu = async (user: UserEvent, trigger: HTMLElement) => {
  await user.click(trigger);
  return screen.findByRole('menu', { name: messages.account.menuLabel });
};

const getThemeItem = (menu: HTMLElement, name: string) =>
  within(menu).getByRole(MENU_ITEM_RADIO, { name });

describe(`<${AccountMenu.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('in the expanded sidebar', () => {
    let trigger: HTMLElement;

    beforeEach(() => {
      setup();
      trigger = screen.getByRole('button', {
        name: new RegExp(MOCK_EMAIL),
      });
    });

    it('shows the initials, the name and the email on a menu button', () => {
      const initials = within(trigger).getByText(MOCK_INITIALS);
      const name = within(trigger).getByText(MOCK_NAME);
      const email = within(trigger).getByText(MOCK_EMAIL);

      expect(initials).toBeVisible();
      expect(name).toHaveAttribute('title', MOCK_NAME);
      expect(email).not.toHaveAttribute('title');
      expect(trigger).toHaveAttribute(ARIA_HASPOPUP, 'menu');
      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    describe('once opened', () => {
      let menu: HTMLElement;
      let signOutItem: HTMLElement;

      beforeEach(async () => {
        menu = await openMenu(user, trigger);
        signOutItem = within(menu).getByRole('menuitem', {
          name: messages.account.signOut,
        });
      });

      it('heads the menu with the name, the email and the role line', () => {
        const name = within(menu).getByText(MOCK_NAME);
        const email = within(menu).getByText(MOCK_EMAIL);
        const roleLine = within(menu).getByText(MOCK_ACCOUNT.roleLine);
        const items = within(menu).getAllByRole('menuitem');

        expect(name).toBeVisible();
        expect(email).toBeVisible();
        expect(roleLine).toBeVisible();
        expect(items).toEqual([signOutItem]);
        expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      });

      it('moves focus to Sign out', async () => {
        await waitFor(() => {
          expect(signOutItem).toHaveFocus();
        });
      });

      it('returns focus to the trigger on Escape', async () => {
        await user.keyboard('{Escape}');

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });

      it('signs out when Sign out is chosen', async () => {
        await user.click(signOutItem);

        expect(signOutAction).toHaveBeenCalledOnce();
      });
    });
  });

  describe('for an account with no name', () => {
    let trigger: HTMLElement;

    beforeEach(() => {
      setup({ account: MOCK_EMAIL_ONLY });
      trigger = screen.getByRole('button', {
        name: new RegExp(MOCK_EMAIL),
      });
    });

    it("puts the email on the name line once, behind the email's first letter", () => {
      const email = within(trigger).getByText(MOCK_EMAIL);
      const initial = within(trigger).getByText(
        MOCK_EMAIL.charAt(0).toUpperCase(),
      );

      expect(email).toHaveAttribute('title', MOCK_EMAIL);
      expect(initial).toBeVisible();
    });

    it('heads the menu with the email once, then the role line', async () => {
      const menu = await openMenu(user, trigger);

      const emails = within(menu).getAllByText(MOCK_EMAIL);
      const roleLine = within(menu).getByText(MOCK_EMAIL_ONLY.roleLine);

      expect(emails).toHaveLength(1);
      expect(roleLine).toBeVisible();
    });
  });

  describe('in the collapsed rail', () => {
    it('names the avatar-only trigger by the name and the email', () => {
      setup({}, true);

      const trigger = screen.getByRole('button', {
        name: t('triggerCollapsedLabel', {
          name: MOCK_NAME,
          email: MOCK_EMAIL,
        }),
      });
      const name = within(trigger).queryByText(MOCK_NAME);

      expect(trigger).toHaveAttribute('title', MOCK_NAME);
      expect(name).not.toBeInTheDocument();
    });

    it('names an email-only trigger by the email', () => {
      setup({ account: MOCK_EMAIL_ONLY }, true);

      const trigger = screen.getByRole('button', {
        name: t('triggerCollapsedLabelNoName', {
          email: MOCK_EMAIL,
        }),
      });

      expect(trigger).toHaveAttribute('title', MOCK_EMAIL);
    });
  });

  describe('as the phone pill', () => {
    it('is named by the role line and opens the same menu', async () => {
      setup({ appearance: ACCOUNT_MENU_APPEARANCE.PILL });

      const trigger = screen.getByRole('button', {
        name: MOCK_ACCOUNT.roleLine,
      });
      const menu = await openMenu(user, trigger);
      const signOutItem = within(menu).getByRole('menuitem', {
        name: messages.account.signOut,
      });

      expect(signOutItem).toBeVisible();
    });
  });

  describe('Theme section', () => {
    const openSidebarMenu = async (isInitiallyCollapsed = false) => {
      setup({}, isInitiallyCollapsed);
      const trigger = screen.getByRole('button', {
        name: new RegExp(MOCK_EMAIL),
      });
      return openMenu(user, trigger);
    };

    afterEach(resetThemePreference);

    it('labels the group Theme, describes it by the hint and checks System with no stored choice', async () => {
      const menu = await openSidebarMenu();

      const group = within(menu).getByRole('group', {
        name: messages.account.themeLabel,
      });
      const items = within(group).getAllByRole(MENU_ITEM_RADIO);
      const systemItem = getThemeItem(menu, messages.account.themeSystem);

      expect(group).toHaveAccessibleDescription(
        messages.account.themeSystemHint,
      );
      expect(items.map((item) => item.textContent)).toEqual([
        messages.account.themeLight,
        messages.account.themeDark,
        messages.account.themeSystem,
      ]);
      expect(systemItem).toBeChecked();
    });

    it('checks the stored choice', async () => {
      document.documentElement.dataset.theme = DATA_THEME[COLOR_SCHEME.LIGHT];

      const menu = await openSidebarMenu();
      const lightItem = getThemeItem(menu, messages.account.themeLight);

      expect(lightItem).toBeChecked();
    });

    it('applies and stores a chosen theme, moves the check and keeps the menu open', async () => {
      const menu = await openSidebarMenu();

      const darkItem = getThemeItem(menu, messages.account.themeDark);
      await user.click(darkItem);
      const systemItem = getThemeItem(menu, messages.account.themeSystem);

      expect(document.documentElement).toHaveAttribute(
        DATA_THEME_ATTRIBUTE,
        DATA_THEME[COLOR_SCHEME.DARK],
      );
      expect(document.cookie).toBe(
        `${THEME_PREFERENCE_COOKIE}=${THEME_PREFERENCE.DARK}`,
      );
      expect(darkItem).toBeChecked();
      expect(systemItem).not.toBeChecked();
      expect(menu).toBeVisible();
    });

    it('hands the theme back to the device setting when System is chosen', async () => {
      document.documentElement.dataset.theme = DATA_THEME[COLOR_SCHEME.DARK];
      const menu = await openSidebarMenu();

      const systemItem = getThemeItem(menu, messages.account.themeSystem);
      await user.click(systemItem);

      expect(document.documentElement).not.toHaveAttribute(
        DATA_THEME_ATTRIBUTE,
      );
      expect(document.cookie).toBe(
        `${THEME_PREFERENCE_COOKIE}=${THEME_PREFERENCE.SYSTEM}`,
      );
      expect(systemItem).toBeChecked();
    });

    it('is carried by the menu opened from the collapsed rail', async () => {
      const menu = await openSidebarMenu(true);

      const group = within(menu).getByRole('group', {
        name: messages.account.themeLabel,
      });

      expect(group).toBeVisible();
    });
  });
});
