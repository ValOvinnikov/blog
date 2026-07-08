import type { Meta, StoryObj } from '@storybook/react';

import { MetaSeparator } from './meta-separator';

const meta: Meta<typeof MetaSeparator> = {
  title: 'Atoms/MetaSeparator',
  component: MetaSeparator,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof MetaSeparator>;

export const Default: TStory = {
  args: {},
  decorators: [
    (Story) => (
      <span style={{ fontFamily: 'monospace' }}>
        Author
        <Story />
        Jan 1, 2025
      </span>
    ),
  ],
};
