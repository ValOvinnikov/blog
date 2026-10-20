import { NEWSLETTER_RESULT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { NewsletterResultPage } from './newsletter-result-page';

const meta = {
  title: 'Pages/NewsletterResultPage',
  component: NewsletterResultPage,
  tags: ['autodocs'],
  args: { result: NEWSLETTER_RESULT.CONFIRMED },
  argTypes: {
    result: { control: 'select', options: Object.values(NEWSLETTER_RESULT) },
  },
} satisfies Meta<typeof NewsletterResultPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Confirmed: TStory = {};

export const Unsubscribed: TStory = {
  args: { result: NEWSLETTER_RESULT.UNSUBSCRIBED },
};

export const InvalidLink: TStory = {
  args: { result: NEWSLETTER_RESULT.CONFIRM_INVALID },
};
