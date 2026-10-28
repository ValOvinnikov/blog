import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  type TMaybeNull,
} from '@blog/config';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AccountMenuGroup, AuthMenu } from '@web/components/shared/auth-menu';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { ThemeToggleButton } from '@web/components/shared/theme-toggle-button';
import { HeaderOverlayProvider } from '@web/context/header-overlay-provider';
import { MOCK_ACCOUNT_CONTROL } from '@web/testing/shared/account-control/fixtures';
import {
  MOCK_BLOG_LINK,
  MOCK_HOME_LINK,
  MOCK_TOPICS_LINK,
  MOCK_TOPICS_WITH_SUB_ITEMS,
} from '@web/testing/shared/link/fixtures';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { userEvent, within } from 'storybook/test';

import { SiteNavigation } from './site-navigation';

const links = [MOCK_HOME_LINK, MOCK_BLOG_LINK, MOCK_TOPICS_LINK];

const TOGGLE_MENU = { name: /Toggle navigation menu/ };
const ACCOUNT_BUTTON = { name: 'Account' };
const SIGN_IN_BUTTON = { name: 'Sign in' };
const DRAWER_ACTIONS_TEST_ID = 'primary-navigation-drawer-actions';
const ACCOUNT_TRIGGER_TEST_ID = 'account-menu-trigger';
const MOBILE_PANEL_TEST_ID = 'primary-navigation-mobile-panel';

type TCanvas = ReturnType<typeof within>;

const clickButton = async (
  canvas: TCanvas,
  button: { name: string | RegExp },
) => {
  const target = await canvas.findByRole('button', button);
  await userEvent.click(target);
};

const clickDrawerAccountRow = async (canvas: TCanvas) => {
  const drawerActions = await canvas.findByTestId(DRAWER_ACTIONS_TEST_ID);
  const accountRow = within(drawerActions).getByTestId(ACCOUNT_TRIGGER_TEST_ID);
  await userEvent.click(accountRow);
};

const openDrawerAccountRow = async (canvas: TCanvas) => {
  await clickButton(canvas, TOGGLE_MENU);
  await clickDrawerAccountRow(canvas);
};

const meta = {
  title: 'Components/SiteNavigation',
  component: SiteNavigation,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    layout: { control: 'select', options: objectKeys(HEADER_LAYOUT) },
    submenuStyle: {
      control: 'select',
      options: objectKeys(HEADER_SUBMENU_STYLE),
    },
    barStyle: { control: 'select', options: objectKeys(HEADER_BAR_STYLE) },
  },
  args: { links, actions: <ThemeToggleButton /> },
} satisfies Meta<typeof SiteNavigation>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Desktop: TStory = {
  globals: { viewport: 'desktop' },
};

/** The active-route highlighting `SiteNavigation` derives from the URL, not passed as a prop. */
export const ActiveBlogRoute: TStory = {
  globals: { viewport: 'desktop' },
  parameters: {
    nextjs: {
      navigation: { pathname: '/blog' },
    },
  },
};

export const WithSubMenus: TStory = {
  globals: { viewport: 'desktop' },
  args: { links: [MOCK_HOME_LINK, MOCK_TOPICS_WITH_SUB_ITEMS] },
};

export const WithWidePanelSubMenus: TStory = {
  globals: { viewport: 'desktop' },
  args: {
    links: [MOCK_HOME_LINK, MOCK_TOPICS_WITH_SUB_ITEMS],
    submenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
  },
};

export const MobileClosed: TStory = {
  globals: { viewport: 'mobile' },
};

export const MobileOpen: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickButton(canvas, TOGGLE_MENU);
  },
};

const { EN, NL, FR } = LOCALE_ISO_CODES;

const headerControls = {
  panelActions: (
    <>
      <LanguageSwitcher
        liveLocales={[EN, NL, FR]}
        currentLocale={NL}
        defaultLocale={EN}
        switcherStyle={LANGUAGE_SWITCHER_STYLE.MENU_CODE}
      />
      <ThemeToggleButton />
    </>
  ),
  actions: (
    <AuthMenu
      oauthProviderIds={['github']}
      accountControl={MOCK_ACCOUNT_CONTROL}
    />
  ),
};

const ACCOUNT_IN_MENU = {
  ...MOCK_ACCOUNT_CONTROL,
  panelStyle: ACCOUNT_PANEL_STYLE.HUB,
  phonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
};

