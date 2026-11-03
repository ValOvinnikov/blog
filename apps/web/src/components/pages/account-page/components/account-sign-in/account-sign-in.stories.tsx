import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AccountSignIn } from './account-sign-in';

const meta = {
  title: 'Pages/AccountPage/AccountSignIn',
  component: AccountSignIn,
  tags: ['autodocs'],
  args: {
    heading: 'Account',
    oauthProviderIds: ['github', 'google'],
  },
} satisfies Meta<typeof AccountSignIn>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const EmailOnly: TStory = {
  args: {
    oauthProviderIds: [],
  },
};
