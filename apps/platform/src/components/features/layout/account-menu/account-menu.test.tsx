import { faker } from '@faker-js/faker';
import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import { ACCOUNT_MENU_APPEARANCE } from '@platform/constants/account-menu';
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
});
