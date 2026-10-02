import { LOCALE_ISO_CODES } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

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
  args: { liveLocales: [EN, NL, FR], currentLocale: EN, defaultLocale: EN },
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const DefaultLanguage: TStory = {};

export const OtherLanguage: TStory = {
  args: { currentLocale: NL },
};
