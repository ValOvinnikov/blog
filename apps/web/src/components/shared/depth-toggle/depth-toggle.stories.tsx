import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DepthProvider } from '@web/context/depth-provider';
import { userEvent, within } from 'storybook/test';

import { DepthToggle } from './depth-toggle';

const labels = {
  skim: '30s',
  read: 'Read',
  deep: 'Deep',
  ariaLabel: 'Reading depth',
};

const meta = {
  title: 'Components/DepthToggle',
  component: DepthToggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { hasSkim: true, hasDeep: true, labels },
  decorators: [
    (Story, { args }) => (
      <DepthProvider
        hasSkim={Boolean(args.hasSkim)}
        hasDeep={Boolean(args.hasDeep)}
      >
        <Story />
      </DepthProvider>
    ),
  ],
} satisfies Meta<typeof DepthToggle>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const AllThreeOptions: TStory = {};

export const SkimOnly: TStory = {
  args: { hasDeep: false },
};

export const DeepOnly: TStory = {
  args: { hasSkim: false },
};

/** Neither `hasSkim` nor `hasDeep` — the toggle renders nothing. */
export const NoOptions: TStory = {
  args: { hasSkim: false, hasDeep: false },
};

export const DeepSelected: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Deep' }));
  },
};
