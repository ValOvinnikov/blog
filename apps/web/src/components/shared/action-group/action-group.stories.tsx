import { CTA_ACTION_APPEARANCE, CTA_ACTION_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ActionGroup } from './action-group';

const shortAction = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Go',
    href: '/blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

const longAction = {
  variant: CTA_ACTION_VARIANT.SECONDARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Learn more about our subscription plans',
    href: '/about-us',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

const meta = {
  title: 'Components/ActionGroup',
  component: ActionGroup,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { actions: [shortAction, longAction] },
} satisfies Meta<typeof ActionGroup>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** A short and a long label share the same minimum width from `sm` up. */
export const MixedLabelLengths: TStory = {
  globals: { viewport: 'desktop' },
};

export const MobileStacked: TStory = {
  globals: { viewport: 'mobile' },
};

export const InlineAppearance: TStory = {
  args: {
    actions: [
      { ...shortAction, appearance: CTA_ACTION_APPEARANCE.INLINE },
      { ...longAction, appearance: CTA_ACTION_APPEARANCE.INLINE },
    ],
  },
};
