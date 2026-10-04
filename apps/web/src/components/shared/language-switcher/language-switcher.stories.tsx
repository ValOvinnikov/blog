import { LANGUAGE_SWITCHER_STYLE, LOCALE_ISO_CODES } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, within } from 'storybook/test';

import { LanguageSwitcher } from './language-switcher';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const meta = {
  title: 'Components/LanguageSwitcher',
  component: LanguageSwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    nextjs: { navigation: { pathname: '/blog' } },
  },
  args: {
    liveLocales: [EN, NL, FR],
    currentLocale: EN,
    defaultLocale: EN,
    switcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
  },
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const HeaderMenuCode: TStory = {};

export const HeaderMenuCodeOpen: TStory = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Language: English' }),
    );
  },
};

export const HeaderMenuGlobe: TStory = {
  args: { switcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE },
};

export const HeaderCodes: TStory = {
  args: { switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES, currentLocale: NL },
};

export const FooterMenuCode: TStory = {
  parameters: { layout: 'centered' },
  args: { isInFooter: true },
};

export const FooterMenuGlobe: TStory = {
  parameters: { layout: 'centered' },
  args: { isInFooter: true, switcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE },
};

export const FooterCodes: TStory = {
  args: { isInFooter: true, switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES },
};

export const PhonePill: TStory = {
  globals: { viewport: 'mobile' },
  args: { switcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE },
};
