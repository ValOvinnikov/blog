import { ASIDE_KIND } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

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
  decorators: [
    // The real gate is CSS only, keyed off the nearest `DepthProvider`
    // wrapper's `data-depth` attribute — this mimics that exact wrapper
    // shape directly rather than pulling in the full provider/localStorage
    // machinery, since `DeepAside`'s children have no `useDepth()` call of
    // their own to satisfy.
    (Story) => (
      <div className="group/depth" data-depth="DEEP">
        <Story />
      </div>
    ),
  ],
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

/** Outside the `DEEP` depth, the CSS gate hides the aside entirely. */
export const HiddenOutsideDeepDepth: TStory = {
  decorators: [
    (Story) => (
      <div className="group/depth" data-depth="READ">
        <Story />
      </div>
    ),
  ],
};
