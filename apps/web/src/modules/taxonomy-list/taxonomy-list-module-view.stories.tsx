import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@shinefold/config';
import { HEADING_LEVELS } from '@shinefold/ui/lib/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  MOCK_TAGS_LIST_ITEMS,
  MOCK_TOPICS_LIST_ITEMS,
} from '@web/testing/modules/taxonomy-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TaxonomyListModuleView } from './taxonomy-list-module-view';

const meta = {
  title: 'Modules/TaxonomyListModule',
  component: TaxonomyListModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    headingLevel: {
      control: 'select',
      options: HEADING_LEVELS,
    },
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
  },
  args: {
    section: { brandVariant: BRAND_VARIANT.PRIMARY, layout: undefined },
    headingBlock: mockHeadingBlock({ heading: 'Browse by topic' }),
    items: MOCK_TOPICS_LIST_ITEMS,
    contentAlignment: undefined,
    titleId: 'topic-list-title',
    dataTestId: 'taxonomy-list-module-topic-list-1',
    headingLevel: 2,
    emptyMessage: 'No topics yet.',
    showLatestPosts: true,
    latestLabel: 'Latest',
  },
} satisfies Meta<typeof TaxonomyListModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Tags: TStory = {
  args: {
    headingBlock: mockHeadingBlock({ heading: 'Browse by tag' }),
    items: MOCK_TAGS_LIST_ITEMS,
    titleId: 'tag-list-title',
    dataTestId: 'taxonomy-list-module-tag-list-1',
    emptyMessage: 'No tags yet.',
  },
};

export const Empty: TStory = {
  args: { items: [] },
};

export const WithoutLatestPosts: TStory = {
  args: { showLatestPosts: false },
};

export const Secondary: TStory = {
  args: { section: { brandVariant: BRAND_VARIANT.SECONDARY } },
};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};
