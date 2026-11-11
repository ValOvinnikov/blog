import { LOCALE_ISO_CODES, routes } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PreviewBanner } from './preview-banner';

const meta = {
  title: 'Components/PreviewBanner',
  component: PreviewBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: routes.blogIndex() } },
  },
  args: {
    locale: LOCALE_ISO_CODES.EN,
    defaultLocale: LOCALE_ISO_CODES.EN,
  },
} satisfies Meta<typeof PreviewBanner>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
