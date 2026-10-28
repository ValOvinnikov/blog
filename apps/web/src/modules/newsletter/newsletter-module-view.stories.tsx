import { BRAND_VARIANT, NEWSLETTER_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockNewsletterModule } from '@web/testing/modules/newsletter/fixtures';
import { SessionProvider } from 'next-auth/react';

import { NewsletterModuleView } from './newsletter-module-view';

const meta = {
  title: 'Modules/NewsletterModule',
  component: NewsletterModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
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
    ...mockNewsletterModule({ content: faker.lorem.sentences(2) }),
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
