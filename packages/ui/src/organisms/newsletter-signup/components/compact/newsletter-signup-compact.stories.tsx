import { NewsletterSignup } from '@blog/ui/organisms/newsletter-signup/newsletter-signup';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Organisms/NewsletterSignup/Compact',
  component: NewsletterSignup.Compact,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    email: '',
    onChange: () => {},
    onSubmit: () => {},
    status: 'idle',
    heading: 'subscribe --email',
    prefix: <span aria-hidden="true">$</span>,
    submitLabel: 'subscribe ↵',
    emailAriaLabel: 'Email address',
    placeholder: 'you@domain.dev',
    successMessage: 'Almost there — check your inbox to confirm.',
  },
} satisfies Meta<typeof NewsletterSignup.Compact>;

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

export const WithoutPrefix: TStory = {
  args: { prefix: undefined },
};

// The root's `flex-col`/`sm:flex-row` stacking is a real `sm:` media-query
// fork, not a container query — pinning `phone` (an intentional exception,
// see the `ui-storybook` skill) is the only way to default this story to a
// canvas under `sm` so the prefix+heading group's one-line layout (and the
// strip's content-sized, not full-width, footprint) is what actually renders.
export const MobilePhone: TStory = {
  globals: { viewport: 'phone' },
};
