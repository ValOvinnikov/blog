import type { Meta, StoryObj } from '@storybook/react-vite';

import { NewsletterSignupCompact } from './components/compact/newsletter-signup-compact';

const meta = {
  title: 'Organisms/NewsletterSignup/Compact',
  component: NewsletterSignupCompact,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    email: '',
    onChange: () => {},
    onSubmit: () => {},
    status: 'idle',
    submitLabel: 'subscribe ↵',
    emailAriaLabel: 'Email address',
    placeholder: 'you@domain.dev',
    successMessage: 'Almost there — check your inbox to confirm.',
  },
} satisfies Meta<typeof NewsletterSignupCompact>;

export default meta;
type TStory = StoryObj<typeof meta>;

/**
 * Access via `NewsletterSignup.Compact` — the slim single-row strip for the
 * end of every article.
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
    errorMessage: 'Enter a valid email address.',
  },
};
