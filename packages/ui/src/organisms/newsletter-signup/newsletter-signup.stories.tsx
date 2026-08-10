import type { Meta, StoryObj } from '@storybook/react-vite';

import { NewsletterSignup } from './newsletter-signup';

const meta = {
  title: 'Organisms/NewsletterSignup',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type TStory = StoryObj<typeof meta>;

/**
 * `NewsletterSignup` exposes two mutually-exclusive densities — `Full` (the
 * rich window-shell form) and `Compact` (the slim single-row strip) — shown
 * together here. See `Organisms/NewsletterSignup/Full` and
 * `Organisms/NewsletterSignup/Compact` for each density's own controls.
 */
export const Overview: TStory = {
  render: () => (
    <div className="flex flex-col gap-8">
      <NewsletterSignup.Full
        email=""
        onChange={() => {}}
        onSubmit={() => {}}
        status="idle"
        heading="$ subscribe --to weekly"
        description="New posts on rendering, type systems and the occasional OKLCH rabbit hole. No spam; unsubscribe in one line."
        submitLabel="subscribe ↵"
        emailAriaLabel="Email address"
        placeholder="you@domain.dev"
      />
      <NewsletterSignup.Compact
        email=""
        onChange={() => {}}
        onSubmit={() => {}}
        status="idle"
        heading="subscribe --email"
        prefix={<span aria-hidden="true">$</span>}
        submitLabel="subscribe ↵"
        emailAriaLabel="Email address"
        placeholder="you@domain.dev"
      />
    </div>
  ),
};
