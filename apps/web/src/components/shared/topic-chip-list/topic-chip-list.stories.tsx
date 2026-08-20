import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';

import { TopicChipList } from './topic-chip-list';

const topics = [
  makeTopicWithPostCount({
    id: 'topic-1',
    title: 'Engineering',
    slug: 'engineering',
  }),
  makeTopicWithPostCount({ id: 'topic-2', title: 'Design', slug: 'design' }),
  makeTopicWithPostCount({ id: 'topic-3', title: 'Product', slug: 'product' }),
];

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
  args: { activeSlug: 'design' },
};

export const Empty: TStory = {
  args: { topics: [] },
};
