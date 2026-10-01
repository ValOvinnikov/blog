import { ASIDE_KIND, DEPTH } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DEPTH_STORAGE_KEY } from '@web/config/depth-script';
import { DepthProvider } from '@web/context/depth-provider';

import { DeepAside } from './deep-aside';

const meta = {
  title: 'Components/DeepAside',
  component: DeepAside,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    kind: {
      control: 'select',
      options: Object.values(ASIDE_KIND),
    },
  },
  args: {
    kind: ASIDE_KIND.DIGRESSION,
    label: 'Digression',
    children: (
      <p>
        This is a short tangent that adds color without being essential to the
        main argument — the kind of thing a deep-dive reader wants but a
        skimming reader can skip entirely.
      </p>
    ),
  },
} satisfies Meta<typeof DeepAside>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Digression: TStory = {};

export const WhyNot: TStory = {
  args: { kind: ASIDE_KIND.WHY_NOT, label: 'Why not X' },
};

export const Context: TStory = {
  args: { kind: ASIDE_KIND.CONTEXT, label: 'Context' },
};

export const AlwaysVisibleOutsideDepthProvider: TStory = {};

/** Inside a `DepthProvider` at the default `READ` depth, the aside is hidden. */
export const HiddenInReadDepth: TStory = {
  decorators: [
    (Story) => {
      localStorage.removeItem(DEPTH_STORAGE_KEY);
      return (
        <DepthProvider hasSkim={false} hasDeep={true}>
          <Story />
        </DepthProvider>
      );
    },
  ],
};

export const VisibleInDeepDepth: TStory = {
  decorators: [
    (Story) => {
      localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.DEEP);
      return (
        <DepthProvider hasSkim={false} hasDeep={true}>
          <Story />
        </DepthProvider>
      );
    },
  ],
};
