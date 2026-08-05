import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusBadge } from './status-badge';
import { statusBadgeVariants } from './status-badge-variants';

const meta = {
  title: 'Atoms/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: objectKeys(statusBadgeVariants.variants.tone),
    },
  },
  args: {
    tone: 'ok',
    children: 'subscribed',
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Ok: TStory = {
  args: { tone: 'ok', children: 'subscribed' },
};

export const Warn: TStory = {
  args: { tone: 'warn', children: 'pending confirmation' },
};

export const Neutral: TStory = {
  args: { tone: 'neutral', children: 'not linked' },
};
