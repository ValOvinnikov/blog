import { ALERT_TYPE } from '@blog/config';
import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert } from './alert';

const meta = {
  title: 'Atoms/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: objectKeys(ALERT_TYPE),
    },
  },
  args: {
    type: ALERT_TYPE.INFO,
    message: 'New posts land in your inbox roughly twice a month.',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Success: TStory = {
  args: {
    type: ALERT_TYPE.SUCCESS,
    message: 'Almost there — check your inbox to confirm.',
  },
};

export const Warning: TStory = {
  args: {
    type: ALERT_TYPE.WARNING,
    message: 'Your session expires in five minutes.',
  },
};

export const Error: TStory = {
  args: {
    type: ALERT_TYPE.ERROR,
    message: 'That email is already subscribed.',
  },
};

export const Info: TStory = {
  args: {
    type: ALERT_TYPE.INFO,
    message: 'New posts land in your inbox roughly twice a month.',
  },
};