const headerControlsWithAccountInMenu = {
  ...headerControls,
  drawerActions: (
    <AccountMenuGroup
      oauthProviderIds={['github']}
      panelStyle={ACCOUNT_IN_MENU.panelStyle}
    />
  ),
  actions: (
    <AuthMenu oauthProviderIds={['github']} accountControl={ACCOUNT_IN_MENU} />
  ),
};

const SESSION_EXPIRES = '2099-01-01';

const withSession = (
  session: TMaybeNull<Session>,
): NonNullable<TStory['decorators']> => [
  (Story) => (
    <SessionProvider session={session}>
      <HeaderOverlayProvider>
        <Story />
      </HeaderOverlayProvider>
    </SessionProvider>
  ),
];

const withSignedOutSession = withSession(null);

const withSignedInSession = withSession({
  user: { id: 'reader-1', name: 'Ada Lovelace', email: 'ada@example.com' },
  expires: SESSION_EXPIRES,
});

export const HeaderControls: TStory = {
  globals: { viewport: 'desktop' },
  decorators: withSignedOutSession,
  args: headerControls,
};

export const HeaderControlsSignedIn: TStory = {
  globals: { viewport: 'desktop' },
  decorators: withSignedInSession,
  args: headerControls,
};

export const MobileHeaderControlsSignedIn: TStory = {
  globals: { viewport: 'mobile' },
  decorators: withSignedInSession,
  args: headerControls,
};

export const AccountMenuLongEmail: TStory = {
  globals: { viewport: 'desktop' },
  decorators: withSession({
    user: {
      id: 'reader-2',
      name: 'Augusta Ada King, Countess of Lovelace',
      email: 'augusta.ada.king.countess.of.lovelace@analytical-engines.org',
    },
    expires: SESSION_EXPIRES,
  }),
  args: headerControls,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickButton(canvas, ACCOUNT_BUTTON);
  },
};

export const MobilePanelLanguageMenuOpen: TStory = {
  globals: { viewport: 'mobile' },
  decorators: withSignedOutSession,
  args: headerControls,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickButton(canvas, TOGGLE_MENU);
    await clickButton(canvas, { name: 'Language: Nederlands' });
  },
};

export const MobilePanelCompactCodes: TStory = {
  globals: { viewport: 'mobile' },
  decorators: withSignedOutSession,
  args: {
    ...headerControls,
    panelActions: (
      <>
        <LanguageSwitcher
          liveLocales={[EN, NL, FR]}
          currentLocale={NL}
          defaultLocale={EN}
          switcherStyle={LANGUAGE_SWITCHER_STYLE.CODES}
        />
        <ThemeToggleButton />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickButton(canvas, TOGGLE_MENU);
  },
};

export const MobileSignInSheetOpen: TStory = {
  globals: { viewport: 'mobile' },
  decorators: withSignedOutSession,
  args: headerControls,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickButton(canvas, SIGN_IN_BUTTON);
  },
};

export const HubPanelFromCircle: TStory = {
  globals: { viewport: 'desktop' },
  decorators: withSignedInSession,
  args: {
    ...headerControls,
    actions: (
      <AuthMenu
        oauthProviderIds={['github']}
        accountControl={{
          ...MOCK_ACCOUNT_CONTROL,
          buttonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
          panelStyle: ACCOUNT_PANEL_STYLE.HUB,
        }}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickButton(canvas, ACCOUNT_BUTTON);
  },
};

export const MobileAccountInMenu: TStory = {
  globals: { viewport: 'mobile' },
  decorators: withSignedInSession,
  args: headerControlsWithAccountInMenu,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await openDrawerAccountRow(canvas);
  },
};

export const MobileSignInInMenu: TStory = {
  globals: { viewport: 'mobile' },
  decorators: withSignedOutSession,
  args: headerControlsWithAccountInMenu,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await openDrawerAccountRow(canvas);
  },
};

export const MobileAccountFoldsSubMenu: TStory = {
  globals: { viewport: 'mobile' },
  decorators: withSignedOutSession,
  args: {
    ...headerControlsWithAccountInMenu,
    links: [MOCK_HOME_LINK, MOCK_TOPICS_WITH_SUB_ITEMS],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickButton(canvas, TOGGLE_MENU);
    const mobilePanel = await canvas.findByTestId(MOBILE_PANEL_TEST_ID);
    const subMenuRow = within(mobilePanel).getByText(
      MOCK_TOPICS_WITH_SUB_ITEMS.label,
    );
    await userEvent.click(subMenuRow);
    await clickDrawerAccountRow(canvas);
  },
};
