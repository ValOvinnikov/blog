import { CONTENT_ALIGNMENT, FORM_STATUSES } from '@blog/config';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Organisms/NewsletterSignup/Compact',
  component: NewsletterSignup.Compact,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    status: {
      control: 'select',
      options: FORM_STATUSES,
    },
    align: {
      control: 'select',
      options: objectKeys(newsletterSignupVariants.variants.align),
    },
  },
  args: {
    email: '',
    onChange: () => {},
    onSubmit: () => {},
    status: 'idle',
    heading: 'subscribe --email',
    headingId: 'newsletter-signup-compact-heading',
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
    errorMessageId: 'newsletter-signup-compact-error',
  },
};

export const WithoutPrefix: TStory = {
  args: { prefix: undefined },
};

export const Centered: TStory = {
  args: { align: CONTENT_ALIGNMENT.CENTER },
};

export const RightAligned: TStory = {
  args: { align: CONTENT_ALIGNMENT.RIGHT },
};

// Mirrors `Section`'s `brandVariant="BRAND_PRIMARY"` band treatment
// (`bg-brand-primary-muted surface-brand-primary`) so the strip's own
// opaque surface against that band stays checkable in isolation.
export const BrandPrimaryBand: TStory = {
  decorators: [
    (Story) => (
      <div className="surface-brand-primary bg-brand-primary-muted p-8">
        <Story />
      </div>
    ),
  ],
};

// The root's `flex-col`/`sm:flex-row` stacking is a real `sm:` media-query
// fork, not a container query — pinning `phone` (an intentional exception,
// see the `ui-storybook` skill) is the only way to default this story to a
// canvas under `sm` so the prefix+heading group's one-line layout, and the
// strip spanning the full width of its container below `sm`, are what
// actually render.
export const MobilePhone: TStory = {
  globals: { viewport: 'phone' },
  decorators: [
    (Story) => (
      <div className="border border-dashed border-brand-primary">
        <Story />
      </div>
    ),
  ],
};
