import { BRAND_VARIANT, CONTENT_ALIGNMENT, MEDIA_ORDER } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeFeatureHighlightItem } from '@web/testing/modules/feature-highlights/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { FeatureHighlightsModuleView } from './feature-highlights-module-view';

const highlights = [
  makeFeatureHighlightItem({
    id: 'highlight-1',
    heading: 'Ship faster',
    body: [
      portableTextBlock(
        'Every page ships pre-rendered, with ISR keeping content fresh.',
      ),
    ],
    action: {
      variant: ctaActionsDemo[0]!.variant,
      appearance: ctaActionsDemo[0]!.appearance,
      link: { ...ctaActionsDemo[0]!.link, label: 'Learn more' },
    },
  }),
  makeFeatureHighlightItem({
    id: 'highlight-2',
    heading: 'Built for scale',
    body: [portableTextBlock('Multi-tenant from the ground up.')],
    action: undefined,
  }),
];

const sixHighlights = [
  ...highlights,
  makeFeatureHighlightItem({
    id: 'highlight-3',
    heading: 'Secure by default',
    body: [portableTextBlock('Every tenant is isolated at the data layer.')],
    action: undefined,
  }),
  makeFeatureHighlightItem({
    id: 'highlight-4',
    heading: 'Observable in production',
    body: [portableTextBlock('Structured logs, from day one.')],
    action: undefined,
  }),
  makeFeatureHighlightItem({
    id: 'highlight-5',
    heading: 'Composable content',
    body: [portableTextBlock('A page-builder for every landing page.')],
    action: undefined,
  }),
  makeFeatureHighlightItem({
    id: 'highlight-6',
    heading: 'Accessible by construction',
    body: [portableTextBlock('Semantic HTML and real focus states.')],
    action: undefined,
  }),
];

const meta = {
  title: 'Modules/FeatureHighlightsModule',
  component: FeatureHighlightsModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
    contentAlignment: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
    mediaOrder: {
      control: 'select',
      options: Object.values(MEDIA_ORDER),
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock({ heading: 'Why teams choose us' }),
    highlights,
    ctaButtons: [],
    mediaOrder: MEDIA_ORDER.FIRST,
    contentAlignment: undefined,
    layout: undefined,
    titleId: 'feature-highlights-title',
    dataTestId: 'feature-highlights-module-feature-highlights-1',
  },
} satisfies Meta<typeof FeatureHighlightsModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const TwoRows: TStory = {};

export const TwoRowsImageLast: TStory = {
  args: { mediaOrder: MEDIA_ORDER.LAST },
};

export const SixRows: TStory = {
  args: { highlights: sixHighlights },
};

export const WithModuleActions: TStory = {
  args: { ctaButtons: ctaActionsDemo },
};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};
