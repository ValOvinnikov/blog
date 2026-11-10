import { NEWSLETTER_VARIANT } from '@blog/config';
import { makeNewsletterSignupForm } from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NewsletterSignup } from './newsletter-signup';

faker.seed(123);

const meta = {
  title: 'Organisms/NewsletterSignup',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type TStory = StoryObj<typeof meta>;

/**
 * One `NewsletterSignup.Form` placed in each density — `Full` (the rich panel)
 * and `Compact` (the slim single-row strip). See
 * `Organisms/NewsletterSignup/Full` and `Organisms/NewsletterSignup/Compact`
 * for each density's own controls.
 */
export const Overview: TStory = {
  render: () => (
    <div className="flex flex-col gap-8">
      <NewsletterSignup.Full supportingText={faker.lorem.sentences(2)}>
        {makeNewsletterSignupForm({ placeholder: faker.internet.email() })}
      </NewsletterSignup.Full>
      <NewsletterSignup.Compact>
        {makeNewsletterSignupForm({
          variant: NEWSLETTER_VARIANT.COMPACT,
          placeholder: faker.internet.email(),
        })}
      </NewsletterSignup.Compact>
    </div>
  ),
};
