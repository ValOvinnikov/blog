import { NewsletterSignup } from '@blog/ui/organisms/newsletter-signup/newsletter-signup';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Organisms/NewsletterSignup/Full',
  component: NewsletterSignup.Full,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    email: '',
    onChange: () => {},
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
} satisfies Meta<typeof NewsletterSignup.Full>;

export default meta;
type TStory = StoryObj<typeof meta>;

/**
 * Access via `NewsletterSignup.Full` — the rich window-shell density used by
 * the site footer and CMS page-builder module.
 */
export const Default: TStory = {};

export const Submitting: TStory = {
  args: { status: 'submitting', email: 'reader@example.dev' },
};

export const Success: TStory = {
  args: { status: 'success' },
};

export const Error: TStory = {
  args: {
    status: 'error',
    email: 'not-an-email',
    errorMessage: 'That email is already subscribed.',
  },
};
