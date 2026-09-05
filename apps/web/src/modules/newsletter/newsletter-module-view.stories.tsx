import { BRAND_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

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
  },
  args: {
    id: 'newsletter-1',
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: {
      heading: 'Get new posts in your inbox',
      supportingText: 'One email a week, no spam, unsubscribe anytime.',
    },
    layout: undefined,
    contentAlignment: undefined,
  },
} satisfies Meta<typeof NewsletterModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};
