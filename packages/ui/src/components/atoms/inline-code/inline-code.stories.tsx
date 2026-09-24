import type { Meta, StoryObj } from '@storybook/react-vite';

import { InlineCode } from './inline-code';

const meta: Meta<typeof InlineCode> = {
  title: 'Atoms/InlineCode',
  component: InlineCode,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof InlineCode>;

export const Default: TStory = {
  args: { children: 'pnpm --filter @blog/ui test' },
};

export const InSentence: TStory = {
  render: (args) => (
    <p>
      Run <InlineCode {...args} /> before opening a pull request.
    </p>
  ),
  args: { children: 'pnpm lint' },
};
