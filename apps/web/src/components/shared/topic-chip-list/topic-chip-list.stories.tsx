import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  MOCK_SECOND_TOPIC,
  MOCK_ENGINEERING_TOPIC,
  MOCK_THIRD_TOPIC,
} from '@web/testing/shared/topic/fixtures';

import { TopicChipList } from './topic-chip-list';

const topics = [MOCK_ENGINEERING_TOPIC, MOCK_SECOND_TOPIC, MOCK_THIRD_TOPIC];

const meta = {
  title: 'Components/TopicChipList',
  component: TopicChipList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { topics },
} satisfies Meta<typeof TopicChipList>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** No `activeSlug` — the "All" chip reads as active, as on `/blog`. */
export const AllActive: TStory = {};

/** `activeSlug` highlights the matching chip instead, as on `/topics/[slug]`. */
export const TopicActive: TStory = {
  args: { activeSlug: MOCK_SECOND_TOPIC.slug },
};

export const Empty: TStory = {
  args: { topics: [] },
};
