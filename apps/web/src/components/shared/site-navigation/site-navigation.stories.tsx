import {
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  type ILink,
  type TMaybeNull,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AccountRow, AuthMenu } from '@web/components/shared/auth-menu';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { ThemeToggleButton } from '@web/components/shared/theme-toggle-button';
import { HeaderOverlayProvider } from '@web/context/header-overlay-provider';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { userEvent, within } from 'storybook/test';

import { SiteNavigation } from './site-navigation';

const links: ILink[] = [
  {
    label: 'Home',
    href: '/',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  {
    label: 'Blog',
    href: '/blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  {
    label: 'Topics',
    href: '/topics',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
];

const meta = {
  title: 'Components/SiteNavigation',
  component: SiteNavigation,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
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

export const MobileClosed: TStory = {
  globals: { viewport: 'mobile' },
};

export const MobileOpen: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /Toggle navigation menu/ }),
    );
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
  drawerActions: <AccountRow />,
  actions: <AuthMenu oauthProviderIds={['github']} />,
};

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
  expires: '2099-01-01',
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
    expires: '2099-01-01',
  }),
  args: headerControls,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Account menu' }),
    );
  },
};

export const MobilePanelLanguageMenuOpen: TStory = {
  globals: { viewport: 'mobile' },
  decorators: withSignedOutSession,
  args: headerControls,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /Toggle navigation menu/ }),
    );
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Language: Nederlands' }),
    );
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
    await userEvent.click(
      canvas.getByRole('button', { name: /Toggle navigation menu/ }),
    );
  },
};

export const MobileSignInSheetOpen: TStory = {
  globals: { viewport: 'mobile' },
  decorators: withSignedOutSession,
  args: headerControls,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /Toggle navigation menu/ }),
    );
    const drawerActions = await canvas.findByTestId(
      'primary-navigation-drawer-actions',
    );
    await userEvent.click(
      within(drawerActions).getByRole('button', { name: 'Sign in' }),
    );
  },
};
