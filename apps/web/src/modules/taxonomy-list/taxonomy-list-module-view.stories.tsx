import { BRAND_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TaxonomyListModuleView } from './taxonomy-list-module-view';

const items = [
  {
    id: 'topic-1',
    title: 'Engineering',
    description: 'Posts about building things.',
    postCountLabel: '5 posts',
    href: '/topics/engineering',
  },
  {
    id: 'topic-2',
    title: 'Design',
    description: 'Posts about craft and process.',
    postCountLabel: '1 post',
    href: '/topics/design',
  },
];

const meta = {
  title: 'Modules/TaxonomyListModule',
  component: TaxonomyListModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: {
      heading: 'Browse by topic',
      supportingText: undefined,
      align: undefined,
    },
    items,
    layout: undefined,
    titleId: 'topic-list-title',
    dataTestId: 'taxonomy-list-module-topic-list-1',
    headingLevel: 2,
    accessibleTitle: 'Topics',
    emptyMessage: 'No topics yet.',
  },
} satisfies Meta<typeof TaxonomyListModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithoutCmsHeading: TStory = {
  args: {
    sectionHeader: {
      heading: undefined,
      supportingText: undefined,
      align: undefined,
    },
  },
};

export const Empty: TStory = {
  args: { items: [] },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};
