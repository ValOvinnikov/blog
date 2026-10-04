import { FORM_STATUSES, CONTENT_ALIGNMENT, ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

const trustCues = [
  {
    icon: <Icon name={ICONS.SHIELD_CHECK} size={SIZE.SM} />,
    label: 'No spam',
  },
  {
    icon: <Icon name={ICONS.CLOSE} size={SIZE.SM} />,
    label: 'Unsubscribe in one line',
  },
];

const meta = {
  title: 'Organisms/NewsletterSignup/Full',
  component: NewsletterSignup.Full,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    align: {
      control: 'select',
      options: objectKeys(newsletterSignupVariants.variants.align),
    },
    status: {
      control: 'select',
      options: FORM_STATUSES,
    },
  },
  args: {
    email: '',
    onChange: () => {},
    onSubmit: () => {},
    status: 'idle',
    heading: '$ subscribe --to weekly',
    headingId: 'newsletter-signup-full-heading',
    supportingText:
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
 * Access via `NewsletterSignup.Full` — the rich panel density used by
 * the site footer and CMS page-builder module, split into a pitch pane and a
 * form pane side by side on desktop.
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
    errorMessageId: 'newsletter-signup-full-error',
  },
};

export const WithTrustCues: TStory = {
  args: { trustCues },
};

export const Centered: TStory = {
  args: { align: CONTENT_ALIGNMENT.CENTER, trustCues },
};

export const RightAligned: TStory = {
  args: { align: CONTENT_ALIGNMENT.RIGHT, trustCues },
};

export const MobilePhone: TStory = {
  globals: { viewport: 'phone' },
  args: { trustCues },
};

export const NarrowContainer: TStory = {
  decorators: [
    (Story) => (
      <div className="max-w-prose">
        <Story />
      </div>
    ),
  ],
  args: { trustCues },
};

export const WideContainer: TStory = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl">
        <Story />
      </div>
    ),
  ],
  args: { trustCues },
};

export const BrandPrimaryBand: TStory = {
  decorators: [
    (Story) => (
      <div className="surface-brand-primary bg-brand-primary-muted p-8">
        <Story />
      </div>
    ),
  ],
  args: { trustCues },
};

export const DarkTheme: TStory = {
  globals: { theme: 'dark' },
  args: { trustCues },
};
