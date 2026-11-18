import { CTA_ACTION_APPEARANCE } from '@shinefold/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
} from '@web/testing/modules/cta/fixtures';
import { onImageDecorators } from '@web/testing/shared/on-image/decorators';

import { ActionGroup } from './action-group';

const shortAction = {
  ...MOCK_CTA_PRIMARY_ACTION,
  link: { ...MOCK_CTA_PRIMARY_ACTION.link, label: 'Go' },
};

const longAction = {
  ...MOCK_CTA_SECONDARY_ACTION,
  link: {
    ...MOCK_CTA_SECONDARY_ACTION.link,
    label: 'Learn more about our subscription plans',
  },
};

const meta = {
  title: 'Components/ActionGroup',
  component: ActionGroup,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { actions: [shortAction, longAction] },
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-3">
        <Story />
      </div>
    ),
  ],
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

export const OnImageContained: TStory = {
  args: {
    actions: [
      shortAction,
      { ...longAction, appearance: CTA_ACTION_APPEARANCE.CONTAINED },
    ],
  },
  decorators: onImageDecorators,
};

export const OnImageInline: TStory = {
  args: {
    actions: [
      {
        ...shortAction,
        appearance: CTA_ACTION_APPEARANCE.INLINE,
      },
      {
        ...longAction,
        appearance: CTA_ACTION_APPEARANCE.INLINE,
      },
    ],
  },
  decorators: onImageDecorators,
};

export const InlineAppearance: TStory = {
  args: {
    actions: [
      { ...shortAction, appearance: CTA_ACTION_APPEARANCE.INLINE },
      { ...longAction, appearance: CTA_ACTION_APPEARANCE.INLINE },
    ],
  },
};

export const ContainedAndInline: TStory = {
  args: {
    actions: [
      shortAction,
      { ...shortAction, appearance: CTA_ACTION_APPEARANCE.INLINE },
    ],
  },
};
