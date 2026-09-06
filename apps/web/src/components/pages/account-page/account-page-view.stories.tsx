import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeAccountPageView } from '@web/testing/pages/account-page/fixtures';

import { AccountPageView } from './account-page-view';

const meta = {
  title: 'Pages/AccountPageView',
  component: AccountPageView,
  tags: ['autodocs'],
  args: makeAccountPageView(),
} satisfies Meta<typeof AccountPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoNewsletterSection: TStory = {
  args: {
    newsletterSection: undefined,
  },
};
