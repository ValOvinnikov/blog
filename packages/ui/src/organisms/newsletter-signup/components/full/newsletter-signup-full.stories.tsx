import { FORM_STATUSES, CONTENT_ALIGNMENT, ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { NewsletterSignup } from '@blog/ui/organisms/newsletter-signup/newsletter-signup';
import { newsletterSignupVariants } from '@blog/ui/organisms/newsletter-signup/newsletter-signup-variants';
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
 * Access via `NewsletterSignup.Full` — the rich window-shell density used by
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

// The pitch/form panes collapse from two columns to one at a real `md:`
// media-query breakpoint (not a container query), so this story pins the
// viewport to show the stacked mobile state — same precedent as
// `PrimaryNavigation`'s `MobileClosed`/`MobileOpen` stories.
export const MobilePhone: TStory = {
  globals: { viewport: 'phone' },
  args: { trustCues },
};

// `withThemeByClassName` drives the toolbar's light/dark toggle globally;
// pinning it here gives the dark surface/accent/divider treatment its own
// dedicated doc entry instead of relying on someone flipping the toolbar.
export const DarkTheme: TStory = {
  globals: { theme: 'dark' },
  args: { trustCues },
};
