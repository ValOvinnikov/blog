import { BRAND_VARIANT, NEWSLETTER_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeRequiredHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { NewsletterModuleView } from './newsletter-module-view';

const meta = {
  title: 'Modules/NewsletterModule',
  component: NewsletterModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
    variant: {
      control: 'select',
      options: [NEWSLETTER_VARIANT.FULL, NEWSLETTER_VARIANT.COMPACT],
    },
  },
  args: {
    id: 'newsletter-1',
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeRequiredHeadingBlock({
      heading: 'Get new posts in your inbox',
      supportingText: 'One email a week, no spam, unsubscribe anytime.',
    }),
    variant: NEWSLETTER_VARIANT.FULL,
    layout: undefined,
    contentAlignment: undefined,
    trustCues: ['No spam', 'Unsubscribe anytime'],
  },
} satisfies Meta<typeof NewsletterModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const Compact: TStory = {
  args: { variant: NEWSLETTER_VARIANT.COMPACT },
};
