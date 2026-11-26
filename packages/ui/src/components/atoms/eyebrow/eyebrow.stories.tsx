import { SHINEFOLD_PRESET_STORY } from '@shinefold/ui/testing/shinefold-preset';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Eyebrow } from './eyebrow';

const meta: Meta<typeof Eyebrow> = {
  title: 'Atoms/Eyebrow',
  component: Eyebrow,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Eyebrow>;

export const Default: TStory = {
  args: { children: 'Featured Post' },
};

export const TopicLabel: TStory = {
  args: { children: 'Engineering' },
};

export const AsTopicLink: TStory = {
  args: { children: 'Engineering', href: '/topics/engineering' },
};

export const ShinefoldPreset: TStory = {
  ...Default,
  ...SHINEFOLD_PRESET_STORY,
};

export const AsTopicLinkShinefoldPreset: TStory = {
  ...AsTopicLink,
  ...SHINEFOLD_PRESET_STORY,
};
