import { ALERT_TONE } from '@blog/config';
import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert } from './alert';

const meta = {
  title: 'Atoms/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: objectKeys(ALERT_TONE),
    },
  },
  args: {
    tone: ALERT_TONE.INFO,
    children: 'New posts land in your inbox roughly twice a month.',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Success: TStory = {
  args: {
    tone: ALERT_TONE.SUCCESS,
    children: 'Almost there — check your inbox to confirm.',
  },
};

export const Warning: TStory = {
  args: {
    tone: ALERT_TONE.WARNING,
    children: 'Your session expires in five minutes.',
  },
};

export const Error: TStory = {
  args: {
    tone: ALERT_TONE.ERROR,
    children: 'That email is already subscribed.',
  },
};

export const Info: TStory = {
  args: {
    tone: ALERT_TONE.INFO,
    children: 'New posts land in your inbox roughly twice a month.',
  },
};
