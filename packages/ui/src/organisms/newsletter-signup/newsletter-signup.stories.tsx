import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NewsletterSignup } from './newsletter-signup';
import { newsletterSignupVariants } from './newsletter-signup-variants';

const meta = {
  title: 'Organisms/NewsletterSignup',
  component: NewsletterSignup,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'select',
      options: objectKeys(newsletterSignupVariants.variants.variant),
    },
  },
  args: {
    email: '',
    onEmailChange: () => {},
    onSubmit: () => {},
    status: 'idle',
    heading: '$ subscribe --to weekly',
    description:
      'New posts on rendering, type systems and the occasional OKLCH rabbit hole. No spam; unsubscribe in one line.',
    submitLabel: 'subscribe ↵',
    emailAriaLabel: 'Email address',
    placeholder: 'you@domain.dev',
    successMessage: 'Almost there — check your inbox to confirm.',
  },
} satisfies Meta<typeof NewsletterSignup>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Full: TStory = {};

export const FullSubmitting: TStory = {
  args: { status: 'submitting', email: 'reader@example.dev' },
};

export const FullSuccess: TStory = {
  args: { status: 'success' },
};

export const FullError: TStory = {
  args: {
    status: 'error',
    email: 'not-an-email',
    errorMessage: 'That email is already subscribed.',
  },
};

export const Compact: TStory = {
  args: { variant: 'compact' },
};

export const CompactSubmitting: TStory = {
  args: {
    variant: 'compact',
    status: 'submitting',
    email: 'reader@example.dev',
  },
};

export const CompactSuccess: TStory = {
  args: { variant: 'compact', status: 'success' },
};

export const CompactError: TStory = {
  args: {
    variant: 'compact',
    status: 'error',
    email: 'not-an-email',
    errorMessage: 'Enter a valid email address.',
  },
};
