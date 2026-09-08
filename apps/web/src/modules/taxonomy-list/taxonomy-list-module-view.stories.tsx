import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import { HEADING_LEVELS } from '@blog/ui/lib/react';
import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  tagsListItems,
  topicsListItems,
} from '@web/testing/modules/taxonomy-list/fixtures';

import { TaxonomyListModuleView } from './taxonomy-list-module-view';
import { taxonomyListModuleViewVariants } from './taxonomy-list-module-view-variants';

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
    headingLevel: {
      control: 'select',
      options: HEADING_LEVELS,
    },
    contentAlignment: {
      control: 'select',
      options: objectKeys(taxonomyListModuleViewVariants.variants.align),
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: {
      heading: 'Browse by topic',
      supportingText: undefined,
    },
    items: topicsListItems,
    layout: undefined,
    contentAlignment: undefined,
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

export const Topics: TStory = {
  args: {
    sectionHeader: { heading: 'Browse by topic', supportingText: undefined },
    items: topicsListItems,
    titleId: 'topic-list-title',
    dataTestId: 'taxonomy-list-module-topic-list-1',
    accessibleTitle: 'Topics',
    emptyMessage: 'No topics yet.',
  },
};

export const Tags: TStory = {
  args: {
    sectionHeader: { heading: 'Browse by tag', supportingText: undefined },
    items: tagsListItems,
    titleId: 'tag-list-title',
    dataTestId: 'taxonomy-list-module-tag-list-1',
    accessibleTitle: 'Tags',
    emptyMessage: 'No tags yet.',
  },
};

export const WithoutCmsHeading: TStory = {
  args: {
    sectionHeader: {
      heading: undefined,
      supportingText: undefined,
    },
  },
};

export const Empty: TStory = {
  args: { items: [] },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};
